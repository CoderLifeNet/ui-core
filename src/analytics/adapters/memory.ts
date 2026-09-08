import type { UIEvent } from "../../extensions/types.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export interface MemoryAdapter extends AnalyticsAdapter {
  read: () => readonly UIEvent[];
  clear: () => void;
}

export function createMemoryAdapter(id = "memory"): MemoryAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };
  const events: UIEvent[] = [];

  return {
    id,
    kind: "memory",
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event) => {
      if (!adapterConfig.enabled) {
        return;
      }
      events.push(event);
    },
    read: () => events,
    clear: () => {
      events.splice(0, events.length);
    }
  };
}
