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

## Previous Browser-Verified Artifact Identity

These hashes identify the earlier alpha.2 browser pass, not a pack of the new CI
scripts. CI packs the current source and downstream verification records those bytes.

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

- `check:generated` derives expected output using the current generator and installed
  MUI declarations/runtime into an OS temporary directory; inputs are read from the
  checkout. It compares generated file contents, material file sets and package
  exports, without consulting Git or writing into the checkout. Temporary output is
  removed on success and failure.
- `pnpm test:generated` passed all six isolated cases: correct output (0), semantic
  stale output unstaged (1), staged (1), committed (1), changed generator without
  regeneration (1), and correct regeneration (0). Caller worktree/index unchanged.
- CI and `check:acceptance` run both checks before any build regeneration.

## First Remote CI

- Proposed repository: `CoderLifeNet/ui-core` (not created by this pass).
- Node 22, pnpm 11.2.2; repository-local workspace frozen install, Chromium installation (Linux
  dependencies included), then `pnpm check:acceptance`. No sibling checkout needed.
- Alpha.2 application behavior and runtime/tooling dependency versions are preserved.

## Documentation Ownership

- Repository-owned acceptance source for core is this file.
- Workspace root `ACCEPTANCE_MATRIX.md` is outside this repository and is not a versioned source of truth for core release status.
