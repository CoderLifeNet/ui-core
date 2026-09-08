export const instrumentableComponents = {
  Button: "onClick",
  IconButton: "onClick",
  Link: "onClick",
  Checkbox: "onChange",
  Radio: "onChange",
  Switch: "onChange",
  Tabs: "onChange",
  Tab: "onClick",
  MenuItem: "onClick",
  AccordionSummary: "onClick",
  Pagination: "onChange",
  Slider: "onChange",
  Autocomplete: "onChange"
} as const;

export type InstrumentableComponent = keyof typeof instrumentableComponents;
