import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MuiButton from "@mui/material/Button";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Button } from "../src/material/Button.js";
import { Autocomplete } from "../src/material/Autocomplete.js";
import { Checkbox } from "../src/material/Checkbox.js";
import TextField from "../src/material/TextField.js";
import { UIExtensionsProvider } from "../src/extensions/runtime.js";
import { TrackingBoundary } from "../src/extensions/tracking-boundary.js";
import { createAnalyticsExtension } from "../src/extensions/instrumentation-extension.js";
import { createMemoryAdapter } from "../src/analytics/adapters/memory.js";
import { createAnalyticsRuntime } from "../src/analytics/runtime.js";

function setupWithMemory(consentGranted = true) {
  const memory = createMemoryAdapter();
  const runtime = createAnalyticsRuntime([memory], {
    enabled: true,
    consent: {
      analyticsStorage: consentGranted ? "granted" : "denied",
      adStorage: "denied"
    }
  });
  return { memory, runtime };
}

describe("instrumentation runtime e2e", () => {
  it("works without provider and without throwing", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>No Provider</Button>);
    await user.click(screen.getByRole("button", { name: "No Provider" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("routes real interaction to memory adapter when consent is granted", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider
        initialConfig={{ enabled: true }}
        extensions={[createAnalyticsExtension(runtime)]}
      >
        <TrackingBoundary id="root">
          <Button onClick={() => undefined}>Tracked Button</Button>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Tracked Button" }));
    expect(memory.read().length).toBe(1);
    expect(memory.read()[0]?.type).toBe("ui.button.click");
    expect(memory.read()[0]?.metadata).toEqual({ variant: "text", color: "primary" });
  });

  it("does not deliver when consent denied then resumes after consent update", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(false);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <Button onClick={() => undefined}>Consent Button</Button>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Consent Button" }));
    expect(memory.read().length).toBe(0);

    runtime.update({ consent: { analyticsStorage: "granted", adStorage: "denied" } });
    await user.click(screen.getByRole("button", { name: "Consent Button" }));
    expect(memory.read().length).toBe(1);

    runtime.update({ consent: { analyticsStorage: "denied", adStorage: "denied" } });
    await user.click(screen.getByRole("button", { name: "Consent Button" }));
    expect(memory.read().length).toBe(1);
  });

  it("respects TrackingBoundary opt-out", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="private" optOut>
          <Button onClick={() => undefined}>Private Button</Button>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Private Button" }));
    expect(memory.read().length).toBe(0);
  });

  it("does not produce duplicate event from StrictMode interaction", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <StrictMode>
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
          <Button onClick={() => undefined}>Strict Button</Button>
        </UIExtensionsProvider>
      </StrictMode>
    );

    await user.click(screen.getByRole("button", { name: "Strict Button" }));
    expect(memory.read().length).toBe(1);
  });

  it("wrapper preserves muiName composition metadata", () => {
    expect((Button as unknown as { muiName?: string }).muiName).toBe(
      (MuiButton as unknown as { muiName?: string }).muiName
    );
  });

  it("supports multiple provider instances with isolated configs", async () => {
    const user = userEvent.setup();
    const first = setupWithMemory(true);
    const second = setupWithMemory(false);

    render(
      <>
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(first.runtime)]}>
          <Button onClick={() => undefined}>A</Button>
        </UIExtensionsProvider>
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(second.runtime)]}>
          <Button onClick={() => undefined}>B</Button>
        </UIExtensionsProvider>
      </>
    );

    await user.click(screen.getByRole("button", { name: "A" }));
    await user.click(screen.getByRole("button", { name: "B" }));

    expect(first.memory.read().length).toBe(1);
    expect(second.memory.read().length).toBe(0);
  });

  it("routes selection control change events", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <Checkbox slotProps={{ input: { "aria-label": "toggle" } }} onChange={() => undefined} />
      </UIExtensionsProvider>
    );

    await user.click(screen.getByLabelText("toggle"));
    expect(memory.read().some((entry) => entry.type === "ui.checkbox.change")).toBe(true);
  });

  it("preserves theme default onClick while instrumentation is active", async () => {
    const user = userEvent.setup();
    const defaultOnClick = vi.fn();
    const { memory, runtime } = setupWithMemory(true);
    const theme = createTheme({
      components: {
        MuiButton: {
          defaultProps: {
            onClick: defaultOnClick
          }
        }
      }
    });

    render(
      <ThemeProvider theme={theme}>
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
          <Button>Themed Button</Button>
        </UIExtensionsProvider>
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Themed Button" }));
    expect(defaultOnClick).toHaveBeenCalledTimes(1);
    expect(memory.read()).toHaveLength(1);
  });

  it("emits Autocomplete events without requiring a consumer callback", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <Autocomplete
          options={["Alpha", "Beta"]}
          renderInput={(params) => <TextField {...params} label="Autocomplete" />}
        />
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("combobox", { name: "Autocomplete" }));
    await user.click(await screen.findByRole("option", { name: "Alpha" }));

    expect(memory.read().some((entry) => entry.type === "ui.autocomplete.change")).toBe(true);
  });

  it("calls Autocomplete consumer callback exactly once with original arguments", async () => {
    const user = userEvent.setup();
    const { runtime } = setupWithMemory(true);
    const onChange = vi.fn();

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <Autocomplete
          options={["Alpha", "Beta"]}
          onChange={onChange}
          renderInput={(params) => <TextField {...params} label="Autocomplete callback" />}
        />
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("combobox", { name: "Autocomplete callback" }));
    await user.click(await screen.findByRole("option", { name: "Beta" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.length).toBeGreaterThanOrEqual(2);
  });
});
