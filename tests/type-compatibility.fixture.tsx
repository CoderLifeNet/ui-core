import { createRef } from "react";
import { Autocomplete, Button, Select, type SelectChangeEvent } from "../src/index.js";

const ref = createRef<HTMLButtonElement>();

const _button = (
  <Button ref={ref} variant="contained" onClick={() => undefined}>
    Save
  </Button>
);

const _select = (
  <Select<number> value={1} onChange={(_event: SelectChangeEvent<number>) => undefined} />
);

const _autocomplete = (
  <Autocomplete<string, false, false, false>
    options={["a", "b"]}
    renderInput={() => null}
    onChange={(_event, value) => {
      const narrowed: string | null = value;
      return narrowed;
    }}
  />
);

void _button;
void _select;
void _autocomplete;
