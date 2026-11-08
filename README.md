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

Core forwards the MUI 9.4.0 root API and public Material subpaths. Twenty components add instrumentation through their usual MUI callbacks. Other components retain MUI identity. Lab and Icons use the optional entry points above. MUI X is a separate API.

For a basic migration, change the import and keep your existing JSX, MUI theme, and component props. No CoderLife provider is required. Without an extensions provider, instrumentable components pass your props and refs directly to MUI, including callbacks and slot configuration. Add the extensions provider when you want instrumentation, or mount accessibility diagnostics separately when you want development checks.

Use MUI accessibility props and behavior directly. For example, give an icon-only button an `aria-label`, use `TextField`'s `id`, `label`, and `helperText` for form associations, and use MUI `slotProps` for attributes that belong on an inner element. Accessibility works independently of analytics.

### Optional development checks

```tsx
import { AccessibilityDiagnostics } from "@coderlifenet/ui-core/accessibility";

<AccessibilityDiagnostics enabled={isDevelopment} />;
```

Set `isDevelopment` using your app's build environment. Mount this once to check for missing accessible names on rendered `IconButton`, `TextField`, and `Dialog` elements and broken `aria-describedby` references on `TextField` controls. It writes warnings to the console by default. Supply `onIssue` to handle them locally. The default document scope includes MUI portals. An optional `root` limits scanning to a subtree, and `data-ui-core-a11y-ignore` excludes a specific element or subtree.

### Accessibility checks in tests

Run the same checks against the rendered DOM. Pass `document` when the test opens a portal.

```tsx
import { scanAccessibility } from "@coderlifenet/ui-core/accessibility";
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { TextField } from "@coderlifenet/ui-core";

it("labels the email field and links its helper text", () => {
  const { container } = render(
    <TextField id="email" label="Email" helperText="Use your work email" />
  );

  expect(scanAccessibility(container).map(({ code, message, element }) => ({
    code,
    message,
    html: element.outerHTML
  }))).toEqual([]);
});
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

Choose GA4, Umami, Adobe, Meta Pixel, or a custom adapter in the host runtime. See [Analytics Integration](docs/ANALYTICS_INTEGRATION.md) for examples using existing trackers.

The optional `AnalyticsInspector` shows why tracked interactions are blocked and which adapters receive them. See the [inspector setup](docs/ANALYTICS_INTEGRATION.md#analytics-inspector).

Input-family high-volume events are disabled by default (`TextField`, `InputBase`, `Input`, `FilledInput`, `OutlinedInput`, `NativeSelect`) and can be explicitly enabled per scope with `TrackingBoundary.events`.

Focus/blur coverage for `Select`, `Autocomplete`, `Checkbox`, `Radio`, and `Switch` is available and default-disabled unless explicitly selected via scope allowlists.

`AccordionSummary` keeps the published `ui.accordion.toggle` event contract. For `Autocomplete` composites, focus/blur ownership is assigned to `Autocomplete` (not the wrapped render-input `TextField`) to prevent duplicate logical focus events.

## npm Verification Snapshot (2026-10-12)

- `@coderlifenet/ui-core@0.2.0-alpha.0` is published on npm.
- Dist-tags currently resolve to `alpha -> 0.2.0-alpha.0`, `latest -> 0.1.0-alpha.2`.
- `@coderlifenet/ui-components@0.2.0-alpha.0` is published with npm attestation-backed provenance.

Use exact versions for coordinated installs (`@coderlifenet/ui-core@0.2.0-alpha.0` + `@coderlifenet/ui-components@0.2.0-alpha.0`) and do not rely on `latest`.

For source-review runs, identify local release bytes by source commit plus `pnpm pack:local` hash output.

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

Run `pnpm pack:local && pnpm check:consumers` to build and test a clean Vite and Next.js App Router consumer against the local tarball. The check uses an isolated install and Chromium. It also runs as part of `pnpm check:acceptance`.

## Explicit Exclusions

- MUI X packages are inventoried as out-of-scope for parity claims.
- Private/internal MUI paths are intentionally excluded.
- Documentation-only recipes are documented but not exported as runtime APIs.
