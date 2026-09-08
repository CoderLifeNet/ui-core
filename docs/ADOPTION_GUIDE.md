# Adoption Guide

## Step 1: Swap Imports

Replace:

```ts
import { Button } from "@mui/material";
```

With:

```ts
import { Button } from "@coderlife/ui-core";
```

Or per-component:

```ts
import Button from "@coderlife/ui-core/Button";
```

## Step 2: Keep Existing Theme Setup

Continue using your current MUI `ThemeProvider`, module augmentation, and component override keys (`MuiButton`, etc).

## Step 3: Opt Into Extensions

Wrap app root only when needed:

```tsx
<UIExtensionsProvider initialConfig={{ enabled: true }} extensions={[...]}>
  <App />
</UIExtensionsProvider>
```
