import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../src/material/Checkbox.js";
import { IconButton } from "../src/material/IconButton.js";
import { MenuItem } from "../src/material/MenuItem.js";
import TextField from "../src/material/TextField.js";

describe("wrapper theme default handlers", () => {
  it("preserves theme default handlers for checkbox, icon button, and TextField select", async () => {
    const user = userEvent.setup();
    const onCheckbox = vi.fn();
    const onIconButton = vi.fn();
    const onTextField = vi.fn();

    const theme = createTheme({
      components: {
        MuiCheckbox: { defaultProps: { onChange: onCheckbox } },
        MuiIconButton: { defaultProps: { onClick: onIconButton } },
        MuiTextField: { defaultProps: { onChange: onTextField } }
      }
    });

    render(
      <ThemeProvider theme={theme}>
        <Checkbox slotProps={{ input: { "aria-label": "theme checkbox" } }} />
        <IconButton aria-label="theme icon">i</IconButton>
        <TextField select label="Theme Select" defaultValue="one">
          <MenuItem value="one">One</MenuItem>
          <MenuItem value="two">Two</MenuItem>
        </TextField>
      </ThemeProvider>
    );

    await user.click(screen.getByLabelText("theme checkbox"));
    await user.click(screen.getByRole("button", { name: "theme icon" }));
    await user.click(screen.getByRole("combobox", { name: "Theme Select" }));
    await user.click(await screen.findByRole("option", { name: "Two" }));

    expect(onCheckbox).toHaveBeenCalledTimes(1);
    expect(onIconButton).toHaveBeenCalledTimes(1);
    expect(onTextField).toHaveBeenCalled();
  });
});
