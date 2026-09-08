# Upstream Upgrade Workflow

1. Update pinned `@mui/material` version.
2. Run:

```bash
pnpm install
pnpm generate
pnpm check:generated
pnpm typecheck
pnpm test
pnpm build
```

3. Review `generated/mui-surface.json` diffs and classify any new/changed exports.
4. Pack and validate downstream consumers.
