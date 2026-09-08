import type { ReactNode } from "react";

export type UIEventSchemaVersion = "1.0.0";

export interface UIEvent<TType extends string = string> {
  schemaVersion: UIEventSchemaVersion;
  type: TType;
  action: string;
  component: string;
  semanticId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  timestamp: number;
}

export interface ExtensionDispatchContext {
  trackingPath: readonly string[];
  optedOut: boolean;
}

export interface UIExtension {
  id: string;
  category: "instrumentation" | "custom";
  onEvent?: (event: UIEvent, context: ExtensionDispatchContext) => void | Promise<void>;
  configure?: (config: unknown) => void;
  dispose?: () => void;
}

export interface UIExtensionsConfig {
  enabled: boolean;
  debug: boolean;
}

export interface UIExtensionsContextValue {
  emit: (event: Omit<UIEvent, "schemaVersion" | "timestamp">, context?: Partial<ExtensionDispatchContext>) => void;
  register: (extension: UIExtension) => () => void;
  updateConfig: (next: Partial<UIExtensionsConfig>) => void;
  getConfig: () => Readonly<UIExtensionsConfig>;
}

export interface UIExtensionsProviderProps {
  children: ReactNode;
  extensions?: UIExtension[];
  initialConfig?: Partial<UIExtensionsConfig>;
}

export interface TrackingBoundaryValue {
  trackingPath: readonly string[];
  optedOut: boolean;
}
