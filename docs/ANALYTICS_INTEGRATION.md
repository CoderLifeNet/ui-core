# Analytics Integration

`@coderlifenet/ui-core` owns instrumentation and scope resolution. Host apps own runtime/consent configuration.

## Runtime Ownership

- Configure analytics once at the host boundary.
- Keep `UIExtensionsProvider` at the application shell.
- Use `TrackingBoundary` to define application/form/field scopes.
- Do not add nested providers inside shared library components.

## Vite Environment Mapping

```ts
const analyticsConfig = {
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === "true",
  consent: {
    analyticsStorage: import.meta.env.VITE_ANALYTICS_CONSENT === "granted" ? "granted" : "denied",
    adStorage: import.meta.env.VITE_AD_CONSENT === "granted" ? "granted" : "denied"
  }
};
```

## Next.js Environment Mapping

```ts
const analyticsConfig = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  consent: {
    analyticsStorage: process.env.NEXT_PUBLIC_ANALYTICS_CONSENT === "granted" ? "granted" : "denied",
    adStorage: process.env.NEXT_PUBLIC_AD_CONSENT === "granted" ? "granted" : "denied"
  }
};
```

## Privacy Defaults

- No analytics delivery without explicit enablement and granted consent.
- No raw event object forwarding.
- No automatic DOM text or input capture.

## Consent Requirements

- All adapters require `analyticsStorage: "granted"`.
- Meta Pixel additionally requires `adStorage: "granted"`.
- Custom adapters should evaluate consent requirements in host code before enabling delivery.

## TrackingBoundary Contract

```tsx
import { TrackingBoundary } from "@coderlifenet/ui-core/extensions";

<TrackingBoundary
  id="field:assignee"
  semanticId="work-order-assignee"
  metadata={{ screen: "work-order-editor", section: "assignment" }}
  events={["ui.text_field.change", "ui.text_field.blur"]}
>
  {/* control subtree */}
</TrackingBoundary>;
```

Precedence and behavior:

- Ancestor `optOut` always wins.
- Tracking paths accumulate by `id` in ancestor order.
- Nearest configured `semanticId` is the default; explicit event `semanticId` can override.
- Metadata merges outer scope, then inner scope, then explicit event metadata.
- Reserved identity fields are protected from metadata overwrite.
- Event selection allowlists inherit by default, empty list disables all, nested lists intersect.

## Event Catalog And Defaults

- Low-volume interaction events are enabled by default.
- High-volume input events (`ui.text_field.*`, `ui.input*.*`, `ui.native_select.*`) are disabled by default and must be explicitly selected via `TrackingBoundary.events`.
- Use `knownUIEventTypes` and `getUnsupportedEventTypes` from `@coderlifenet/ui-core/instrumentation` to validate configuration UIs.

## Provider Mapping

Adapters receive context separately from event metadata:

- GA4 / Meta Pixel: `tracking_path`
- Adobe: `trackingPath`

This mapping is stable and does not flatten scope identity into arbitrary user metadata keys.

## Content-Free File Input Pattern

Automatic value tracking for file inputs is intentionally not enabled by default.

```tsx
import { useEmitUIEvent } from "@coderlifenet/ui-core/instrumentation";

function FilePicker() {
  const emit = useEmitUIEvent();

  return (
    <input
      type="file"
      onChange={() => {
        emit({
          type: "ui.file_picker.change",
          action: "change",
          component: "FilePicker",
          metadata: { source: "profile-upload" }
        });
      }}
    />
  );
}
```

## Runnable Candidate Example

Executable fixture source of truth: `ui-components/consumers/vite-app/src/App.tsx`

Run it locally from `ui-components`:

```bash
pnpm check:consumers
```

The fixture uses only public exports and demonstrates one stable host runtime, app/form/field boundaries, live consent+enablement updates via `runtime.update(...)` in an effect, no-provider safety, explicit file-input events, an in-memory event inspector, and tracking inside `@coderlifenet/ui-components` children.

Lifecycle-safe host pattern:

```tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField
} from "@coderlifenet/ui-core";
import { createAnalyticsRuntime, createMemoryAdapter } from "@coderlifenet/ui-core/analytics";
import {
  TrackingBoundary,
  UIExtensionsProvider,
  createAnalyticsExtension
} from "@coderlifenet/ui-core/extensions";
import { useEmitUIEvent } from "@coderlifenet/ui-core/instrumentation";
import { DataTable } from "@coderlifenet/ui-components";

function FileInputEvent() {
  const emit = useEmitUIEvent();
  return (
    <input
      aria-label="attachment"
      type="file"
      onChange={() =>
        emit({
          type: "ui.file_picker.change",
          action: "change",
          component: "FilePicker",
          metadata: { source: "order-attachment" }
        })
      }
    />
  );
}

function NoProviderSafe() {
  return <Button>No Provider Still Works</Button>;
}

export function AnalyticsDemo() {
  const [enabled, setEnabled] = useState(true);
  const [consent, setConsent] = useState(true);

  const memory = useMemo(() => createMemoryAdapter(), []);
  const runtime = useMemo(
    () =>
      createAnalyticsRuntime([memory], {
        enabled: true,
        consent: {
          analyticsStorage: "granted",
          adStorage: "denied"
        }
      }),
    [memory]
  );

  useEffect(() => {
    runtime.update({
      enabled,
      consent: {
        analyticsStorage: consent ? "granted" : "denied",
        adStorage: "denied"
      }
    });
  }, [consent, enabled, runtime]);

  // Optional: replace adapter set without recreating runtime.
  // runtime.setAdapters([memory, createCustomAdapter(...)])

  return (
    <>
      <NoProviderSafe />

      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(_, checked) => setEnabled(checked)} />}
          label="Global enablement"
        />
        <FormControlLabel
          control={<Switch checked={consent} onChange={(_, checked) => setConsent(checked)} />}
          label="Analytics consent"
        />

        <TrackingBoundary id="app" semanticId="work-orders" metadata={{ page: "editor" }}>
          <TrackingBoundary id="form" metadata={{ section: "details" }}>
            <TrackingBoundary
              id="field:status"
              semanticId="status-field"
              events={[
                "ui.select.change",
                "ui.select.focus",
                "ui.select.blur",
                "ui.checkbox.change"
              ]}
            >
              <TextField select label="Status" defaultValue="open">
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>

              <FormControlLabel control={<Checkbox />} label="Escalated" />
            </TrackingBoundary>

            <TrackingBoundary id="field:notes" events={["ui.text_field.change", "ui.text_field.blur"]}>
              <TextField label="Internal Note" helperText="No text content is captured by default payloads." />
            </TrackingBoundary>

            <FileInputEvent />
          </TrackingBoundary>

          <DataTable
            rows={[{ id: "1", name: "Ava" }]}
            columns={[{ id: "name", header: "Name", accessor: (row) => row.name }]}
            getRowId={(row) => row.id}
            toolbarActions={<Button>Consumer Toolbar Action</Button>}
          />
        </TrackingBoundary>
      </UIExtensionsProvider>
    </>
  );
}
```

## Coverage And Limitations

- `AccordionSummary` emits `ui.accordion.toggle` (action `toggle`, component `AccordionSummary`) for compatibility with published `0.2.0-alpha.0` behavior.
- `TextField select={true}` emits logical select events (`ui.select.change`, `ui.select.focus`, `ui.select.blur`) via public imports.
- `Autocomplete` emits `ui.autocomplete.change` by default; focus/blur are available and default-disabled unless selected by scope.
- For `Autocomplete` composites rendered through `renderInput`, focus/blur ownership belongs to `Autocomplete` to avoid duplicate logical events from the wrapped `TextField` input.
- If only `ui.text_field.focus` / `ui.text_field.blur` are selected for an `Autocomplete` composite scope, no focus/blur event is delivered for that composite; select the `ui.autocomplete.*` focus family for composite focus lifecycle.
- Independently rendered `TextField` components still emit `ui.text_field.focus` / `ui.text_field.blur` when selected.
- `Select`, `Checkbox`, `Radio`, and `Switch` include focus/blur events that are default-disabled unless selected by scope.
- `Autocomplete` typing remains a separate action path from option selection: option selection emits `ui.autocomplete.change`, while standalone field typing continues to map to `ui.text_field.change` where enabled.
- No default event payloads include entered text, selected labels/contents, file names, DOM text, URLs, or business identifiers.
- These APIs are published in `@coderlifenet/ui-core@0.2.0-alpha.0`.
