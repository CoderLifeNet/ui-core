"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { TrackingBoundaryValue } from "./types.js";
import { isDefaultEnabledEventType } from "../instrumentation/manifest.js";

const TrackingContext = createContext<TrackingBoundaryValue>({
  trackingPath: [],
  optedOut: false,
  metadata: {},
  hasEventSelection: false
});

const DEFAULT_DISABLED_EVENT_TYPES = new Set<string>();

function computeEventSelection(
  parent: TrackingBoundaryValue,
  nextEvents: readonly string[] | undefined
): Pick<TrackingBoundaryValue, "eventSelection" | "hasEventSelection"> {
  if (nextEvents === undefined) {
    if (!parent.hasEventSelection || !parent.eventSelection) {
      return {
        hasEventSelection: false
      };
    }
    return {
      eventSelection: parent.eventSelection,
      hasEventSelection: parent.hasEventSelection
    };
  }

  const nextSelection = new Set<string>(nextEvents);
  if (!parent.hasEventSelection) {
    return {
      eventSelection: nextSelection,
      hasEventSelection: true
    };
  }

  const parentSelection = parent.eventSelection ?? DEFAULT_DISABLED_EVENT_TYPES;
  return {
    eventSelection: new Set([...parentSelection].filter((entry) => nextSelection.has(entry))),
    hasEventSelection: true
  };
}

export interface TrackingBoundaryProps {
  id: string;
  optOut?: boolean;
  semanticId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  events?: readonly string[];
  children: ReactNode;
}

export function TrackingBoundary({
  id,
  optOut = false,
  semanticId,
  metadata,
  events,
  children
}: TrackingBoundaryProps) {
  const parent = useContext(TrackingContext);
  const value = useMemo<TrackingBoundaryValue>(
    () => {
      const normalizedMetadata: Record<string, string | number | boolean | null> = {};
      if (metadata) {
        for (const [key, val] of Object.entries(metadata)) {
          if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null) {
            normalizedMetadata[key] = val;
          }
        }
      }

      const eventSelection = computeEventSelection(parent, events);
      return {
        trackingPath: [...parent.trackingPath, id],
        optedOut: parent.optedOut || optOut,
        ...(semanticId || parent.semanticId ? { semanticId: semanticId ?? parent.semanticId } : {}),
        metadata: {
          ...parent.metadata,
          ...normalizedMetadata
        },
        ...(eventSelection.eventSelection ? { eventSelection: eventSelection.eventSelection } : {}),
        hasEventSelection: eventSelection.hasEventSelection
      };
    },
    [events, id, metadata, optOut, parent]
  );

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTrackingPath(): readonly string[] {
  return useContext(TrackingContext).trackingPath;
}

export function useTrackingBoundaryContext(): TrackingBoundaryValue {
  const value = useContext(TrackingContext);

  if (!value.hasEventSelection) {
    return value;
  }

  return value;
}

export function isEventEnabledByDefault(eventType: string): boolean {
  return isDefaultEnabledEventType(eventType);
}
