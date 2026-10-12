import type { UIEvent } from "../../extensions/types.js";
import { sanitizeMetadata } from "../runtime.js";
import type { AnalyticsAdapter, AnalyticsAdapterConfig, AnalyticsDispatchContext } from "../types.js";

export interface AdobeClient {
  trackAction: (actionName: string, contextData?: Record<string, unknown>) => void;
}

export interface AdobeAdapterOptions {
  client: AdobeClient;
  actionMapper?: (event: UIEvent) => string;
  contextMapper?: (event: UIEvent, context?: AnalyticsDispatchContext) => Record<string, unknown>;
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
    onEvent: (event, dispatchContext) => {
      if (!adapterConfig.enabled) {
        return;
      }
      const sanitized = sanitizeMetadata(event.metadata, ["component", "semanticId", "trackingPath"]);
      const mappedContext = options.contextMapper?.(event, dispatchContext) ?? {};
      const trackingPath = dispatchContext?.trackingPath.join("/") ?? "";
      const context = {
        component: event.component,
        semanticId: event.semanticId,
        trackingPath,
        ...mappedContext,
        ...sanitized
      };
      options.client.trackAction(options.actionMapper?.(event) ?? event.type, context);
    }
  };
}
