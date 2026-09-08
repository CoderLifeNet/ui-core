import { createRef, forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import {
  Autocomplete,
  Button,
  Link,
  Select,
  TextField,
  ThemeProvider,
  createTheme,
  type SelectChangeEvent
} from "../src/index.js";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

type RouterLinkProps = {
  to: string;
  replace?: boolean;
} & Omit<ComponentPropsWithoutRef<"a">, "href">;

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink(props, ref) {
  const { to, ...rest } = props;
  return <a ref={ref} href={to} {...rest} />;
});

const buttonRef = createRef<HTMLButtonElement>();
const anchorRef = createRef<HTMLAnchorElement>();

const _rootButton = (
  <Button ref={buttonRef} variant="contained">
    Save
  </Button>
);

const _routerButton = (
  <Button component={RouterLink} to="/projects" variant="soft">
    Project
  </Button>
);

const _polymorphicLink = (
  <Link component={RouterLink} to="/docs" ref={anchorRef}>
    Docs
  </Link>
);

const _selectTyped = (
  <Select<number>
    value={1}
    onChange={(event: SelectChangeEvent<number>) => {
      const value = event.target.value as number;
      return value;
    }}
  />
);

const _autocompleteSingle = (
  <Autocomplete<string, false, false, false>
    options={["A", "B"]}
    onChange={(_event, value) => {
      const narrowed: string | null = value;
      return narrowed;
    }}
    renderInput={(params) => <TextField {...params} label="Single" />}
  />
);

const _autocompleteMultiple = (
  <Autocomplete<string, true, false, false>
    multiple
    options={["A", "B"]}
    onChange={(_event, value) => {
      const narrowed: readonly string[] = value;
      return narrowed;
    }}
    slotProps={{
      chip: (ownerState) => ({
        size: ownerState.size === "small" ? "small" : "medium"
      })
    }}
    renderInput={(params) => <TextField {...params} label="Multiple" />}
  />
);

const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: "soft" },
          style: { opacity: 0.9 }
        }
      ]
    }
  }
});

const _themedVariant = (
  <ThemeProvider theme={theme}>
    <Button variant="soft">Soft</Button>
  </ThemeProvider>
);

// @ts-expect-error missing required router prop
const _routerMissingRequired = <Button component={RouterLink}>Missing To</Button>;

// @ts-expect-error wrong ref element type
const _wrongRef = <Button ref={anchorRef}>Wrong ref</Button>;

void _rootButton;
void _routerButton;
void _polymorphicLink;
void _selectTyped;
void _autocompleteSingle;
void _autocompleteMultiple;
void _themedVariant;
void _routerMissingRequired;
void _wrongRef;
