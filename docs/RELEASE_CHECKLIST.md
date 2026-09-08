# Release Checklist

- Verify npm namespace ownership and credentials.
- Run `pnpm check:generated`.
- Run `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Run `pnpm pack:local`.
- Validate Vite and Next.js smoke consumers against packed artifacts.
- Generate changeset and release notes.
- Confirm no claims of affiliation with MUI.
