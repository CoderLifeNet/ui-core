import type { UIEvent } from "../../extensions/types.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig, AnalyticsDispatchContext } from "../types.js";

export interface MemoryAdapter extends AnalyticsAdapter {
  read: () => readonly UIEvent[];
  readContext: () => readonly AnalyticsDispatchContext[];
  clear: () => void;
}

export function createMemoryAdapter(id = "memory"): MemoryAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };
  const events: UIEvent[] = [];
  const contexts: AnalyticsDispatchContext[] = [];

  return {
    id,
    kind: "memory",
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event, context) => {
      if (!adapterConfig.enabled) {
        return;
      }
      events.push(event);
      contexts.push({
        trackingPath: context?.trackingPath ?? [],
        optedOut: context?.optedOut ?? false,
        consent: context?.consent ?? { analyticsStorage: "denied", adStorage: "denied" }
      });
    },
    read: () => events,
    readContext: () => contexts,
    clear: () => {
      events.splice(0, events.length);
      contexts.splice(0, contexts.length);
    }
  };
}
