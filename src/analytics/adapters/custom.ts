import type { UIEvent } from "../../extensions/types.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export interface CustomAdapterOptions {
  id: string;
  onEvent: (event: UIEvent) => void | Promise<void>;
}

export function createCustomAdapter(options: CustomAdapterOptions): AnalyticsAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };

  return {
    id: options.id,
    kind: "custom",
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event) => {
      if (!adapterConfig.enabled) {
        return;
      }
      return options.onEvent(event);
    }
  };
}
