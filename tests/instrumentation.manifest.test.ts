import { describe, expect, it } from "vitest";
import {
  getUnsupportedEventTypes,
  instrumentableComponents,
  isKnownUIEventType,
  knownUIEventTypes,
  uiEventCatalog
} from "../src/instrumentation/manifest.js";

describe("instrumentation manifest", () => {
  it("includes Select and correct Slider trigger", () => {
    expect(instrumentableComponents.Select).toContain("ui.select.change");
    expect(uiEventCatalog["ui.slider.change"].trigger).toBe("onChangeCommitted");
  });

  it("lists known event types and validates unsupported values", () => {
    expect(knownUIEventTypes.includes("ui.button.click")).toBe(true);
    expect(isKnownUIEventType("ui.input.blur")).toBe(true);

    const unsupported = getUnsupportedEventTypes(["ui.button.click", "ui.unknown.custom"]);
    expect(unsupported).toEqual(["ui.unknown.custom"]);
  });
});
