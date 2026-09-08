"use client";

import type { SyntheticEvent } from "react";
import type { EmitUIEventInput } from "./emit.js";

export type EventHandler<TArgs extends unknown[]> = (...args: TArgs) => void;
const DEDUPE_KEY = "__coderlife_ui_dedupe";

export interface ComposeHandlerOptions<TArgs extends unknown[]> {
  userHandler?: EventHandler<TArgs> | undefined;
  emit: (input: EmitUIEventInput) => void;
  dedupeKey: string;
  eventFactory: (...args: TArgs) => EmitUIEventInput;
}

function getNativeEvent(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  if (!("nativeEvent" in input)) {
    return null;
  }

  const native = (input as { nativeEvent?: unknown }).nativeEvent;
  if (!native || typeof native !== "object") {
    return null;
  }
  return native as Record<string, unknown>;
}

function markAndCheckDuplicate(input: unknown, dedupeKey: string): boolean {
  const nativeEvent = getNativeEvent(input);
  if (!nativeEvent) {
    return false;
  }

  const value = nativeEvent[DEDUPE_KEY];
  const seen = value instanceof Set ? value : new Set<string>();
  nativeEvent[DEDUPE_KEY] = seen;

  if (seen.has(dedupeKey)) {
    return true;
  }
  seen.add(dedupeKey);
  return false;
}

export function composeHandler<TArgs extends unknown[]>({
  userHandler,
  emit,
  dedupeKey,
  eventFactory
}: ComposeHandlerOptions<TArgs>): EventHandler<TArgs> {
  return (...args: TArgs) => {
    userHandler?.(...args);

    const first = args[0];
    if (first && typeof first === "object" && "isPropagationStopped" in (first as SyntheticEvent)) {
      const event = first as SyntheticEvent;
      if (event.isPropagationStopped() || event.isDefaultPrevented()) {
        return;
      }
    }

    if (markAndCheckDuplicate(first, dedupeKey)) {
        return;
    }

    try {
      emit(eventFactory(...args));
    } catch {
      // Runtime extensions must not throw into host handlers.
    }
  };
}
