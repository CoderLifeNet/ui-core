import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import DefaultPropsProvider from "@mui/material/DefaultPropsProvider";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../src/material/Button.js";
import { Checkbox } from "../src/material/Checkbox.js";
import { IconButton } from "../src/material/IconButton.js";
import { MenuItem } from "../src/material/MenuItem.js";
import TextField from "../src/material/TextField.js";
import { createMemoryAdapter } from "../src/analytics/adapters/memory.js";
import { createAnalyticsRuntime } from "../src/analytics/runtime.js";
import { UIExtensionsProvider } from "../src/extensions/runtime.js";
import { createAnalyticsExtension } from "../src/extensions/instrumentation-extension.js";

function setupRuntime() {
  const memory = createMemoryAdapter();
  const runtime = createAnalyticsRuntime([memory], {
    enabled: true,
    consent: { analyticsStorage: "granted", adStorage: "denied" }
  });
  return { memory, runtime };
}

describe("wrapper theme default handlers", () => {
  it("resolves theme defaults and emits logical select events for TextField select defaults", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupRuntime();
    const onCheckbox = vi.fn();
    const onIconButton = vi.fn();
    const onTextField = vi.fn();

    const theme = createTheme({
      components: {
        MuiCheckbox: { defaultProps: { onChange: onCheckbox } },
        MuiIconButton: { defaultProps: { onClick: onIconButton } },
        MuiTextField: { defaultProps: { onChange: onTextField, select: true } }
      }
    });

    render(
      <ThemeProvider theme={theme}>
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
          <Checkbox slotProps={{ input: { "aria-label": "theme checkbox" } }} />
          <IconButton aria-label="theme icon">i</IconButton>
          <TextField label="Theme Select" defaultValue="one">
            <MenuItem value="one">One</MenuItem>
            <MenuItem value="two">Two</MenuItem>
          </TextField>
        </UIExtensionsProvider>
      </ThemeProvider>
    );

    await user.click(screen.getByLabelText("theme checkbox"));
    await user.click(screen.getByRole("button", { name: "theme icon" }));
    await user.click(screen.getByRole("combobox", { name: "Theme Select" }));
    await user.click(await screen.findByRole("option", { name: "Two" }));

    expect(onCheckbox).toHaveBeenCalledTimes(1);
    expect(onIconButton).toHaveBeenCalledTimes(1);
    expect(onTextField).toHaveBeenCalledTimes(1);
    expect(memory.read().some((entry) => entry.type === "ui.select.change")).toBe(true);
  });

  it("resolves DefaultPropsProvider defaults for handlers and select variants", async () => {
    const user = userEvent.setup();
    const { memory, runtime } = setupRuntime();
    const onButtonDefault = vi.fn();
    const onTextFieldDefault = vi.fn();

    render(
      <DefaultPropsProvider
        value={{
          MuiButton: { onClick: onButtonDefault },
          MuiTextField: { onChange: onTextFieldDefault, select: true }
        }}
      >
        <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
          <Button>Provider Default Button</Button>
          <TextField label="Provider Select" defaultValue="one">
            <MenuItem value="one">One</MenuItem>
            <MenuItem value="two">Two</MenuItem>
          </TextField>
        </UIExtensionsProvider>
      </DefaultPropsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Provider Default Button" }));
    await user.click(screen.getByRole("combobox", { name: "Provider Select" }));
    await user.click(await screen.findByRole("option", { name: "Two" }));

    expect(onButtonDefault).toHaveBeenCalledTimes(1);
    expect(onTextFieldDefault).toHaveBeenCalledTimes(1);
    expect(memory.read().some((entry) => entry.type === "ui.select.change")).toBe(true);
  });

  it("preserves explicit prop precedence over theme/default handlers without duplicate invocation", async () => {
    const user = userEvent.setup();
    const themeOnClick = vi.fn();
    const explicitOnClick = vi.fn();
    const themeOnTextFieldChange = vi.fn();
    const explicitOnTextFieldChange = vi.fn();

    const theme = createTheme({
      components: {
        MuiButton: { defaultProps: { onClick: themeOnClick } },
        MuiTextField: { defaultProps: { onChange: themeOnTextFieldChange, select: true } }
      }
    });

    render(
      <ThemeProvider theme={theme}>
        <DefaultPropsProvider value={{ MuiButton: { onClick: themeOnClick }, MuiTextField: { select: true } }}>
          <Button onClick={explicitOnClick}>Explicit Button</Button>
          <TextField label="Explicit Select" defaultValue="one" onChange={explicitOnTextFieldChange}>
            <MenuItem value="one">One</MenuItem>
            <MenuItem value="two">Two</MenuItem>
          </TextField>
        </DefaultPropsProvider>
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Explicit Button" }));
    await user.click(screen.getByRole("combobox", { name: "Explicit Select" }));
    await user.click(await screen.findByRole("option", { name: "Two" }));

    expect(explicitOnClick).toHaveBeenCalledTimes(1);
    expect(themeOnClick).not.toHaveBeenCalled();
    expect(explicitOnTextFieldChange).toHaveBeenCalledTimes(1);
    expect(themeOnTextFieldChange).not.toHaveBeenCalled();
  });
});
