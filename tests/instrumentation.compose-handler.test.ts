import { describe, expect, it, vi } from "vitest";
import { composeHandler } from "../src/instrumentation/compose-handler.js";

describe("composeHandler", () => {
  it("calls user handler before emit", () => {
    const calls: string[] = [];
    const handler = composeHandler({
      userHandler: () => calls.push("user"),
      emit: () => calls.push("emit"),
      dedupeKey: "test",
      eventFactory: () => ({ type: "ui.click", action: "click", component: "Button" })
    });

    handler();

    expect(calls).toEqual(["user", "emit"]);
  });

  it("does not throw if emit fails", () => {
    const userHandler = vi.fn();

    const handler = composeHandler({
      userHandler,
      emit: () => {
        throw new Error("adapter failure");
      },
      dedupeKey: "test",
      eventFactory: () => ({ type: "ui.click", action: "click", component: "Button" })
    });

    expect(() => handler()).not.toThrow();
    expect(userHandler).toHaveBeenCalledTimes(1);
  });

  it("preserves consumer callback exceptions", () => {
    const error = new Error("consumer error");
    const emit = vi.fn();

    const handler = composeHandler({
      userHandler: () => {
        throw error;
      },
      emit,
      dedupeKey: "test",
      eventFactory: () => ({ type: "ui.click", action: "click", component: "Button" })
    });

    expect(() => handler()).toThrow("consumer error");
    expect(emit).not.toHaveBeenCalled();
  });

  it("does not emit when consumer prevents default", () => {
    const emit = vi.fn();
    const event = {
      nativeEvent: {},
      preventDefault: vi.fn(),
      isDefaultPrevented: () => true,
      isPropagationStopped: () => false
    };

    const handler = composeHandler<[typeof event]>({
      userHandler: () => undefined,
      emit,
      dedupeKey: "click:Button",
      eventFactory: () => ({ type: "ui.button.click", action: "click", component: "Button" })
    });

    handler(event as never);
    expect(emit).not.toHaveBeenCalled();
  });

  it("does not emit when propagation is stopped", () => {
    const emit = vi.fn();
    const event = {
      nativeEvent: {},
      stopPropagation: vi.fn(),
      isDefaultPrevented: () => false,
      isPropagationStopped: () => true
    };

    const handler = composeHandler<[typeof event]>({
      userHandler: () => undefined,
      emit,
      dedupeKey: "click:Button",
      eventFactory: () => ({ type: "ui.button.click", action: "click", component: "Button" })
    });

    handler(event as never);
    expect(emit).not.toHaveBeenCalled();
  });

  it("dedupes only the same semantic key on a shared native event", () => {
    const event = {
      nativeEvent: {},
      isDefaultPrevented: () => false,
      isPropagationStopped: () => false
    };
    const firstEmit = vi.fn();
    const secondEmit = vi.fn();

    const clickHandler = composeHandler<[typeof event]>({
      userHandler: () => undefined,
      emit: firstEmit,
      dedupeKey: "click:Button",
      eventFactory: () => ({ type: "ui.button.click", action: "click", component: "Button" })
    });

    const tabHandler = composeHandler<[typeof event]>({
      userHandler: () => undefined,
      emit: secondEmit,
      dedupeKey: "change:Tabs",
      eventFactory: () => ({ type: "ui.tabs.change", action: "change", component: "Tabs" })
    });

    clickHandler(event as never);
    clickHandler(event as never);
    tabHandler(event as never);

    expect(firstEmit).toHaveBeenCalledTimes(1);
    expect(secondEmit).toHaveBeenCalledTimes(1);
  });
});
