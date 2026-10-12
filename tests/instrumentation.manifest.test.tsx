import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Accordion from "../src/material/Accordion.js";
import AccordionDetails from "../src/material/AccordionDetails.js";
import AccordionSummary from "../src/material/AccordionSummary.js";
import { createMemoryAdapter } from "../src/analytics/adapters/memory.js";
import { createAnalyticsRuntime } from "../src/analytics/runtime.js";
import { UIExtensionsProvider } from "../src/extensions/runtime.js";
import { TrackingBoundary } from "../src/extensions/tracking-boundary.js";
import { createAnalyticsExtension } from "../src/extensions/instrumentation-extension.js";
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

  it("delivers the advertised AccordionSummary event when selected by scope", async () => {
    const user = userEvent.setup();
    const memory = createMemoryAdapter();
    const runtime = createAnalyticsRuntime([memory], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "denied" }
    });
    const advertisedEvent = instrumentableComponents.AccordionSummary[0];

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="accordion-scope" events={[advertisedEvent]}>
          <Accordion>
            <AccordionSummary>Catalog Summary</AccordionSummary>
            <AccordionDetails>Details</AccordionDetails>
          </Accordion>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Catalog Summary" }));
    expect(memory.read().map((entry) => entry.type)).toContain(advertisedEvent);
  });
});
