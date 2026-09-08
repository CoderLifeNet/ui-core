import type { UIEvent } from "../extensions/types.js";

export type ConsentStatus = "granted" | "denied";

export interface AnalyticsConsent {
  analyticsStorage: ConsentStatus;
  adStorage: ConsentStatus;
}

export interface AnalyticsAdapterConfig {
  enabled: boolean;
  sampleRate: number;
}

export interface AnalyticsDispatchConfig {
  enabled: boolean;
  consent: AnalyticsConsent;
  debug: boolean;
  componentAllowlist?: string[];
  eventAllowlist?: string[];
  defaultSampleRate?: number;
  adapterEnabled?: Record<string, boolean>;
  adapterSampleRate?: Record<string, number>;
}

export interface AnalyticsAdapter {
  id: string;
  kind: "ga4" | "adobe" | "meta-pixel" | "custom" | "memory";
  configure?: (config: AnalyticsAdapterConfig) => void;
  onEvent: (event: UIEvent) => void | Promise<void>;
  dispose?: () => void;
}

export interface AnalyticsRuntime {
  update: (next: Partial<AnalyticsDispatchConfig>) => void;
  dispatch: (event: UIEvent) => void;
  dispose: () => void;
}
