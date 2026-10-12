import type { AnalyticsRuntime } from "../analytics/types.js";
import type { UIExtension } from "./types.js";

export interface CreateAnalyticsExtensionOptions {
  disposeRuntimeOnCleanup?: boolean;
}

interface RuntimeLeaseState {
  refs: number;
  disposeScheduled: boolean;
}

const runtimeLeases = new WeakMap<AnalyticsRuntime, RuntimeLeaseState>();

function acquireRuntimeLease(runtime: AnalyticsRuntime): RuntimeLeaseState {
  const existing = runtimeLeases.get(runtime);
  if (existing) {
    existing.refs += 1;
    return existing;
  }

  const created: RuntimeLeaseState = { refs: 1, disposeScheduled: false };
  runtimeLeases.set(runtime, created);
  return created;
}

function releaseRuntimeLease(runtime: AnalyticsRuntime): void {
  const state = runtimeLeases.get(runtime);
  if (!state) {
    return;
  }

  state.refs = Math.max(0, state.refs - 1);
  if (state.refs > 0 || state.disposeScheduled) {
    return;
  }

  state.disposeScheduled = true;
  queueMicrotask(() => {
    const latest = runtimeLeases.get(runtime);
    if (!latest) {
      return;
    }
    latest.disposeScheduled = false;
    if (latest.refs > 0) {
      return;
    }

    runtimeLeases.delete(runtime);
    runtime.dispose();
  });
}

export function createAnalyticsExtension(
  runtime: AnalyticsRuntime,
  options: CreateAnalyticsExtensionOptions = {}
): UIExtension {
  const managesRuntimeDisposal = options.disposeRuntimeOnCleanup === true;
  if (managesRuntimeDisposal) {
    acquireRuntimeLease(runtime);
  }

  return {
    id: "analytics-runtime",
    category: "instrumentation",
    onEvent: (event, context) => {
      runtime.dispatch(event, context);
    },
    dispose: () => {
      if (managesRuntimeDisposal) {
        releaseRuntimeLease(runtime);
      }
    }
  };
}
