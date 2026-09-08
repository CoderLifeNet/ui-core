# Contributing

## Development

```bash
pnpm install
pnpm generate
pnpm typecheck
pnpm test
pnpm build
```

## Rules

- Do not edit generated files manually.
- Run `pnpm check:generated` before opening a PR.
- Keep peer dependency ranges aligned with tested compatibility matrix.
- Add behavior tests for any compatibility-impacting change.
