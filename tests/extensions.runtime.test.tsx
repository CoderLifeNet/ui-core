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

  it("replaces prop extensions and disposes removed registrations", () => {
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const firstDispose = vi.fn();
    const secondDispose = vi.fn();
    let emit: ReturnType<typeof useUIExtensions>["emit"] | undefined;

    const { rerender } = render(
      <UIExtensionsProvider
        initialConfig={{ enabled: true }}
        extensions={[
          {
            id: "replacement",
            category: "instrumentation",
            onEvent: firstListener,
            dispose: firstDispose
          }
        ]}
      >
        <Harness onReady={(next) => (emit = next)} />
      </UIExtensionsProvider>
    );

    rerender(
      <UIExtensionsProvider
        initialConfig={{ enabled: true }}
        extensions={[
          {
            id: "replacement",
            category: "instrumentation",
            onEvent: secondListener,
            dispose: secondDispose
          }
        ]}
      >
        <Harness onReady={(next) => (emit = next)} />
      </UIExtensionsProvider>
    );

    act(() => {
      emit?.({ type: "ui.click", action: "click", component: "Button" });
    });

    expect(firstDispose).toHaveBeenCalledTimes(1);
    expect(firstListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  it("guards against stale unregister callbacks", () => {
    const first = vi.fn();
    const second = vi.fn();
    let api: ReturnType<typeof useUIExtensions> | undefined;

    function RegisterHarness({ onReady }: { onReady: (value: ReturnType<typeof useUIExtensions>) => void }) {
      const extensions = useUIExtensions();
      onReady(extensions);
      return null;
    }

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }}>
        <RegisterHarness onReady={(value) => (api = value)} />
      </UIExtensionsProvider>
    );

    const unregisterFirst = api?.register({ id: "dynamic", category: "custom", onEvent: first });
    api?.register({ id: "dynamic", category: "custom", onEvent: second });
    unregisterFirst?.();

    act(() => {
      api?.emit({ type: "ui.click", action: "click", component: "Button" });
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
