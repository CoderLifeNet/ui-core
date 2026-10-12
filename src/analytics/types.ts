import type { UIEvent } from "../extensions/types.js";
import type { ExtensionDispatchContext } from "../extensions/types.js";

export type ConsentStatus = "granted" | "denied";

export interface AnalyticsConsent {
  analyticsStorage: ConsentStatus;
  adStorage: ConsentStatus;
}

export interface AnalyticsAdapterConfig {
  enabled: boolean;
  sampleRate: number;
}

export interface AnalyticsDispatchContext extends ExtensionDispatchContext {
  consent: AnalyticsConsent;
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
  configure?: (config: AnalyticsAdapterConfig, context?: AnalyticsDispatchContext) => void | Promise<void>;
  onEvent: (event: UIEvent, context?: AnalyticsDispatchContext) => void | Promise<void>;
  dispose?: () => void | Promise<void>;
}

export interface AnalyticsSetAdaptersOptions {
  disposeRemoved?: boolean;
}

export interface AnalyticsRuntime {
  update: (next: Partial<AnalyticsDispatchConfig>) => void;
  dispatch: (event: UIEvent, context?: Partial<ExtensionDispatchContext>) => void;
  setAdapters: (next: AnalyticsAdapter[], options?: AnalyticsSetAdaptersOptions) => void;
  dispose: () => void;
}
