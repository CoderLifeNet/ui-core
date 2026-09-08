import { Button, ThemeProvider, createTheme } from "../src/index.js";

declare module "@mui/material/styles" {
  interface Palette {
    brand: Palette["primary"];
  }
  interface PaletteOptions {
    brand?: PaletteOptions["primary"];
  }
}

const theme = createTheme({
  palette: {
    brand: {
      main: "#0057ff"
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      }
    }
  }
});

export function ThemeFixture() {
  return (
    <ThemeProvider theme={theme}>
      <Button variant="contained">Themed</Button>
    </ThemeProvider>
  );
}
