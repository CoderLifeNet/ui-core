import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import MuiButton from "@mui/material/Button";
import {
  Button as RootButton,
  AccordionSummary as RootAccordionSummary,
  Autocomplete as RootAutocomplete,
  Checkbox as RootCheckbox,
  IconButton as RootIconButton,
  Link as RootLink,
  MenuItem as RootMenuItem,
  Pagination as RootPagination,
  Radio as RootRadio,
  Select as RootSelect,
  Slider as RootSlider,
  Switch as RootSwitch,
  Tab as RootTab,
  Tabs as RootTabs
} from "../src/index.js";
import {
  Button as SubpathButton,
  default as SubpathButtonDefault
} from "../src/material/Button.js";
import { AccordionSummary as SubpathAccordionSummary } from "../src/material/AccordionSummary.js";
import { Autocomplete as SubpathAutocomplete } from "../src/material/Autocomplete.js";
import { Checkbox as SubpathCheckbox } from "../src/material/Checkbox.js";
import { IconButton as SubpathIconButton } from "../src/material/IconButton.js";
import { Link as SubpathLink } from "../src/material/Link.js";
import { MenuItem as SubpathMenuItem } from "../src/material/MenuItem.js";
import { Pagination as SubpathPagination } from "../src/material/Pagination.js";
import { Radio as SubpathRadio } from "../src/material/Radio.js";
import { Select as SubpathSelect } from "../src/material/Select.js";
import { Slider as SubpathSlider } from "../src/material/Slider.js";
import { Switch as SubpathSwitch } from "../src/material/Switch.js";
import { Tab as SubpathTab } from "../src/material/Tab.js";
import { Tabs as SubpathTabs } from "../src/material/Tabs.js";
import { UIExtensionsProvider } from "../src/extensions/runtime.js";
import { TrackingBoundary } from "../src/extensions/tracking-boundary.js";
import { createAnalyticsRuntime } from "../src/analytics/runtime.js";
import { createMemoryAdapter } from "../src/analytics/adapters/memory.js";
import { createAnalyticsExtension } from "../src/extensions/instrumentation-extension.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wrappedPairs: Array<[string, unknown, unknown]> = [
  ["AccordionSummary", RootAccordionSummary, SubpathAccordionSummary],
  ["Autocomplete", RootAutocomplete, SubpathAutocomplete],
  ["Button", RootButton, SubpathButton],
  ["Checkbox", RootCheckbox, SubpathCheckbox],
  ["IconButton", RootIconButton, SubpathIconButton],
  ["Link", RootLink, SubpathLink],
  ["MenuItem", RootMenuItem, SubpathMenuItem],
  ["Pagination", RootPagination, SubpathPagination],
  ["Radio", RootRadio, SubpathRadio],
  ["Select", RootSelect, SubpathSelect],
  ["Slider", RootSlider, SubpathSlider],
  ["Switch", RootSwitch, SubpathSwitch],
  ["Tab", RootTab, SubpathTab],
  ["Tabs", RootTabs, SubpathTabs]
];

describe("wrapper routing", () => {
  it("keeps wrapped components identical between root and subpath routes", () => {
    for (const [name, rootValue, subpathValue] of wrappedPairs) {
      expect(rootValue, name).toBe(subpathValue);
    }
    expect(SubpathButton).toBe(SubpathButtonDefault);
  });

  it("does not expose wrapped Button as upstream component identity", () => {
    expect(RootButton).not.toBe(MuiButton);
    expect((RootButton as { muiName?: string }).muiName).toBe((MuiButton as { muiName?: string }).muiName);
  });

  it("delivers equivalent events for root and subpath Button under the same provider", async () => {
    const user = userEvent.setup();
    const memory = createMemoryAdapter();
    const runtime = createAnalyticsRuntime([memory], {
      enabled: true,
      consent: {
        analyticsStorage: "granted",
        adStorage: "denied"
      }
    });

    render(
      <UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[createAnalyticsExtension(runtime)]}>
        <TrackingBoundary id="same-boundary">
          <RootButton variant="contained">Root Import</RootButton>
          <SubpathButton variant="contained">Subpath Import</SubpathButton>
        </TrackingBoundary>
      </UIExtensionsProvider>
    );

    await user.click(screen.getByRole("button", { name: "Root Import" }));
    await user.click(screen.getByRole("button", { name: "Subpath Import" }));

    const events = memory.read();
    expect(events).toHaveLength(2);
    for (const event of events) {
      expect(event.type).toBe("ui.button.click");
      expect(event.component).toBe("Button");
      expect(event.metadata).toEqual({ variant: "contained", color: "primary" });
    }
  });

  it("preserves wrapper routing after regeneration", () => {
    const buttonFile = readFileSync(path.join(__dirname, "..", "src", "material", "Button.ts"), "utf8");
    const autocompleteFile = readFileSync(path.join(__dirname, "..", "src", "material", "Autocomplete.ts"), "utf8");
    const rootIndex = readFileSync(path.join(__dirname, "..", "src", "index.ts"), "utf8");

    expect(buttonFile).toContain('from "../wrappers/Button.js"');
    expect(autocompleteFile).toContain('from "../wrappers/Autocomplete.js"');
    expect(rootIndex).toContain('export { Button } from "./wrappers/Button.js";');
    expect(rootIndex).toContain('export { Autocomplete } from "./wrappers/Autocomplete.js";');
  });
});
