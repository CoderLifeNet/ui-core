import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnalyticsInspector, createAnalyticsInspector, createAnalyticsRuntime, createGA4Adapter, createUmamiAdapter
} from "../src/analytics/index.js";
import { createAnalyticsExtension, TrackingBoundary, UIExtensionsProvider } from "../src/extensions/index.js";
import { Button } from "../src/index.js";

afterEach(cleanup);

describe("analytics inspector", () => {
  it("reports decisions from the boundary through to the active tracker without retaining payloads", async () => {
    const inspector = createAnalyticsInspector();
    const gtag = vi.fn();
    let trackerReady = false;
    const runtime = createAnalyticsRuntime([createGA4Adapter({ client: gtag, isAvailable: () => trackerReady })],
      { enabled: true }, { onDiagnostic: inspector.onDiagnostic });
    const user = userEvent.setup();
    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="private" optOut metadata={{ note: "not for the inspector" }}>
          <Button>Private</Button>
        </TrackingBoundary>
        <TrackingBoundary id="filtered" events={[]}>
          <Button>Filtered</Button>
        </TrackingBoundary>
        <Button>Save</Button>
        <AnalyticsInspector inspector={inspector} />
      </UIExtensionsProvider>
    );
    await user.click(screen.getByRole("button", { name: "Private" }));
    await user.click(screen.getByRole("button", { name: "Filtered" }));
    const save = screen.getByRole("button", { name: "Save" });
    await user.click(save);
    runtime.update({ consent: { analyticsStorage: "granted", adStorage: "denied" } });
    await user.click(save);
    expect(gtag).not.toHaveBeenCalled();
    trackerReady = true;
    await user.click(save);
    expect(gtag).toHaveBeenCalledTimes(1);
    runtime.setAdapters([createUmamiAdapter({ client: { track: vi.fn().mockRejectedValue(new Error("failed")) } })]);
    await user.click(save);
    const event = { type: "ui.button.click", component: "Button" };
    await waitFor(() => expect(inspector.getSnapshot()).toEqual([
      { ...event, status: "blocked", reason: "scope_opt_out" },
      { ...event, status: "blocked", reason: "scope_event_filter" },
      { ...event, status: "blocked", reason: "analytics_consent_denied" },
      { ...event, status: "tracker_unavailable", adapterId: "ga4" },
      { ...event, status: "dispatched", adapterId: "ga4" },
      { ...event, status: "failed", adapterId: "umami" }
    ]));
    await user.click(screen.getByText("UI Core analytics inspector (6)"));
    expect(screen.getByText(/tracker unavailable/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear events" }));
    expect(inspector.getSnapshot()).toEqual([]);
  });
});
