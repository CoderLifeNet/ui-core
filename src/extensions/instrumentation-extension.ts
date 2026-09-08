import type { AnalyticsRuntime } from "../analytics/types.js";
import type { UIExtension } from "./types.js";

export function createAnalyticsExtension(runtime: AnalyticsRuntime): UIExtension {
  return {
    id: "analytics-runtime",
    category: "instrumentation",
    onEvent: (event) => {
      runtime.dispatch(event);
    },
    dispose: () => {
      runtime.dispose();
    }
  };
}
