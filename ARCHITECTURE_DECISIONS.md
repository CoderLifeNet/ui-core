# Architecture Decisions

## ADR-001: Compatibility via Generated Re-exports

Status: accepted.

Decision:
- Stable material parity is implemented with generated per-subpath passthrough files and root re-export.

Rationale:
- Preserves upstream names, declarations, and behavior without manually re-declaring prop interfaces.

## ADR-002: Extension Runtime Is Opt-in and Isolated

Status: accepted.

Decision:
- `UIExtensionsProvider` is optional and not required for regular component usage.
- Events are emitted through stable context APIs with no mandatory component wrappers.

Rationale:
- Avoids rendering side effects and preserves standard MUI integration.

## ADR-003: Analytics Uses Injected Clients Only

Status: accepted.

Decision:
- GA4 (`gtag`), Adobe bridge, and Meta Pixel (`fbq`) are adapter-based and injected by host app.
- No SDK scripts or environment variables are read by shared runtime code.

Rationale:
- Keeps privacy control and consent orchestration in host applications.
