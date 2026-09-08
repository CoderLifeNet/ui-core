import type { UIEvent } from "../../extensions/types.js";
import { sanitizeMetadata } from "../runtime.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export type MetaPixelClient = (
  command: "trackCustom",
  eventName: string,
  payload?: Record<string, unknown>
) => void;

export interface MetaPixelAdapterOptions {
  client: MetaPixelClient;
  eventMapper?: (event: UIEvent) => string;
}

export function createMetaPixelAdapter(options: MetaPixelAdapterOptions): AnalyticsAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };

  return {
    id: "meta-pixel",
    kind: "meta-pixel",
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event) => {
      if (!adapterConfig.enabled) {
        return;
      }
      options.client("trackCustom", options.eventMapper?.(event) ?? event.type, {
        component: event.component,
        action: event.action,
        semantic_id: event.semanticId,
        ...sanitizeMetadata(event.metadata)
      });
    }
  };
}
