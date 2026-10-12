import type { UIEvent } from "../extensions/types.js";
import type { ExtensionDispatchContext } from "../extensions/types.js";
import type {
  AnalyticsAdapter,
  AnalyticsConsent,
  AnalyticsDispatchContext,
  AnalyticsDispatchConfig,
  AnalyticsRuntime,
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
  initialConfig?: Partial<AnalyticsDispatchConfig>
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

  const deliverEvent = (event: Parameters<AnalyticsRuntime["dispatch"]>[0], context?: Partial<ExtensionDispatchContext>): void => {
    const dispatchContext = buildDispatchContext(context);

    if (dispatchContext.optedOut) {
      return;
    }
    if (!config.enabled) {
      return;
    }
    if (config.consent.analyticsStorage !== "granted") {
      return;
    }
    if (!passesAllowlist(event.component, config.componentAllowlist)) {
      return;
    }
    if (!passesAllowlist(event.type, config.eventAllowlist)) {
      return;
    }
    for (const adapter of adapters) {
      const adapterEnabled = config.adapterEnabled?.[adapter.id] ?? config.enabled;
      if (!adapterEnabled) {
        continue;
      }
      if (adapter.kind === "meta-pixel" && config.consent.adStorage !== "granted") {
        continue;
      }
      if (!shouldSample(clampSampleRate(config.adapterSampleRate?.[adapter.id] ?? config.defaultSampleRate ?? 1))) {
        continue;
      }
      try {
        const result = adapter.onEvent(event, dispatchContext);
        if (result && typeof (result as Promise<void>).catch === "function") {
          void (result as Promise<void>).catch(() => undefined);
        }
      } catch {
        // Adapter failures must not escape user interactions.
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
    update: (next) => {
      config = {
        ...config,
        ...next,
        consent: {
          ...config.consent,
          ...(next.consent ?? {})
        }
      };
      applyAdapterConfig();
    },
    dispatch: (event, context) => {
      if (pendingConfigureCount > 0) {
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
