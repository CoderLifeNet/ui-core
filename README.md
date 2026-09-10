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
pnpm add @coderlifenet/ui-core@0.1.0-alpha.2 @mui/material@9.4.0 @emotion/react@11.14.0 @emotion/styled@11.14.1 react@19.2.8 react-dom@19.2.8
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
