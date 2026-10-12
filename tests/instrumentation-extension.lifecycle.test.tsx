import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AnalyticsRuntime } from "../src/analytics/types.js";
import { UIExtensionsProvider, useUIExtensions } from "../src/extensions/runtime.js";
import { createAnalyticsExtension } from "../src/extensions/instrumentation-extension.js";

function EmitHarness({ onReady }: { onReady: (emit: ReturnType<typeof useUIExtensions>["emit"]) => void }) {
  const value = useUIExtensions();
  onReady(value.emit);
  return null;
}

describe("createAnalyticsExtension lifecycle", () => {
  it("does not dispose host-owned runtime by default", () => {
    const runtime: AnalyticsRuntime = {
      update: vi.fn(),
      dispatch: vi.fn(),
      setAdapters: vi.fn(),
      dispose: vi.fn()
    };

    const { unmount } = render(
      <StrictMode>
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
          <div />
        </UIExtensionsProvider>
      </StrictMode>
    );

    unmount();
    expect(runtime.dispose).not.toHaveBeenCalled();
  });

  it("supports opt-in runtime disposal", () => {
    const runtime: AnalyticsRuntime = {
      update: vi.fn(),
      dispatch: vi.fn(),
      setAdapters: vi.fn(),
      dispose: vi.fn()
    };

    const { unmount } = render(
      <UIExtensionsProvider
        initialConfig={{ enabled: true }}
        extensions={[createAnalyticsExtension(runtime, { disposeRuntimeOnCleanup: true })]}
      >
        <div />
      </UIExtensionsProvider>
    );

    unmount();
    expect(runtime.dispose).toHaveBeenCalledTimes(1);
  });

  it("routes events to replacement runtime when extension instance is replaced", () => {
    const firstRuntime: AnalyticsRuntime = {
      update: vi.fn(),
      dispatch: vi.fn(),
      setAdapters: vi.fn(),
      dispose: vi.fn()
    };
    const secondRuntime: AnalyticsRuntime = {
      update: vi.fn(),
      dispatch: vi.fn(),
      setAdapters: vi.fn(),
      dispose: vi.fn()
    };

    let emit: ReturnType<typeof useUIExtensions>["emit"] | undefined;

    const { rerender } = render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(firstRuntime)]}>
        <EmitHarness onReady={(next) => (emit = next)} />
      </UIExtensionsProvider>
    );

    rerender(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(secondRuntime)]}>
        <EmitHarness onReady={(next) => (emit = next)} />
      </UIExtensionsProvider>
    );

    act(() => {
      emit?.({ type: "ui.button.click", action: "click", component: "Button" }, { trackingPath: ["app"] });
    });

    expect(firstRuntime.dispatch).not.toHaveBeenCalled();
    expect(secondRuntime.dispatch).toHaveBeenCalledTimes(1);
  });
});
