import type { UIEvent } from "../extensions/types.js";
import type { ExtensionDispatchContext, UIEventIdentity } from "../extensions/types.js";
import type {
  AnalyticsAdapter,
  AnalyticsBlockReason,
  AnalyticsConsent,
  AnalyticsDiagnosticDetail,
  AnalyticsDispatchContext,
  AnalyticsDispatchConfig,
  AnalyticsRuntime,
  AnalyticsRuntimeOptions,
  AnalyticsSetAdaptersOptions
} from "./types.js";

const defaultConsent: AnalyticsConsent = {
  analyticsStorage: "denied",
  adStorage: "denied"
};

function passesAllowlist(value: string, allowlist?: string[]): boolean {
  if (!allowlist || allowlist.length === 0) {
    return true;
  }
  return allowlist.includes(value);
}

function clampSampleRate(sampleRate: number): number {
  if (!Number.isFinite(sampleRate)) {
    return 0;
  }
  return Math.max(0, Math.min(1, sampleRate));
}

function shouldSample(sampleRate: number): boolean {
  if (sampleRate <= 0) {
    return false;
  }
  if (sampleRate >= 1) {
    return true;
  }
  return Math.random() < sampleRate;
}

export function createAnalyticsRuntime(
  initialAdapters: AnalyticsAdapter[],
  initialConfig?: Partial<AnalyticsDispatchConfig>,
  options: AnalyticsRuntimeOptions = {}
): AnalyticsRuntime {
  let config: AnalyticsDispatchConfig = {
    enabled: false,
    consent: defaultConsent,
    debug: false,
    ...initialConfig
  };

  const dedupeAdapters = (list: AnalyticsAdapter[]): AnalyticsAdapter[] => {
    const byId = new Map<string, AnalyticsAdapter>();
    for (const adapter of list) {
      byId.set(adapter.id, adapter);
    }
    return [...byId.values()];
  };

  let adapters = dedupeAdapters(initialAdapters);
  let pendingConfigureCount = 0;
  const queuedDispatches: Array<{ event: Parameters<AnalyticsRuntime["dispatch"]>[0]; context?: Partial<ExtensionDispatchContext> }> = [];

  const buildDispatchContext = (context?: Partial<ExtensionDispatchContext>): AnalyticsDispatchContext => ({
    trackingPath: context?.trackingPath ?? [],
    optedOut: context?.optedOut ?? false,
    consent: config.consent
  });

  const observer = options.onDiagnostic;
  const report = ({ type, component }: UIEventIdentity, detail: AnalyticsDiagnosticDetail): void => {
    try {
      void observer?.({ type, component, ...detail })?.catch(() => undefined);
    } catch {
      // Diagnostics must not break host interactions.
    }
  };

  const blockReason = (event: UIEvent, context?: Partial<ExtensionDispatchContext>): AnalyticsBlockReason | undefined => {
    if (context?.optedOut) return "scope_opt_out";
    if (!config.enabled) return "analytics_disabled";
    if (config.consent.analyticsStorage !== "granted") return "analytics_consent_denied";
    if (!passesAllowlist(event.component, config.componentAllowlist)) return "component_filter";
    if (!passesAllowlist(event.type, config.eventAllowlist)) return "event_filter";
    if (adapters.length === 0) return "no_adapters";
    return undefined;
  };

  const deliverEvent = (event: UIEvent, context?: Partial<ExtensionDispatchContext>): void => {
    const reason = blockReason(event, context);
    if (reason) {
      if (observer) report(event, { status: "blocked", reason });
      return;
    }
    for (const adapter of adapters) {
      const adapterId = adapter.id;
      const adapterEnabled = config.adapterEnabled?.[adapterId] ?? config.enabled;
      if (!adapterEnabled) {
        if (observer) report(event, { status: "blocked", reason: "adapter_disabled", adapterId });
        continue;
      }
      if (adapter.kind === "meta-pixel" && config.consent.adStorage !== "granted") {
        if (observer) report(event, { status: "blocked", reason: "ad_consent_denied", adapterId });
        continue;
      }
      if (!shouldSample(clampSampleRate(config.adapterSampleRate?.[adapterId] ?? config.defaultSampleRate ?? 1))) {
        if (observer) report(event, { status: "blocked", reason: "sampled_out", adapterId });
        continue;
      }
      try {
        if (adapter.isAvailable?.() === false) {
          if (observer) report(event, { status: "tracker_unavailable", adapterId });
          continue;
        }
        const currentBlockReason = blockReason(event, context);
        if (currentBlockReason) {
          if (observer) report(event, { status: "blocked", reason: currentBlockReason });
          return;
        }
        const result = adapter.onEvent(event, buildDispatchContext(context));
        if (result) {
          void Promise.resolve(result).then(
            () => { if (observer) report(event, { status: "dispatched", adapterId }); },
            () => { if (observer) report(event, { status: "failed", adapterId }); }
          );
        } else if (observer) {
          report(event, { status: "dispatched", adapterId });
        }
      } catch {
        if (observer) report(event, { status: "failed", adapterId });
      }
    }
  };

  const flushQueuedDispatchesIfReady = (): void => {
    if (pendingConfigureCount > 0 || queuedDispatches.length === 0) {
      return;
    }

    const pending = queuedDispatches.splice(0, queuedDispatches.length);
    for (const queued of pending) {
      deliverEvent(queued.event, queued.context);
    }
  };

  const applyAdapterConfig = (): void => {
    const dispatchContext = buildDispatchContext();
    for (const adapter of adapters) {
      const enabled = config.adapterEnabled?.[adapter.id] ?? config.enabled;
      const sampleRate = clampSampleRate(config.adapterSampleRate?.[adapter.id] ?? config.defaultSampleRate ?? 1);

      try {
        const result = adapter.configure?.({ enabled, sampleRate }, dispatchContext);
        if (result && typeof (result as Promise<void>).catch === "function") {
          pendingConfigureCount += 1;
          void (result as Promise<void>)
            .catch(() => undefined)
            .finally(() => {
              pendingConfigureCount = Math.max(0, pendingConfigureCount - 1);
              flushQueuedDispatchesIfReady();
            });
        }
      } catch {
        // Configure failures must not escape the runtime.
      }
    }

    flushQueuedDispatchesIfReady();
  };

  const disposeAdapter = (adapter: AnalyticsAdapter): void => {
    try {
      const result = adapter.dispose?.();
      if (result && typeof (result as Promise<void>).catch === "function") {
        void (result as Promise<void>).catch(() => undefined);
      }
    } catch {
      // Dispose failures are intentionally swallowed.
    }
  };

  applyAdapterConfig();

  return {
    ...(observer ? { reportBlocked: (event: UIEventIdentity, reason: AnalyticsBlockReason) => {
      report(event, { status: "blocked", reason });
    } } : {}),
    update: (next) => {
      config = {
        ...config,
        ...next,
        consent: {
          ...config.consent,
          ...(next.consent ?? {})
        }
      };
      if (!config.enabled || config.consent.analyticsStorage !== "granted") {
        for (const { event } of queuedDispatches.splice(0)) {
          if (observer) report(event, { status: "blocked", reason: config.enabled ? "analytics_consent_denied" : "analytics_disabled" });
        }
      }
      applyAdapterConfig();
    },
    dispatch: (event, context) => {
      if (pendingConfigureCount > 0) {
        const reason = blockReason(event, context);
        if (reason) {
          if (observer) report(event, { status: "blocked", reason });
          return;
        }
        queuedDispatches.push(context ? { event, context } : { event });
        return;
      }

      deliverEvent(event, context);
    },
    setAdapters: (next, options: AnalyticsSetAdaptersOptions = {}) => {
      const nextAdapters = dedupeAdapters(next);
      if (options.disposeRemoved !== false) {
        for (const previousAdapter of adapters) {
          const retained = nextAdapters.find((candidate) => candidate.id === previousAdapter.id);
          if (!retained || retained !== previousAdapter) {
            disposeAdapter(previousAdapter);
          }
        }
      }

      adapters = nextAdapters;
      applyAdapterConfig();
    },
    dispose: () => {
      for (const adapter of adapters) {
        disposeAdapter(adapter);
      }
      adapters = [];
      queuedDispatches.length = 0;
    }
  };
}

export function sanitizeMetadata(
  metadata: UIEvent["metadata"],
  reservedKeys: readonly string[] = []
): Record<string, string | number | boolean | null> {
  if (!metadata) {
    return {};
  }

  const reserved = new Set(reservedKeys);

  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (reserved.has(key)) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      output[key] = value;
    }
  }
  return output;
}
