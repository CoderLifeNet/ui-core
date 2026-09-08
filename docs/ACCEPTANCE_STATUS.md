# Acceptance Status

Date: 2026-09-08

## Scope

Alpha.2 bounded closeout for compatibility facade, instrumentation runtime, visual/bundle hard gates, and artifact reproducibility.

## Required Gates

- check-generated (drift gate)
- check-exports
- typecheck and tests
- visual regression gate
- bundle regression gate
- local pack identity

## Artifact Identity

- ui-core/artifacts/coderlife-ui-core-0.1.0-alpha.2.tgz
- sha256: 102f9039bf69a2bae80c3f372f1af2da5158906ef64a138004d9e84dc49c7e18
- sha512-base64: MRLWoJcWEgqIeYmDJk2AESEJjsoWhwk/qZpaxa2DoEUJr9TrAiaBk9IxK7TpleMFGzZ6goeK1c6VdD2V2Po54A==

## Current Result

- Visual regression mismatch ratio: 0 across all required scenarios.
- Button wrapper overhead versus upstream:
  - root: +1381 raw bytes, +574 gzip bytes
  - subpath: +1381 raw bytes, +569 gzip bytes
- Forbidden module hits in bundle gate: none.

## Generated Drift Gate Proof

- `check:generated` no longer runs generation.
- Reversible verification performed:
  - baseline: `pnpm check:generated` passed
  - introduced drift: appended one newline to `generated/mui-surface.json`
  - drift check result: `pnpm check:generated` failed with generated diff and exit code 1
  - restored original file bytes
  - final check: `pnpm check:generated` passed again

## Documentation Ownership

- Repository-owned acceptance source for core is this file.
- Workspace root `ACCEPTANCE_MATRIX.md` is outside this repository and is not a versioned source of truth for core release status.
