# Implementation Checkpoint

Date: 2026-09-08

## Completed

- Initialized standalone `ui-core` git repository.
- Installed baseline runtime/tooling versions.
- Added strict TypeScript configuration.
- Implemented deterministic generation:
  - `scripts/generate-mui-surface.ts`
  - `generated/mui-surface.json`
  - `generated/mui-export-map.json`
  - generated `src/material/*` compatibility entry points.
- Implemented extension runtime and tracking boundary.
- Implemented analytics runtime and adapters.
- Added unit tests for runtime behavior and inventory checks.
- Built and packed tarball artifact.
- Fixed root export routing so wrapped families resolve from root and subpaths.
- Added `Autocomplete` wrapper and coverage tests.
- Added explicit export/routing CI gate (`check:exports`) and integrated it into CI.
- Added wrapped-route regression tests, including root/subpath parity under one provider.

## Remaining

- Add representative visual regression gates (upstream vs wrapper snapshots).
- Add stronger bundle-size/content budget gates (current checks are smoke-level).

## Continuation Commands

```bash
cd ui-core
pnpm install
pnpm generate
pnpm typecheck
pnpm test
pnpm build
pnpm pack:local
```
