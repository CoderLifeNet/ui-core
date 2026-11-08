import { describe, expect, it, vi } from "vitest";
import { createAdobeAdapter } from "../src/analytics/adapters/adobe.js";
import { createGA4Adapter } from "../src/analytics/adapters/ga4.js";
import { createMetaPixelAdapter } from "../src/analytics/adapters/meta-pixel.js";
import { createUmamiAdapter } from "../src/analytics/adapters/umami.js";
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
    expect(gtag).toHaveBeenCalledWith("event", "ui_button_click", {
      component: "Button",
      action: "click",
      semantic_id: "save",
      tracking_path: "",
      variant: "contained"
    });
  });

  it("accepts a host GA4 event mapping and uses the host's destination", () => {
    const gtag = vi.fn();
    const adapter = createGA4Adapter({
      client: gtag,
      mapEventName: () => "save_clicked",
      sendTo: "G-EXAMPLE"
    });
    adapter.configure?.({ enabled: true, sampleRate: 1 });
    adapter.onEvent({ ...event, metadata: { send_to: "G-OTHER", component: "other", event_timeout: 0 } });
    expect(gtag).toHaveBeenCalledWith("event", "save_clicked", {
      component: "Button",
      action: "click",
      semantic_id: "save",
      tracking_path: "",
      send_to: "G-EXAMPLE"
    });
  });

  it("maps Umami to the tracker event shape with protected scope metadata", async () => {
    const track = vi.fn().mockResolvedValue(undefined);
    const adapter = createUmamiAdapter({ client: { track } });
    const scopedEvent = { ...event, metadata: { variant: "contained", tracking_path: "override" } };
    await adapter.onEvent(scopedEvent);
    expect(track).not.toHaveBeenCalled();

    adapter.configure?.({ enabled: true, sampleRate: 1 });
    await adapter.onEvent(scopedEvent, {
      trackingPath: ["app", "form"],
      optedOut: false,
      consent: { analyticsStorage: "granted", adStorage: "denied" }
    });
    expect(track).toHaveBeenCalledWith("ui.button.click", {
      component: "Button",
      action: "click",
      semantic_id: "save",
      tracking_path: "app/form",
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
      trackingPath: "",
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
      tracking_path: "",
      variant: "contained"
    });
  });
});
