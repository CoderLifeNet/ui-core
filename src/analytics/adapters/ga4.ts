import type { UIEvent } from "../../extensions/types.js";
import { sanitizeMetadata } from "../runtime.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export type GA4Client = (command: "event", eventName: string, params: Record<string, unknown>) => void;

export interface GA4AdapterOptions {
  client: GA4Client;
  mapEventName?: (event: UIEvent) => string;
}

export function createGA4Adapter(options: GA4AdapterOptions): AnalyticsAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };

  return {
    id: "ga4",
    kind: "ga4",
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event) => {
      if (!adapterConfig.enabled) {
        return;
      }
      options.client("event", options.mapEventName?.(event) ?? event.type, {
        component: event.component,
        action: event.action,
        semantic_id: event.semanticId,
        ...sanitizeMetadata(event.metadata)
      });
    }
  };
}
