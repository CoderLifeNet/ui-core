import type { UIEvent } from "../../extensions/types.js";
import { sanitizeMetadata } from "../runtime.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export type GA4Client = (command: "event", eventName: string, params: Record<string, unknown>) => void;

export interface GA4AdapterOptions {
  client: GA4Client;
  isAvailable?: () => boolean;
  mapEventName?: (event: UIEvent) => string;
  sendTo?: string | readonly string[];
}

function defaultEventName(type: string): string {
  const name = type.replace(/[^a-zA-Z0-9_]/g, "_");
  return (/^[a-z]/i.test(name) ? name : `ui_${name}`).slice(0, 40);
}

export function createGA4Adapter(options: GA4AdapterOptions): AnalyticsAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };

  return {
    id: "ga4",
    kind: "ga4",
    ...(options.isAvailable ? { isAvailable: options.isAvailable } : {}),
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event, context) => {
      if (!adapterConfig.enabled) {
        return;
      }
      const sanitized = sanitizeMetadata(event.metadata, [
        "component", "action", "semantic_id", "tracking_path", "send_to", "event_callback", "event_timeout"
      ]);
      options.client("event", options.mapEventName?.(event) ?? defaultEventName(event.type), {
        component: event.component,
        action: event.action,
        semantic_id: event.semanticId,
        tracking_path: context?.trackingPath.join("/") ?? "",
        ...sanitized,
        ...(options.sendTo === undefined ? {} : { send_to: options.sendTo })
      });
    }
  };
}
