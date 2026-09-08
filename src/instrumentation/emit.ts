"use client";

import { useOptionalUIExtensions } from "../extensions/runtime.js";
import { useTrackingBoundaryContext } from "../extensions/tracking-boundary.js";

export interface EmitUIEventInput {
  component: string;
  action: string;
  type: string;
  semanticId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export function useEmitUIEvent(): (input: EmitUIEventInput) => void {
  const extensions = useOptionalUIExtensions();
  const tracking = useTrackingBoundaryContext();

  return (input) => {
    if (!extensions) {
      return;
    }
    if (tracking.optedOut) {
      return;
    }
    extensions.emit(input, { trackingPath: tracking.trackingPath, optedOut: tracking.optedOut });
  };
}
