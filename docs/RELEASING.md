# Public alpha release

Proposed first publication: `@coderlife/ui-core@0.1.0-alpha.2`, public, dist-tag
`alpha` only. No packages are published by pushes, tags, CI, or prepare mode.

## Access prerequisite

On 2026-09-10 the configured registry was https://registry.npmjs.org/ and
`npm whoami` returned ENEEDAUTH. Anonymous package lookup returned 404, so no
public versions or dist-tags were visible. This is not proof of scope ownership,
permission, or availability of a potentially private package.

Run `npm login --registry=https://registry.npmjs.org/` in your own terminal and
complete browser/2FA authentication there. Never put credentials into chat.
Run `npm whoami` and `npm org ls coderlife <npm-username> --json`. An npm owner
must confirm this identity can create packages in the scope. If the scope is a
user namespace rather than an organization, the authenticated username must be
`coderlife`. For existing packages, also check
`npm access list collaborators @coderlife/ui-core --json` and registry versions.
GitHub membership does not grant npm rights. Resolve any missing npm invitation,
organization package-creation permission, or package write access before approval.

## Validation and artifact identity

Run `pnpm check:acceptance`, then
`node scripts/check-release.mjs --available --dry-run` from a clean committed
checkout. The inspector checks the packed manifest, allowlist, all exports and
declarations, portable dependencies, and records SHA256/SHA512 plus source HEAD
in ignored `artifacts/release.json`. Local dry runs disable provenance only because
there is no local CI OIDC identity; real publication always requires provenance.
A dry run does not verify publishing permissions or generate an attestation.

Dispatch `.github/workflows/publish.yml` on main with `expected_sha` equal to its
full commit and `mode=prepare`. This reruns acceptance on Ubuntu and uploads
the exact checked tarball plus identity report as `npm-alpha-<commit>` for 30 days.
Review this report before publication; local and CI tarball hashes can differ.

## Authentication and approval

The workflow uses pinned action commits, Node 22.22.3 and npm 11.11.1 (OIDC requires
Node >=22.14 and npm >=11.5.1). Validation has read-only contents permission and
no publishing credential. Only the separately approved `npm-alpha` environment
job has `id-token: write`. Configure that environment with main-only deployment
branches, a required maintainer reviewer, and administrator bypass disabled.

Preferred mode is `publish-oidc`: in npm package settings add a GitHub trusted
publisher with organization `CoderLifeNet`, repository `ui-core`, workflow
`publish.yml`, environment `npm-alpha`, allowing direct `npm publish`.
No npm token is supplied in this mode. The public repository URL matches provenance.

Trusted-publisher configuration is attached to an existing npm package. For a
first package without accessible settings, use `publish-bootstrap` once: an npm
scope-authorized maintainer creates a short-lived granular token with package/scope
read-write access limited to `@coderlife` and bypass 2FA for CI publishing. Organization
management access alone does not grant package publishing. Enter it directly into
the GitHub `npm-alpha` environment secret `NPM_BOOTSTRAP_TOKEN`, never into chat.
The bootstrap job still uses GitHub OIDC for provenance. After first publication,
configure the trusted publisher, delete the environment token and revoke it in npm.
Do not publish a placeholder package to establish trust.

## Manual release and smoke checks

After separate publication approval and access setup, run:

```sh
gh workflow run publish.yml --repo CoderLifeNet/ui-core --ref main \
  -f expected_sha=<approved-full-main-sha> -f mode=publish-bootstrap
```

Use `publish-oidc` instead when trusted publishing is configured. Review the fresh
validation artifact and approve the waiting `npm-alpha` environment job. The
publish job downloads that same artifact, verifies its source and hashes, checks
version availability again, and publishes only with `--access public --tag alpha
--provenance`. Never dispatch publication as part of preparation.

Then verify `npm view @coderlife/ui-core@0.1.0-alpha.2 version dist.integrity
dist.attestations repository --json` and `npm view @coderlife/ui-core dist-tags
--json`. Compare integrity to the approved run's report; alpha must point at
0.1.0-alpha.2 and latest must remain absent/unchanged. Only then release components.
Follow the components registry consumer checks after both packages are public.

## Official references

- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/generating-provenance-statements/
- https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
- https://docs.npmjs.com/creating-and-viewing-access-tokens/
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments