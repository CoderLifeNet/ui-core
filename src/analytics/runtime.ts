import type { UIEvent } from "../extensions/types.js";
import type { ExtensionDispatchContext } from "../extensions/types.js";
import type {
  AnalyticsAdapter,
  AnalyticsConsent,
  AnalyticsDispatchContext,
  AnalyticsDispatchConfig,
  AnalyticsRuntime
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
  adapters: AnalyticsAdapter[],
  initialConfig?: Partial<AnalyticsDispatchConfig>
): AnalyticsRuntime {
  let config: AnalyticsDispatchConfig = {
    enabled: false,
    consent: defaultConsent,
    debug: false,
    ...initialConfig
  };

  const buildDispatchContext = (context?: Partial<ExtensionDispatchContext>): AnalyticsDispatchContext => ({
    trackingPath: context?.trackingPath ?? [],
    optedOut: context?.optedOut ?? false,
    consent: config.consent
  });

  const applyAdapterConfig = (): void => {
    const dispatchContext = buildDispatchContext();
    for (const adapter of adapters) {
      const enabled = config.adapterEnabled?.[adapter.id] ?? config.enabled;
      const sampleRate = clampSampleRate(config.adapterSampleRate?.[adapter.id] ?? config.defaultSampleRate ?? 1);

      try {
        const result = adapter.configure?.({ enabled, sampleRate }, dispatchContext);
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch(() => undefined);
        }
      } catch {
        // Configure failures must not escape the runtime.
      }
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
            (result as Promise<void>).catch(() => undefined);
          }
        } catch {
          // Adapter failures must not escape user interactions.
        }
      }
    },
    dispose: () => {
      for (const adapter of adapters) {
        try {
          adapter.dispose?.();
        } catch {
          // Dispose failures are intentionally swallowed.
        }
      }
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
