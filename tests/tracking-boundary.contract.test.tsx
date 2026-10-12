import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../src/material/Button.js";
import TextField from "../src/material/TextField.js";
import { createCustomAdapter } from "../src/analytics/adapters/custom.js";
import { createMemoryAdapter } from "../src/analytics/adapters/memory.js";
import { createAnalyticsRuntime } from "../src/analytics/runtime.js";
import { UIExtensionsProvider } from "../src/extensions/runtime.js";
import { TrackingBoundary } from "../src/extensions/tracking-boundary.js";
import { createAnalyticsExtension } from "../src/extensions/instrumentation-extension.js";
import { useEmitUIEvent } from "../src/instrumentation/emit.js";
import type { UIEvent } from "../src/extensions/types.js";

function OverrideSemanticIdEmitter() {
  const emit = useEmitUIEvent();
  return (
    <button
      onClick={() =>
        emit({
          type: "ui.button.click",
          action: "click",
          component: "Button",
          semanticId: "explicit-semantic-id"
        })
      }
    >
      Explicit Semantic
    </button>
  );
}

function ExplicitSemanticEmitter() {
  const emit = useEmitUIEvent();
  return (
    <button
      onClick={() =>
        emit({
          type: "ui.custom.explicit",
          action: "emit",
          component: "Custom",
          semanticId: "explicit-custom-id"
        })
      }
    >
      Explicit Event
    </button>
  );
}

function setupMemoryRuntime() {
  const memory = createMemoryAdapter();
  const runtime = createAnalyticsRuntime([memory], {
    enabled: true,
    consent: { analyticsStorage: "granted", adStorage: "granted" }
  });
  return { memory, runtime };
}

function MetadataEmitter({
  metadata,
  label = "Emit Metadata"
}: {
  metadata: Record<string, unknown>;
  label?: string;
}) {
  const emit = useEmitUIEvent();
  return (
    <button
      onClick={() =>
        emit({
          type: "ui.button.click",
          action: "click",
          component: "Button",
          metadata: metadata as unknown as Record<string, string | number | boolean | null>
        })
      }
    >
      {label}
    </button>
  );
}

describe("TrackingBoundary contract", () => {
  it("merges metadata and uses nearest semanticId by default", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupMemoryRuntime();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="app" semanticId="app-root" metadata={{ area: "shell", priority: 1 }}>
          <TrackingBoundary id="actions" semanticId="inner-action" metadata={{ area: "actions", intent: "save" }}>
            <Button>Save</Button>
          </TrackingBoundary>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    const event = memory.read()[0];
    expect(event?.semanticId).toBe("inner-action");
    expect(event?.metadata).toEqual({ area: "actions", priority: 1, intent: "save", variant: "text", color: "primary" });
    expect(memory.readContext()[0]?.trackingPath).toEqual(["app", "actions"]);
  });

  it("supports explicit semanticId override and ancestor opt-out precedence", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupMemoryRuntime();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root" optOut>
          <TrackingBoundary id="nested" semanticId="nested-id">
            <Button>Never emitted</Button>
          </TrackingBoundary>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Never emitted" }));
    expect(memory.read()).toHaveLength(0);
  });

  it("prefers explicit event semanticId over inherited semanticId", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupMemoryRuntime();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root" semanticId="inherited-id">
          <OverrideSemanticIdEmitter />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Explicit Semantic" }));
    expect(memory.read()[0]?.semanticId).toBe("explicit-semantic-id");
  });

  it("intersects event selections and allows explicit high-volume enablement", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupMemoryRuntime();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root" events={["ui.button.click", "ui.text_field.change"]}>
          <TrackingBoundary id="nested" events={["ui.text_field.change"]}>
            <Button>Not Allowed</Button>
            <TextField label="Query" defaultValue="" />
          </TrackingBoundary>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Not Allowed" }));
    await user.type(screen.getByLabelText("Query"), "x");

    const types = memory.read().map((entry) => entry.type);
    expect(types).not.toContain("ui.button.click");
    expect(types).toContain("ui.text_field.change");
  });

  it("disables all events for empty event selection", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupMemoryRuntime();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root" events={[]}>
          <Button>Disabled</Button>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(memory.read()).toHaveLength(0);
  });

  it("suppresses automatic and explicit semantic events under ancestor opt-out", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupMemoryRuntime();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root" optOut>
          <Button>Automatic Event</Button>
          <ExplicitSemanticEmitter />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Automatic Event" }));
    await user.click(screen.getByRole("button", { name: "Explicit Event" }));
    expect(memory.read()).toHaveLength(0);
  });

  it("removes reserved-only metadata at the shared emit boundary", async () => {
    const user = userEvent.setup();
    const delivered: UIEvent[] = [];
    const memory = createMemoryAdapter();
    const custom = createCustomAdapter({
      id: "custom",
      onEvent: (event) => {
        delivered.push(event);
      }
    });
    const runtime = createAnalyticsRuntime([memory, custom], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "granted" }
    });

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root">
          <MetadataEmitter label="Emit Reserved" metadata={{ component: "spoof", timestamp: 123, type: "spoof" }} />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Emit Reserved" }));
    expect(memory.read()[0]?.metadata).toBeUndefined();
    expect(delivered[0]?.metadata).toBeUndefined();
  });

  it("preserves merge precedence while dropping reserved metadata keys", async () => {
    const user = userEvent.setup();
    const delivered: UIEvent[] = [];
    const memory = createMemoryAdapter();
    const custom = createCustomAdapter({
      id: "custom",
      onEvent: (event) => {
        delivered.push(event);
      }
    });
    const runtime = createAnalyticsRuntime([memory, custom], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "granted" }
    });

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root" metadata={{ source: "boundary", context: "scope", trackingPath: "hidden" }}>
          <MetadataEmitter label="Emit Mixed" metadata={{ source: "event", count: 3, semanticId: "hidden" }} />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Emit Mixed" }));
    const expectedMetadata = { source: "event", context: "scope", count: 3 };
    expect(memory.read()[0]?.metadata).toEqual(expectedMetadata);
    expect(delivered[0]?.metadata).toEqual(expectedMetadata);
  });

  it("drops invalid runtime metadata values from JavaScript-style emit calls", async () => {
    const user = userEvent.setup();
    const delivered: UIEvent[] = [];
    const memory = createMemoryAdapter();
    const custom = createCustomAdapter({
      id: "custom",
      onEvent: (event) => {
        delivered.push(event);
      }
    });
    const runtime = createAnalyticsRuntime([memory, custom], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "granted" }
    });

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="root">
          <MetadataEmitter
            label="Emit Invalid"
            metadata={{
              validText: "ok",
              validNumber: 7,
              validBoolean: true,
              validNull: null,
              invalidObject: { nested: true },
              invalidArray: ["x"],
              invalidFn: () => "nope"
            }}
          />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Emit Invalid" }));
    const expectedMetadata = {
      validText: "ok",
      validNumber: 7,
      validBoolean: true,
      validNull: null
    };
    expect(memory.read()[0]?.metadata).toEqual(expectedMetadata);
    expect(delivered[0]?.metadata).toEqual(expectedMetadata);
  });
});
