import type { UIEvent } from "../extensions/types.js";
import type { ExtensionDispatchContext, UIEventBlockReason, UIEventIdentity } from "../extensions/types.js";

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
  kind: "ga4" | "umami" | "adobe" | "meta-pixel" | "custom" | "memory";
  isAvailable?: () => boolean;
  configure?: (config: AnalyticsAdapterConfig, context?: AnalyticsDispatchContext) => void | Promise<void>;
  onEvent: (event: UIEvent, context?: AnalyticsDispatchContext) => void | Promise<void>;
  dispose?: () => void | Promise<void>;
}

export type AnalyticsBlockReason = UIEventBlockReason | "analytics_disabled" | "analytics_consent_denied" |
  "component_filter" | "event_filter" | "no_adapters" | "adapter_disabled" | "ad_consent_denied" | "sampled_out";

export type AnalyticsDiagnosticDetail =
  | { status: "blocked"; reason: AnalyticsBlockReason; adapterId?: string }
  | { status: "dispatched" | "tracker_unavailable" | "failed"; adapterId: string };

export type AnalyticsDiagnostic = UIEventIdentity & AnalyticsDiagnosticDetail;

export interface AnalyticsRuntimeOptions {
  onDiagnostic?: (diagnostic: AnalyticsDiagnostic) => void | Promise<void>;
}

export interface AnalyticsSetAdaptersOptions {
  disposeRemoved?: boolean;
}

export interface AnalyticsRuntime {
  reportBlocked?: (event: UIEventIdentity, reason: UIEventBlockReason) => void;
  update: (next: Partial<AnalyticsDispatchConfig>) => void;
  dispatch: (event: UIEvent, context?: Partial<ExtensionDispatchContext>) => void;
  setAdapters: (next: AnalyticsAdapter[], options?: AnalyticsSetAdaptersOptions) => void;
  dispose: () => void;
}
