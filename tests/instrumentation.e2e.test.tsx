import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MuiButton from "@mui/material/Button";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Button } from "../src/material/Button.js";
import { Autocomplete } from "../src/material/Autocomplete.js";
import { Checkbox } from "../src/material/Checkbox.js";
import { Radio } from "../src/material/Radio.js";
import { Switch } from "../src/material/Switch.js";
import { MenuItem } from "../src/material/MenuItem.js";
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

  it("does not emit TextField change by default", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TextField label="Plain text" />
      </UIExtensionsProvider>
    );

    await user.type(screen.getByRole("textbox", { name: "Plain text" }), "abc");
    expect(memory.read().some((entry) => entry.type === "ui.text_field.change")).toBe(false);
  });

  it("emits TextField change when scope explicitly enables it", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="form" events={["ui.text_field.change"]}>
          <TextField label="Scoped text" />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.type(screen.getByRole("textbox", { name: "Scoped text" }), "z");
    expect(memory.read().some((entry) => entry.type === "ui.text_field.change")).toBe(true);
  });

  it("emits logical select-change events for TextField select variants", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TextField select label="Status" defaultValue="alpha">
          <MenuItem value="alpha">Alpha</MenuItem>
          <MenuItem value="beta">Beta</MenuItem>
        </TextField>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Beta" }));

    const selectEvent = memory.read().find((entry) => entry.type === "ui.select.change");
    expect(selectEvent?.component).toBe("Select");
  });

  it("captures focus and blur coverage for form controls when explicitly selected", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary
          id="focus-scope"
          events={[
            "ui.checkbox.focus",
            "ui.checkbox.blur",
            "ui.radio.focus",
            "ui.radio.blur",
            "ui.switch.focus",
            "ui.switch.blur",
            "ui.select.focus",
            "ui.select.blur",
            "ui.autocomplete.focus",
            "ui.autocomplete.blur",
            "ui.select.change",
            "ui.autocomplete.change"
          ]}
        >
          <Checkbox slotProps={{ input: { "aria-label": "focus checkbox" } }} />
          <Radio slotProps={{ input: { "aria-label": "focus radio" } }} />
          <Switch slotProps={{ input: { "aria-label": "focus switch" } }} />
          <TextField select label="Focus Select" defaultValue="one">
            <MenuItem value="one">One</MenuItem>
            <MenuItem value="two">Two</MenuItem>
          </TextField>
          <Autocomplete
            options={["Option A", "Option B"]}
            renderInput={(params) => <TextField {...params} label="Focus Autocomplete" />}
          />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    const checkbox = screen.getByLabelText("focus checkbox");
    const radio = screen.getByLabelText("focus radio");
    const toggle = screen.getByLabelText("focus switch");
    const select = screen.getByRole("combobox", { name: "Focus Select" });
    const auto = screen.getByRole("combobox", { name: "Focus Autocomplete" });

    await user.click(checkbox);
    await user.click(radio);
    await user.click(toggle);

    await user.click(select);
    await user.click(await screen.findByRole("option", { name: "Two" }));

    await user.click(auto);
    await user.click(await screen.findByRole("option", { name: "Option A" }));
    await user.tab();

    const types = memory.read().map((entry) => entry.type);
    expect(types).toContain("ui.checkbox.focus");
    expect(types).toContain("ui.checkbox.blur");
    expect(types).toContain("ui.radio.focus");
    expect(types).toContain("ui.radio.blur");
    expect(types).toContain("ui.switch.focus");
    expect(types).toContain("ui.switch.blur");
    expect(types).toContain("ui.select.focus");
    expect(types).toContain("ui.select.blur");
    expect(types).toContain("ui.autocomplete.focus");
    expect(types).toContain("ui.autocomplete.blur");
  });

  it("emits one logical focus/blur event for Autocomplete composites when both families are selected", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary
          id="autocomplete-focus-scope"
          events={[
            "ui.autocomplete.focus",
            "ui.autocomplete.blur",
            "ui.text_field.focus",
            "ui.text_field.blur"
          ]}
        >
          <Autocomplete
            options={["Alpha", "Beta"]}
            renderInput={(params) => <TextField {...params} label="Autocomplete Ownership" />}
          />
          <TextField label="Independent Field" />
          <Button>After Focus</Button>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("combobox", { name: "Autocomplete Ownership" }));
    await user.click(screen.getByRole("button", { name: "After Focus" }));
    await user.click(screen.getByRole("textbox", { name: "Independent Field" }));
    await user.click(screen.getByRole("button", { name: "After Focus" }));

    const types = memory.read().map((entry) => entry.type);
    expect(types.filter((type) => type === "ui.autocomplete.focus")).toHaveLength(1);
    expect(types.filter((type) => type === "ui.autocomplete.blur")).toHaveLength(1);
    expect(types.filter((type) => type === "ui.text_field.focus")).toHaveLength(1);
    expect(types.filter((type) => type === "ui.text_field.blur")).toHaveLength(1);
  });

  it("does not emit Autocomplete-composite focus/blur when only child TextField family is selected", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="autocomplete-child-only" events={["ui.text_field.focus", "ui.text_field.blur"]}>
          <Autocomplete
            options={["Alpha", "Beta"]}
            renderInput={(params) => <TextField {...params} label="Autocomplete Child Only" />}
          />
          <Button>Outside</Button>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("combobox", { name: "Autocomplete Child Only" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));

    const types = memory.read().map((entry) => entry.type);
    expect(types).not.toContain("ui.autocomplete.focus");
    expect(types).not.toContain("ui.autocomplete.blur");
    expect(types).not.toContain("ui.text_field.focus");
    expect(types).not.toContain("ui.text_field.blur");
  });

  it("preserves inputRef and accessible helper-text wiring", () => {
    const inputRef = vi.fn();

    render(
      <TextField
        label="Email"
        helperText="Used for notifications"
        error
        inputRef={inputRef}
        slotProps={{ htmlInput: { "aria-label": "email input" } }}
      />
    );

    expect(inputRef).toHaveBeenCalled();
    const input = screen.getByLabelText("email input");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Used for notifications")).toBeTruthy();
  });

  it("never includes sentinel user content in default payload metadata", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupWithMemory(true);
    const typedSentinel = "SENTINEL_TYPED_7743";
    const selectedSentinel = "SENTINEL_SELECTED_8821";

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="privacy" events={["ui.text_field.change", "ui.autocomplete.change", "ui.select.change"]}>
          <TextField label="Privacy Text" />
          <TextField select label="Privacy Select" defaultValue="a">
            <MenuItem value="a">A</MenuItem>
            <MenuItem value="b">{selectedSentinel}</MenuItem>
          </TextField>
          <Autocomplete
            options={[selectedSentinel, "Other"]}
            renderInput={(params) => <TextField {...params} label="Privacy Autocomplete" />}
          />
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.type(screen.getByRole("textbox", { name: "Privacy Text" }), typedSentinel);
    await user.click(screen.getByRole("combobox", { name: "Privacy Select" }));
    await user.click(await screen.findByRole("option", { name: selectedSentinel }));
    await user.click(screen.getByRole("combobox", { name: "Privacy Autocomplete" }));
    await user.click(await screen.findByRole("option", { name: selectedSentinel }));

    const payload = JSON.stringify(memory.read());
    expect(payload).not.toContain(typedSentinel);
    expect(payload).not.toContain(selectedSentinel);
  });
});
