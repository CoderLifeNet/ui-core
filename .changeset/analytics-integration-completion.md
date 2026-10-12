---
"@coderlifenet/ui-core": minor
---

# Analytics Integration Completion

Complete tracking-boundary integration contract and runtime reliability for nested consumers.

- Extend `TrackingBoundary` with optional `semanticId`, static `metadata`, and typed `events` selection that inherits and intersects by scope.
- Unify event resolution for wrappers and `useEmitUIEvent` with scope-based semantic/metadata precedence and protected reserved identity fields.
- Add authoritative event catalog helpers (`knownUIEventTypes`, `getUnsupportedEventTypes`) and include input-family and `NativeSelect` coverage.
- Add wrappers for `TextField`, `InputBase`, `Input`, `FilledInput`, `OutlinedInput`, and `NativeSelect` with content-free change/focus/blur events (high-volume events are default-disabled unless explicitly selected by scope).
- Harden extension/runtime lifecycle handling for replacement, stale unregister callbacks, unmount cleanup, and adapter/extension error containment.
- Propagate dispatch context (`trackingPath`, `optedOut`, consent) through analytics runtime and adapters, including stable provider mapping fields (`tracking_path` / `trackingPath`).
- Enforce global enablement, adapter enablement, consent, and Meta Pixel ad-storage gating centrally.
- Remove default payload derivations tied to user-entered state (`checked`, `hasValue`, value-count style derivations).
- Add regression tests for boundary precedence/intersection, context propagation, lifecycle replacement, frozen native events, manifest correctness, and high-volume event opt-in behavior.
