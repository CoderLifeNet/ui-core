# Public alpha release

Published: `@coderlifenet/ui-core@0.1.0-alpha.2`, public, with `alpha` pointing to
this version. See the tag exception below. Pushes, tags, CI and prepare mode do
not publish packages. Never republish this existing version.

## Verified release closeout (2026-09-11 UTC)

- [npm package](https://www.npmjs.com/package/@coderlifenet/ui-core/v/0.1.0-alpha.2)
- Published source: `2ffe4807ddef447fa22deb70b553a84624727cff`.
- [Publication run 34552765075](https://github.com/CoderLifeNet/ui-core/actions/runs/34552765075):
  success, `publish-bootstrap`, after required `npm-alpha` approval.
- [CI 34552548968](https://github.com/CoderLifeNet/ui-core/actions/runs/34552548968)
  and [prepare 34552549016](https://github.com/CoderLifeNet/ui-core/actions/runs/34552549016): success.
- Registry tarball SHA256: `0d2cbd4ed13f911a9b72332e3795bb1fac86d1c9dc2f6dcb7d4ce90e8a71f706`.
- Registry integrity: `sha512-UeuCJig/RoeyHl8+SEsUFy4moycsiNNXyJj/iSRI6lJ6iqkNZewQzWsvNk9Cxb/5XojxAyGxMYhR4+4QO2E7+Q==`.

Anonymous registry metadata and tarball downloads returned HTTP 200. Downloaded
bytes match the validated prepare and publication-run reports. SLSA provenance
subject/digest, source commit, main ref, `.github/workflows/publish.yml`, repository,
and invocation `34552765075/attempts/1` were verified against those records.
Published components has the exact core peer dependency `0.1.0-alpha.2`.

Registry-only Vite 5.4.21 and Next.js 16.3.4 production builds, Chromium browser
assertions and external TypeScript 7.0.2 checks passed. Browser checks covered
root/subpath exports, boundary opt-out, consent revocation and analytics disablement,
with zero page/console errors. The external consumer resolved one React 19.2.8 and
one MUI 9.4.0 version. A separate clean npm consumer using the same exact published
dependencies passed npm 11.11.1 `audit signatures`: 90 registry signatures and
24 attestations verified. No local tarball overrides were used.
See [components' closeout and reproducible checks](https://github.com/CoderLifeNet/ui-components/blob/main/docs/RELEASING.md).

Tag exception: both packages currently have `alpha` AND `latest` pointing to
`0.1.0-alpha.2`. Core's `latest` was unchanged during components publication and
closeout, but was absent before core's first publication. Components' `latest`
was absent before its first publication and appeared afterwards. Therefore the
original latest-absent/unchanged acceptance criterion was NOT met. The workflow
explicitly requested `--tag alpha`; the cause of the extra tag is not established.
The prior attempt to remove core's `latest` returned npm E403. No tags were changed
during closeout. A scope-authorized maintainer must resolve this tag-policy exception
without republishing or unpublishing either version.

The verified published-source SHA above is immutable release evidence, not the
subsequent closeout documentation commit. External release reports/tarballs and the
history backup were retained; the backup SHA256 remains
`7a3082eb2ee42cfe31d3fe6bb4bef91d448fa15dbaf56c592bc5dbcae2ae7b74`.

## Trusted publishing handoff

Neither package's npm trusted-publisher configuration has been verified. Successful
bootstrap publication and valid OIDC-backed provenance do NOT prove tokenless npm
publishing is configured. Official npm guidance was rechecked on 2026-09-11 UTC.

1. In each npm package's Settings > Trusted publishing, add GitHub Actions:
  organization `CoderLifeNet`; repository `ui-core` for core or `ui-components`
  for components; workflow filename `publish.yml` (not a path); environment
  `npm-alpha`. Explicitly allow direct `npm publish`, not only `npm stage publish`.
2. Verify the saved, case-sensitive fields for BOTH packages. Keep GitHub-hosted
  runners, `id-token: write`, main-only deployments, required maintainer review,
  administrator bypass disabled, artifact verification and provenance unchanged.
  Node 22.22.3/npm 11.11.1 satisfy npm's OIDC minimum versions.
3. For the next separately authorized NEW version, dispatch `publish-oidc`, which
  supplies no bootstrap token. Verify that protected publication and its registry
  evidence succeed. npm does not validate trust fields on save; dry-run and
  `npm whoami` do not prove OIDC works. Do not republish alpha.2 to test trust.
4. Both publications and consumer/signature checks are now verified, but the tag
  exception and trust setup remain. For a no-interruption transition, resolve the
  tag disposition and verify both trusted publishers work before removing BOTH
  GitHub `npm-alpha` environment secrets `NPM_BOOTSTRAP_TOKEN` and revoking the
  corresponding granular token(s) in npm. Do not extend a short-lived token just
  for a future test; it may be revoked sooner once setup is reviewed if the owner
  accepts that tokenless publishing remains unproven until the next release.
  After trust is verified, npm recommends Publishing access > Require two-factor
  authentication and disallow tokens. This does not disable OIDC publishing.

No secrets were read, replaced, removed or revoked during closeout. Both protected
environments still require `chrishacia` review, main only, with admin bypass disabled.

## Access prerequisite

On 2026-09-10, npm registry <https://registry.npmjs.org/> authenticated `chrishacia`.
`npm org ls coderlifenet chrishacia --json` confirmed the `owner` role, which grants
package creation and publication rights. Authenticated lookups of both renamed
packages and their 0.1.0-alpha.2 versions returned 404, with no visible versions or
dist-tags. Ownership is established by the membership response, not by those 404s.
Recheck identity, membership and version availability immediately before approval.
Local npm login does not authenticate GitHub Actions. Never put credentials in chat.

All previous approval records and tarballs from before the scope rename are
superseded and must not be published. New-name artifacts and source/hash reports
from the final prepare-only workflows are the only release candidates. The old
external artifact directory remains archival only; the history backup is unchanged.

## Validation and artifact identity

Both dry-run and protected publication use `scripts/check-release.mjs` and its
shared `publish-tarball.mjs` helper. The helper resolves the artifact to an
absolute path and requires an existing regular `.tgz` file before invoking npm.
Never pass bare `artifacts/name.tgz` to npm: npm 11 can interpret it as GitHub
shorthand. `node --test scripts/test-publish-tarball.mjs` checks identical path
handling and alpha policy for both modes. `--publish` always verifies the recorded
artifact identity and registry availability; components also requires published
core. Only dry-run disables provenance. Workflow fixes require fresh source/hash
records and environment approval; never rerun the failed old workflow revision.

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
read-write access limited to `@coderlifenet` and bypass 2FA for CI publishing. Organization
management access alone does not grant package publishing. Enter it directly into
the GitHub `npm-alpha` environment secret `NPM_BOOTSTRAP_TOKEN`, never into chat.
The bootstrap job still uses GitHub OIDC for provenance. After BOTH packages publish,
configure and verify their trusted publishers, delete the environment tokens and
revoke the bootstrap token in npm.
Do not publish a placeholder package to establish trust.

Official npm guidance rechecked on 2026-09-10 still explicitly supports granular
tokens with bypass 2FA for direct publication. This does not bypass interactive
2FA for account-identity/governance actions (changed August 2026) or staged-package
approval. In npm account Access Tokens, choose a short expiration, Packages and
scopes: Read and write, only `@coderlifenet`, and Bypass two-factor authentication.
Organization-management permissions are not needed. Store the token directly in
each repository's Settings > Environments > npm-alpha > NPM_BOOTSTRAP_TOKEN.
Both environment secrets were present for bootstrap publication and remain retained.
Enable account 2FA and complete
any account-management challenges directly on npm. If npm does not offer these
documented settings for this account, stop and resolve with npm; do not weaken gates.
The prepared workflow performs direct publication, not staged publication. New
trusted publishers must explicitly allow `npm publish`, not only `npm stage publish`.

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

Then verify `npm view @coderlifenet/ui-core@0.1.0-alpha.2 version dist.integrity
dist.attestations repository --json` and `npm view @coderlifenet/ui-core dist-tags
--json`. Compare integrity to the approved run's report; alpha must point at
0.1.0-alpha.2 and latest must remain absent/unchanged. Only then release components.
Follow the components registry consumer checks after both packages are public.

## Official references

- <https://docs.npmjs.com/trusted-publishers/>
- <https://docs.npmjs.com/generating-provenance-statements/>
- <https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/>
- <https://docs.npmjs.com/creating-and-viewing-access-tokens/>
- <https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments>
