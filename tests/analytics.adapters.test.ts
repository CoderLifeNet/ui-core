import { describe, expect, it, vi } from "vitest";
import { createAdobeAdapter } from "../src/analytics/adapters/adobe.js";
import { createGA4Adapter } from "../src/analytics/adapters/ga4.js";
import { createMetaPixelAdapter } from "../src/analytics/adapters/meta-pixel.js";
import type { UIEvent } from "../src/extensions/types.js";

const event: UIEvent = {
  schemaVersion: "1.0.0",
  type: "ui.button.click",
  action: "click",
  component: "Button",
  semanticId: "save",
  metadata: { variant: "contained" },
  timestamp: 1
};

describe("analytics adapters", () => {
  it("maps GA4 to gtag event shape", () => {
    const gtag = vi.fn();
    const adapter = createGA4Adapter({ client: gtag });
    adapter.configure?.({ enabled: true, sampleRate: 1 });
    adapter.onEvent(event);
    expect(gtag).toHaveBeenCalledWith("event", "ui.button.click", {
      component: "Button",
      action: "click",
      semantic_id: "save",
      variant: "contained"
    });
  });

  it("maps Adobe bridge to trackAction shape", () => {
    const trackAction = vi.fn();
    const adapter = createAdobeAdapter({ client: { trackAction } });
    adapter.configure?.({ enabled: true, sampleRate: 1 });
    adapter.onEvent(event);
    expect(trackAction).toHaveBeenCalledWith("ui.button.click", {
      component: "Button",
      semanticId: "save",
      variant: "contained"
    });
  });

  it("maps Meta Pixel custom event shape", () => {
    const fbq = vi.fn();
    const adapter = createMetaPixelAdapter({ client: fbq });
    adapter.configure?.({ enabled: true, sampleRate: 1 });
    adapter.onEvent(event);
    expect(fbq).toHaveBeenCalledWith("trackCustom", "ui.button.click", {
      component: "Button",
      action: "click",
      semantic_id: "save",
      variant: "contained"
    });
  });
});
