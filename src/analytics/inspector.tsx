"use client";

import { useSyncExternalStore } from "react";
import type { AnalyticsDiagnostic } from "./types.js";

const emptySnapshot: readonly AnalyticsDiagnostic[] = [];

export interface AnalyticsInspectorStore {
  onDiagnostic: (diagnostic: AnalyticsDiagnostic) => void;
  getSnapshot: () => readonly AnalyticsDiagnostic[];
  subscribe: (listener: () => void) => () => void;
  clear: () => void;
}

export function createAnalyticsInspector(): AnalyticsInspectorStore {
  let snapshot = emptySnapshot;
  const listeners = new Set<() => void>();
  const publish = (next: readonly AnalyticsDiagnostic[]): void => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  return {
    onDiagnostic: (diagnostic) => publish([...snapshot.slice(-99), diagnostic]),
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    clear: () => publish(emptySnapshot)
  };
}

export function AnalyticsInspector({ inspector }: { inspector: AnalyticsInspectorStore }) {
  const events = useSyncExternalStore(inspector.subscribe, inspector.getSnapshot, () => emptySnapshot);

  return (
    <details>
      <summary>UI Core analytics inspector ({events.length})</summary>
      <button type="button" onClick={inspector.clear} disabled={events.length === 0}>Clear events</button>
      <ol>
        {events.map((event, index) => (
          <li key={index}>
            {event.type} ({event.component}) — {event.status.replaceAll("_", " ")}
            {event.adapterId ? ` [${event.adapterId}]` : ""}
            {event.status === "blocked" ? ` (${event.reason.replaceAll("_", " ")})` : ""}
          </li>
        ))}
      </ol>
    </details>
  );
}
