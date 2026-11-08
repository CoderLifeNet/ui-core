"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Button, TextField } from "@coderlifenet/ui-core";
import DeepButton from "@coderlifenet/ui-core/Button";
import { createTheme, ThemeProvider } from "@coderlifenet/ui-core/styles";
import { scanAccessibility } from "@coderlifenet/ui-core/accessibility";
import { UIExtensionsProvider, createAnalyticsExtension } from "@coderlifenet/ui-core/extensions";
import { createAnalyticsRuntime, createMemoryAdapter } from "@coderlifenet/ui-core/analytics";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    consumer: true;
  }
}

const theme = createTheme({
  components: {
    MuiButton: {
      defaultProps: { variant: "consumer" },
      variants: [{ props: { variant: "consumer" }, style: { borderRadius: "14px" } }]
    }
  }
});

const ConsumerInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input"> & { as?: unknown; ownerState?: unknown }>(
  function ConsumerInput({ as: _as, ownerState: _ownerState, ...props }, ref) {
    return <input {...props} ref={ref} data-consumer-slot="true" />;
  }
);

export default function Consumer() {
  const ref = useRef<HTMLButtonElement>(null);
  const section = useRef<HTMLElement>(null);
  const [status, setStatus] = useState("Waiting for hydration");
  const [plainClicks, setPlainClicks] = useState(0);
  const [event, setEvent] = useState("No tracked events");
  const [{ memory, extension }] = useState(() => {
    const memory = createMemoryAdapter();
    const runtime = createAnalyticsRuntime([memory], {
      enabled: true,
      consent: { analyticsStorage: "granted", adStorage: "denied" }
    });
    return { memory, extension: createAnalyticsExtension(runtime) };
  });

  useEffect(() => {
    const issues = section.current ? scanAccessibility(section.current) : [];
    setStatus(ref.current instanceof HTMLButtonElement && issues.length === 0 ? "Hydrated" : "Consumer checks failed");
  }, []);

  const readLatestEvent = () => setEvent(memory.read().at(-1)?.type ?? "No tracked events");

  return (
    <ThemeProvider theme={theme}>
      <main ref={section}>
        <h1>Packed ui-core consumer</h1>
        <Button variant="consumer" ref={ref} onClick={() => {
          setPlainClicks((count) => count + 1);
          queueMicrotask(readLatestEvent);
        }}>Plain button</Button>
        <TextField id="consumer-email" helperText="Use your work email" slots={{ htmlInput: ConsumerInput }}
          slotProps={{ htmlInput: { "aria-label": "Email" } }} />
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[extension]}>
          <DeepButton onClick={() => queueMicrotask(readLatestEvent)}>
            Tracked button
          </DeepButton>
        </UIExtensionsProvider>
        <p>{status}</p>
        <p>Plain clicks: {plainClicks}</p>
        <p>{event}</p>
      </main>
    </ThemeProvider>
  );
}
