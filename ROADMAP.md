# Roadmap

## 0.1.0-alpha

- Deterministic `@mui/material` facade generation.
- Stable public subpath inventory and export drift checks.
- Optional `lab` and `icons` entry points.
- Extensions runtime with typed event schema v1.
- Analytics adapters: GA4, Adobe bridge, Meta Pixel, custom, memory.

## 0.2.0

- Expand classification fidelity using declaration AST analysis.
- Add upstream docs URL links into generated inventory.
- Add automated parity checks between root exports and generated subpaths.
- Add strict wrapper behavior tests for selected risky components.

## 0.3.0

- Add codemod for import migration from `@mui/material`.
- Add production SSR smoke matrix automation for Vite and Next.js.
- Add upgrade workflow automation for future MUI minor updates.
