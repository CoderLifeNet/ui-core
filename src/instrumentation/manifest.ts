export const uiEventCatalog = {
  "ui.button.click": { component: "Button", trigger: "onClick", defaultEnabled: true },
  "ui.icon_button.click": { component: "IconButton", trigger: "onClick", defaultEnabled: true },
  "ui.link.click": { component: "Link", trigger: "onClick", defaultEnabled: true },
  "ui.checkbox.change": { component: "Checkbox", trigger: "onChange", defaultEnabled: true },
  "ui.checkbox.focus": { component: "Checkbox", trigger: "onFocus", defaultEnabled: false },
  "ui.checkbox.blur": { component: "Checkbox", trigger: "onBlur", defaultEnabled: false },
  "ui.radio.change": { component: "Radio", trigger: "onChange", defaultEnabled: true },
  "ui.radio.focus": { component: "Radio", trigger: "onFocus", defaultEnabled: false },
  "ui.radio.blur": { component: "Radio", trigger: "onBlur", defaultEnabled: false },
  "ui.switch.change": { component: "Switch", trigger: "onChange", defaultEnabled: true },
  "ui.switch.focus": { component: "Switch", trigger: "onFocus", defaultEnabled: false },
  "ui.switch.blur": { component: "Switch", trigger: "onBlur", defaultEnabled: false },
  "ui.tabs.change": { component: "Tabs", trigger: "onChange", defaultEnabled: true },
  "ui.tab.click": { component: "Tab", trigger: "onClick", defaultEnabled: true },
  "ui.menu_item.click": { component: "MenuItem", trigger: "onClick", defaultEnabled: true },
  "ui.accordion.toggle": { component: "AccordionSummary", trigger: "onClick", defaultEnabled: true },
  "ui.pagination.change": { component: "Pagination", trigger: "onChange", defaultEnabled: true },
  "ui.slider.change": { component: "Slider", trigger: "onChangeCommitted", defaultEnabled: true },
  "ui.select.change": { component: "Select", trigger: "onChange", defaultEnabled: true },
  "ui.select.focus": { component: "Select", trigger: "onFocus", defaultEnabled: false },
  "ui.select.blur": { component: "Select", trigger: "onBlur", defaultEnabled: false },
  "ui.native_select.change": { component: "NativeSelect", trigger: "onChange", defaultEnabled: false },
  "ui.native_select.focus": { component: "NativeSelect", trigger: "onFocus", defaultEnabled: false },
  "ui.native_select.blur": { component: "NativeSelect", trigger: "onBlur", defaultEnabled: false },
  "ui.autocomplete.change": { component: "Autocomplete", trigger: "onChange", defaultEnabled: true },
  "ui.autocomplete.focus": { component: "Autocomplete", trigger: "onFocus", defaultEnabled: false },
  "ui.autocomplete.blur": { component: "Autocomplete", trigger: "onBlur", defaultEnabled: false },
  "ui.text_field.change": { component: "TextField", trigger: "onChange", defaultEnabled: false },
  "ui.text_field.focus": { component: "TextField", trigger: "onFocus", defaultEnabled: false },
  "ui.text_field.blur": { component: "TextField", trigger: "onBlur", defaultEnabled: false },
  "ui.input_base.change": { component: "InputBase", trigger: "onChange", defaultEnabled: false },
  "ui.input_base.focus": { component: "InputBase", trigger: "onFocus", defaultEnabled: false },
  "ui.input_base.blur": { component: "InputBase", trigger: "onBlur", defaultEnabled: false },
  "ui.input.change": { component: "Input", trigger: "onChange", defaultEnabled: false },
  "ui.input.focus": { component: "Input", trigger: "onFocus", defaultEnabled: false },
  "ui.input.blur": { component: "Input", trigger: "onBlur", defaultEnabled: false },
  "ui.filled_input.change": { component: "FilledInput", trigger: "onChange", defaultEnabled: false },
  "ui.filled_input.focus": { component: "FilledInput", trigger: "onFocus", defaultEnabled: false },
  "ui.filled_input.blur": { component: "FilledInput", trigger: "onBlur", defaultEnabled: false },
  "ui.outlined_input.change": { component: "OutlinedInput", trigger: "onChange", defaultEnabled: false },
  "ui.outlined_input.focus": { component: "OutlinedInput", trigger: "onFocus", defaultEnabled: false },
  "ui.outlined_input.blur": { component: "OutlinedInput", trigger: "onBlur", defaultEnabled: false }
} as const;

export type KnownUIEventType = keyof typeof uiEventCatalog;

export const knownUIEventTypes: readonly KnownUIEventType[] = Object.keys(uiEventCatalog) as KnownUIEventType[];

export function isKnownUIEventType(eventType: string): eventType is KnownUIEventType {
  return eventType in uiEventCatalog;
}

export function isDefaultEnabledEventType(eventType: string): boolean {
  return isKnownUIEventType(eventType) ? uiEventCatalog[eventType].defaultEnabled : true;
}

export function getUnsupportedEventTypes(eventTypes: readonly string[]): string[] {
  return eventTypes.filter((eventType) => !isKnownUIEventType(eventType));
}

export const instrumentableComponents = {
  Button: ["ui.button.click"],
  IconButton: ["ui.icon_button.click"],
  Link: ["ui.link.click"],
  Checkbox: ["ui.checkbox.change", "ui.checkbox.focus", "ui.checkbox.blur"],
  Radio: ["ui.radio.change", "ui.radio.focus", "ui.radio.blur"],
  Switch: ["ui.switch.change", "ui.switch.focus", "ui.switch.blur"],
  Tabs: ["ui.tabs.change"],
  Tab: ["ui.tab.click"],
  MenuItem: ["ui.menu_item.click"],
  AccordionSummary: ["ui.accordion.toggle"],
  Pagination: ["ui.pagination.change"],
  Slider: ["ui.slider.change"],
  Select: ["ui.select.change", "ui.select.focus", "ui.select.blur"],
  NativeSelect: ["ui.native_select.change", "ui.native_select.focus", "ui.native_select.blur"],
  Autocomplete: ["ui.autocomplete.change", "ui.autocomplete.focus", "ui.autocomplete.blur"],
  TextField: ["ui.text_field.change", "ui.text_field.focus", "ui.text_field.blur"],
  InputBase: ["ui.input_base.change", "ui.input_base.focus", "ui.input_base.blur"],
  Input: ["ui.input.change", "ui.input.focus", "ui.input.blur"],
  FilledInput: ["ui.filled_input.change", "ui.filled_input.focus", "ui.filled_input.blur"],
  OutlinedInput: ["ui.outlined_input.change", "ui.outlined_input.focus", "ui.outlined_input.blur"]
} as const;

export type InstrumentableComponent = keyof typeof instrumentableComponents;
