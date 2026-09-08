import { describe, expect, it, vi } from "vitest";
import { createMemoryAdapter } from "../src/analytics/adapters/memory.js";
import { createGA4Adapter } from "../src/analytics/adapters/ga4.js";
import { createAnalyticsRuntime } from "../src/analytics/runtime.js";

describe("createAnalyticsRuntime", () => {
  it("requires enablement and consent", () => {
    const memory = createMemoryAdapter();
    const runtime = createAnalyticsRuntime([memory]);

    runtime.dispatch({
      schemaVersion: "1.0.0",
      type: "ui.click",
      action: "click",
      component: "Button",
      timestamp: Date.now()
    });

    expect(memory.read()).toHaveLength(0);

    runtime.update({ enabled: true, consent: { analyticsStorage: "granted", adStorage: "denied" } });
    memory.configure?.({ enabled: true, sampleRate: 1 });

    runtime.dispatch({
      schemaVersion: "1.0.0",
      type: "ui.click",
      action: "click",
      component: "Button",
      timestamp: Date.now()
    });

    expect(memory.read()).toHaveLength(1);
  });

  it("isolates adapter errors", () => {
    const throwing = {
      id: "throws",
      kind: "custom" as const,
      onEvent: vi.fn(() => {
        throw new Error("boom");
      })
    };

    const memory = createMemoryAdapter();
    memory.configure?.({ enabled: true, sampleRate: 1 });

    const runtime = createAnalyticsRuntime([throwing, memory], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "denied" }
    });

    runtime.dispatch({
      schemaVersion: "1.0.0",
      type: "ui.click",
      action: "click",
      component: "Button",
      timestamp: Date.now()
    });

    expect(memory.read()).toHaveLength(1);
  });

  it("maps events through GA4 adapter", () => {
    const gtag = vi.fn();
    const adapter = createGA4Adapter({ client: gtag });
    adapter.configure?.({ enabled: true, sampleRate: 1 });

    adapter.onEvent({
      schemaVersion: "1.0.0",
      type: "ui.click",
      action: "click",
      component: "Button",
      semanticId: "primary-action",
      metadata: { variant: "contained" },
      timestamp: Date.now()
    });

    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("handles rejecting adapters without unhandled throw", () => {
    const rejecting = {
      id: "rejecting",
      kind: "custom" as const,
      onEvent: vi.fn(async () => {
        throw new Error("reject");
      })
    };

    const memory = createMemoryAdapter();
    const runtime = createAnalyticsRuntime([rejecting, memory], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "denied" }
    });

    expect(() =>
      runtime.dispatch({
        schemaVersion: "1.0.0",
        type: "ui.click",
        action: "click",
        component: "Button",
        timestamp: Date.now()
      })
    ).not.toThrow();
  });

  it("supports per-adapter enablement updates", () => {
    const memory = createMemoryAdapter();
    const runtime = createAnalyticsRuntime([memory], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "denied" },
      adapterEnabled: { memory: false }
    });

    runtime.dispatch({
      schemaVersion: "1.0.0",
      type: "ui.click",
      action: "click",
      component: "Button",
      timestamp: Date.now()
    });

    expect(memory.read()).toHaveLength(0);

    runtime.update({ adapterEnabled: { memory: true } });
    runtime.dispatch({
      schemaVersion: "1.0.0",
      type: "ui.click",
      action: "click",
      component: "Button",
      timestamp: Date.now()
    });

    expect(memory.read()).toHaveLength(1);
  });
});
