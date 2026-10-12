import type { AnalyticsRuntime } from "../analytics/types.js";
import type { UIExtension } from "./types.js";

export interface CreateAnalyticsExtensionOptions {
  disposeRuntimeOnCleanup?: boolean;
}

export function createAnalyticsExtension(
  runtime: AnalyticsRuntime,
  options: CreateAnalyticsExtensionOptions = {}
): UIExtension {
  return {
    id: "analytics-runtime",
    category: "instrumentation",
    onEvent: (event, context) => {
      runtime.dispatch(event, context);
    },
    dispose: () => {
      if (options.disposeRuntimeOnCleanup) {
        runtime.dispose();
      }
    }
  };
}
