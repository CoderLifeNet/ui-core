import type { UIEvent } from "../../extensions/types.js";
import { sanitizeMetadata } from "../runtime.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export interface UmamiClient {
  track: (eventName: string, data: Record<string, unknown>) => void | Promise<unknown>;
}

export interface UmamiAdapterOptions {
  client: UmamiClient;
  isAvailable?: () => boolean;
  mapEventName?: (event: UIEvent) => string;
}

export function createUmamiAdapter(options: UmamiAdapterOptions): AnalyticsAdapter {
  let adapterConfig: AnalyticsAdapterConfig = { enabled: false, sampleRate: 1 };

  return {
    id: "umami",
    kind: "umami",
    ...(options.isAvailable ? { isAvailable: options.isAvailable } : {}),
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: async (event, context) => {
      if (!adapterConfig.enabled) {
        return;
      }
      const metadata = sanitizeMetadata(event.metadata, ["component", "action", "semantic_id", "tracking_path"]);
      await options.client.track(options.mapEventName?.(event) ?? event.type, {
        ...metadata,
        component: event.component,
        action: event.action,
        ...(event.semanticId === undefined ? {} : { semantic_id: event.semanticId }),
        tracking_path: context?.trackingPath.join("/") ?? ""
      });
    }
  };
}
