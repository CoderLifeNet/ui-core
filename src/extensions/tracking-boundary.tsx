"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { TrackingBoundaryValue } from "./types.js";

const TrackingContext = createContext<TrackingBoundaryValue>({
  trackingPath: [],
  optedOut: false
});

export interface TrackingBoundaryProps {
  id: string;
  optOut?: boolean;
  children: ReactNode;
}

export function TrackingBoundary({ id, optOut = false, children }: TrackingBoundaryProps) {
  const parent = useContext(TrackingContext);
  const value = useMemo<TrackingBoundaryValue>(
    () => ({
      trackingPath: [...parent.trackingPath, id],
      optedOut: parent.optedOut || optOut
    }),
    [id, optOut, parent.optedOut, parent.trackingPath]
  );

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTrackingPath(): readonly string[] {
  return useContext(TrackingContext).trackingPath;
}

export function useTrackingBoundaryContext(): TrackingBoundaryValue {
  return useContext(TrackingContext);
}
