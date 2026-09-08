import type { UIEvent } from "../../extensions/types.js";
import { sanitizeMetadata } from "../runtime.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig } from "../types.js";

export interface AdobeClient {
  trackAction: (actionName: string, contextData?: Record<string, unknown>) => void;
}

export interface AdobeAdapterOptions {
  client: AdobeClient;
  actionMapper?: (event: UIEvent) => string;
  contextMapper?: (event: UIEvent) => Record<string, unknown>;
}

export function createAdobeAdapter(options: AdobeAdapterOptions): AnalyticsAdapter {
  let adapterConfig: AnalyticsAdapterConfig = {
    enabled: false,
    sampleRate: 1
  };

  return {
    id: "adobe",
    kind: "adobe",
    configure: (next) => {
      adapterConfig = next;
    },
    onEvent: (event) => {
      if (!adapterConfig.enabled) {
        return;
      }
      const context = options.contextMapper?.(event) ?? {
        component: event.component,
        semanticId: event.semanticId,
        ...sanitizeMetadata(event.metadata)
      };
      options.client.trackAction(options.actionMapper?.(event) ?? event.type, context);
    }
  };
}
