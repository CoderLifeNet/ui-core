# @coderlife/ui-core

`@coderlife/ui-core` is a compatibility facade over Material UI with deterministic export generation plus an opt-in extension runtime for instrumentation.

## Baseline

- React: `18.3.1`
- React DOM: `18.3.1`
- TypeScript: `5.6.3`
- Material UI: `6.1.7`
- Styling engine: `@emotion/react 11.13.3`, `@emotion/styled 11.13.0`

## Installation

```bash
pnpm add @coderlife/ui-core @mui/material @emotion/react @emotion/styled react react-dom
```

Optional coverage:

```bash
pnpm add @mui/lab @mui/icons-material
```

## Compatibility Imports

Root import parity:

```ts
import { Button, TextField } from "@coderlife/ui-core";
```

Per-component parity:

```ts
import Button from "@coderlife/ui-core/Button";
```

Optional entry points:

```ts
import { LoadingButton } from "@coderlife/ui-core/lab";
import { Home } from "@coderlife/ui-core/icons";
```

## Extensions Runtime

```tsx
import { UIExtensionsProvider, TrackingBoundary, useUIExtensions } from "@coderlife/ui-core/extensions";
import { createAnalyticsRuntime } from "@coderlife/ui-core/analytics";
import { createMemoryAdapter } from "@coderlife/ui-core/analytics";
import { createAnalyticsExtension } from "@coderlife/ui-core/extensions";

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
  <TrackingBoundary id="app-shell">{/* app */}</TrackingBoundary>
</UIExtensionsProvider>;
```

## Analytics Defaults

- Global analytics delivery is disabled by default.
- Consent must be explicitly granted (`analyticsStorage: "granted"`).
- No vendor SDK script is loaded by this package.
- Host applications own SDK loading, lifecycle, and consent wiring.

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
