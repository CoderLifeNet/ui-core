import type { UIEvent } from "../extensions/types.js";
import type {
  AnalyticsAdapter,
  AnalyticsAdapterConfig,
  AnalyticsConsent,
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

  const applyAdapterConfig = (): void => {
    for (const adapter of adapters) {
      const enabled = config.adapterEnabled?.[adapter.id] ?? config.enabled;
      const sampleRate = clampSampleRate(config.adapterSampleRate?.[adapter.id] ?? config.defaultSampleRate ?? 1);
      adapter.configure?.({ enabled, sampleRate });
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
    dispatch: (event) => {
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
        if (!shouldSample(clampSampleRate(config.adapterSampleRate?.[adapter.id] ?? config.defaultSampleRate ?? 1))) {
          continue;
        }
        try {
          const result = adapter.onEvent(event);
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

export function sanitizeMetadata(metadata: UIEvent["metadata"]): Record<string, string | number | boolean | null> {
  if (!metadata) {
    return {};
  }

  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      output[key] = value;
    }
  }
  return output;
}
