"use client";

import { useOptionalUIExtensions } from "../extensions/runtime.js";
import { useTrackingBoundaryContext } from "../extensions/tracking-boundary.js";
import { isDefaultEnabledEventType } from "./manifest.js";

export interface EmitUIEventInput {
  component: string;
  action: string;
  type: string;
  semanticId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const RESERVED_METADATA_KEYS = new Set([
  "schemaVersion",
  "type",
  "action",
  "component",
  "semanticId",
  "timestamp",
  "trackingPath",
  "tracking_path",
  "optedOut"
]);

function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return undefined;
  }

  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (RESERVED_METADATA_KEYS.has(key)) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      output[key] = value;
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
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

    if (tracking.hasEventSelection) {
      if (!tracking.eventSelection?.has(input.type)) {
        return;
      }
    } else if (!isDefaultEnabledEventType(input.type)) {
      return;
    }

    const resolvedSemanticId = input.semanticId ?? tracking.semanticId;
    const mergedMetadata = sanitizeMetadata({
      ...(tracking.metadata ?? {}),
      ...((input.metadata as Record<string, unknown> | undefined) ?? {})
    });

    const event: EmitUIEventInput = {
      component: input.component,
      action: input.action,
      type: input.type,
      ...(resolvedSemanticId ? { semanticId: resolvedSemanticId } : {})
    };

    if (mergedMetadata) {
      event.metadata = mergedMetadata;
    }

    extensions.emit(
      event,
      { trackingPath: tracking.trackingPath, optedOut: tracking.optedOut }
    );
  };
}
