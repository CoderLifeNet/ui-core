# @coderlifenet/ui-core

`@coderlifenet/ui-core` is a compatibility facade over Material UI with deterministic export generation plus an opt-in extension runtime for instrumentation.

## Baseline

- React: `19.2.8`
- React DOM: `19.2.8`
- TypeScript: `7.0.2`
- Material UI: `9.4.0`
- Styling engine: `@emotion/react 11.14.0`, `@emotion/styled 11.14.1`

## Installation

```bash
pnpm add @coderlifenet/ui-core@0.2.0-alpha.0 @mui/material@9.4.0 @emotion/react@11.14.0 @emotion/styled@11.14.1 react@19.2.8 react-dom@19.2.8
```

Optional coverage:

```bash
pnpm add @mui/lab @mui/icons-material
```

## Compatibility Imports

Root import parity:

```ts
import { Button, TextField } from "@coderlifenet/ui-core";
```

Per-component parity:

```ts
import Button from "@coderlifenet/ui-core/Button";
```

Optional entry points:

```ts
import { Timeline } from "@coderlifenet/ui-core/lab";
import { Home } from "@coderlifenet/ui-core/icons";
```

## Extensions Runtime

```tsx
import { UIExtensionsProvider, TrackingBoundary, useUIExtensions } from "@coderlifenet/ui-core/extensions";
import { createAnalyticsRuntime } from "@coderlifenet/ui-core/analytics";
import { createMemoryAdapter } from "@coderlifenet/ui-core/analytics";
import { createAnalyticsExtension } from "@coderlifenet/ui-core/extensions";

const memory = createMemoryAdapter();
const analyticsRuntime = createAnalyticsRuntime([memory], {
  enabled: true,
  consent: { analyticsStorage: "granted", adStorage: "denied" }
});
memory.configure?.({ enabled: true, sampleRate: 1 });

<UIExtensionsProvider
  initialConfig={{ enabled: true }}
  extensions={[createAnalyticsExtension(analyticsRuntime)]}
>
  <TrackingBoundary id="app-shell" semanticId="app" metadata={{ area: "shell" }}>
    <TrackingBoundary id="order-form" events={["ui.text_field.change", "ui.text_field.blur"]}>
      {/* app */}
    </TrackingBoundary>
  </TrackingBoundary>
</UIExtensionsProvider>;
```

Keep a single runtime instance and apply state changes with `analyticsRuntime.update(...)` in an effect, not during render. To replace integrations without rebuilding host wiring, use `analyticsRuntime.setAdapters(nextAdapters)`; existing dispatch config is preserved and removed adapters are disposed safely by default.

`TrackingBoundary` supports:

- `id`: required tracking path segment.
- `optOut`: disables nested delivery for private zones.
- `semanticId`: nearest default semantic identity.
- `metadata`: static content-free metadata merged by scope.
- `events`: optional event-type allowlist (nested allowlists intersect).

## Analytics Defaults

- Global analytics delivery is disabled by default.
- Consent must be explicitly granted (`analyticsStorage: "granted"`).
- Meta Pixel requires both analytics and advertising consent (`adStorage: "granted"`).
- No vendor SDK script is loaded by this package.
- Host applications own SDK loading, lifecycle, and consent wiring.

Input-family high-volume events are disabled by default (`TextField`, `InputBase`, `Input`, `FilledInput`, `OutlinedInput`, `NativeSelect`) and can be explicitly enabled per scope with `TrackingBoundary.events`.

Focus/blur coverage for `Select`, `Autocomplete`, `Checkbox`, `Radio`, and `Switch` is available and default-disabled unless explicitly selected via scope allowlists.

`AccordionSummary` keeps the published `ui.accordion.toggle` event contract. For `Autocomplete` composites, focus/blur ownership is assigned to `Autocomplete` (not the wrapped render-input `TextField`) to prevent duplicate logical focus events.

Candidate branch APIs documented in this repository may differ from the currently published npm tarball (`0.1.0-alpha.2`) until `0.2.0-alpha.0` is published.

For branch review, identify candidates by source commit plus local artifact hash from `pnpm pack:local` output rather than assuming npm `0.2.0-alpha.0` parity.

## Inventory and Drift

- Generated stable surface inventory: `generated/mui-surface.json`
- Generated export map: `generated/mui-export-map.json`

Commands:

```bash
pnpm generate
pnpm check:generated
pnpm typecheck
pnpm test
pnpm build
```

## Explicit Exclusions

- MUI X packages are inventoried as out-of-scope for parity claims.
- Private/internal MUI paths are intentionally excluded.
- Documentation-only recipes are documented but not exported as runtime APIs.
