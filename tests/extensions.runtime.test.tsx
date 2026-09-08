import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UIExtensionsProvider, useUIExtensions } from "../src/extensions/runtime.js";

function Harness({ onReady }: { onReady: (emit: ReturnType<typeof useUIExtensions>["emit"]) => void }): null {
  const extensions = useUIExtensions();
  onReady(extensions.emit);
  return null;
}

describe("UIExtensionsProvider", () => {
  it("does not dispatch when disabled", () => {
    const listener = vi.fn();
    let emit: ReturnType<typeof useUIExtensions>["emit"] | undefined;

    render(
      <UIExtensionsProvider
        initialConfig={{ enabled: false }}
        extensions={[
          {
            id: "test",
            category: "instrumentation",
            onEvent: listener
          }
        ]}
      >
        <Harness onReady={(next) => (emit = next)} />
      </UIExtensionsProvider>
    );

    act(() => {
      emit?.({ type: "ui.click", action: "click", component: "Button" });
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("dispatches events when enabled", () => {
    const listener = vi.fn();
    let emit: ReturnType<typeof useUIExtensions>["emit"] | undefined;

    render(
      <UIExtensionsProvider
        initialConfig={{ enabled: true }}
        extensions={[
          {
            id: "test",
            category: "instrumentation",
            onEvent: listener
          }
        ]}
      >
        <Harness onReady={(next) => (emit = next)} />
      </UIExtensionsProvider>
    );

    act(() => {
      emit?.({ type: "ui.click", action: "click", component: "Button" }, { trackingPath: ["root"] });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const call = listener.mock.calls[0];
    if (!call) {
      throw new Error("Expected extension listener call");
    }
    const [event, context] = call;
    expect(event.schemaVersion).toBe("1.0.0");
    expect(context.trackingPath).toEqual(["root"]);
  });
});
