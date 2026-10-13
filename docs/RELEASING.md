# Public alpha release

## Current npm-verified versions (2026-10-13 UTC)

- `@coderlifenet/ui-core@0.2.0-alpha.0` is published.
- Dist-tags for core: `alpha -> 0.2.0-alpha.0`, `latest -> 0.1.0-alpha.2`.
- `@coderlifenet/ui-components@0.2.0-alpha.0` is published.
- Dist-tags for components: `alpha -> 0.2.0-alpha.0`, `latest -> 0.1.0-alpha.2`.

Published historical closeout below remains valid evidence for the first public alpha publication sequence.

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

Historical tag exception at the 2026-09-11 closeout checkpoint: both packages had
`alpha` AND `latest` pointing to `0.1.0-alpha.2`. Core's `latest` was unchanged
during components publication and closeout, but was absent before core's first
publication. Components' `latest` was absent before its first publication and
appeared afterwards. Therefore the original latest-absent/unchanged acceptance
criterion was NOT met. The workflow explicitly requested `--tag alpha`; the cause
of the extra tag was not established. The prior attempt to remove core's `latest`
returned npm E403. No tags were changed during that closeout.

The verified published-source SHA above is immutable release evidence, not the
subsequent closeout documentation commit. External release reports/tarballs and the
history backup were retained; the backup SHA256 remains
`7a3082eb2ee42cfe31d3fe6bb4bef91d448fa15dbaf56c592bc5dbcae2ae7b74`.

## Verified trusted publishing (2026-10-13 UTC)

Both packages published `0.2.0-alpha.0` through the protected `publish-oidc`
workflow with no npm bootstrap token. The [core publication run](https://github.com/CoderLifeNet/ui-core/actions/runs/38251466924)
and [components publication run](https://github.com/CoderLifeNet/ui-components/actions/runs/38278775388)
provide the successful OIDC release evidence. Each used the `npm-alpha`
approval gate, main SHA and provenance checks. The current `alpha` dist-tags
point to `0.2.0-alpha.0`; `latest` still points to the historical
`0.1.0-alpha.2`. Pin exact versions in new consumers.

For later versions, keep the trusted-publisher fields matched to each package:
organization `CoderLifeNet`, repository `ui-core` or `ui-components`,
workflow filename `publish.yml`, environment `npm-alpha`, and permission for
direct `npm publish`. Preserve hosted runners, `id-token: write`, main-only
deployment, required maintainer review, artifact verification and provenance.

Bootstrap credentials were used for the historical first publication. Their
present secret/token state has not been independently checked in this docs
update. The owner can inspect and retire any remaining `NPM_BOOTSTRAP_TOKEN`
environment secrets and corresponding npm granular token after confirming no
other workflow depends on them; do not disclose token values. OIDC publication
has already been proved on both packages, so a bootstrap token is not required
for the next release. The historical `latest` tag exception remains a separate
tag-policy decision; do not silently change either tag.

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

The workflow uses pinned action commits, Node 22.22.3 and npm 11.11.1. Validation
has read-only contents permission and no publishing credential. The separately
approved `npm-alpha` job has `id-token: write`. Keep main-only deployment,
required maintainer review and administrator bypass disabled.

Use `publish-oidc` for a newly approved, unpublished version after strict
prepare and artifact review. The trusted publishers for both packages are
verified by the successful `0.2.0-alpha.0` OIDC runs linked above. This mode
supplies no npm token. Do not republish an existing version to test trust.

`publish-bootstrap` describes the historical first-publication path and is
not the current release path. Do not create or extend a granular token for
routine releases. Confirm and retire any remaining bootstrap secrets/tokens as
described above without weakening the protected environment.

## Manual release and smoke checks

For a separately approved new version after a successful prepare run, dispatch
the exact full main SHA with `publish-oidc`:

```sh
gh workflow run publish.yml --repo CoderLifeNet/ui-core --ref main \\
  -f expected_sha=<approved-full-main-sha> -f mode=publish-oidc
```

Review the fresh validation artifact and approve the waiting `npm-alpha`
environment job. The publish job downloads that same artifact, verifies its
source and hashes, checks version availability again, and publishes only with
`--access public --tag alpha --provenance`. Never dispatch publication as part
of preparation.

Then verify `npm view @coderlifenet/ui-core@<target-version> version
dist.integrity dist.attestations repository --json` and
`npm view @coderlifenet/ui-core dist-tags --json`. Compare integrity to the
approved run's report; verify `alpha` points to the intended target and do not
assume `latest` changes. `0.2.0-alpha.0` is already published and must not be
dispatched again.

## Official references

- <https://docs.npmjs.com/trusted-publishers/>
- <https://docs.npmjs.com/generating-provenance-statements/>
- <https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/>
- <https://docs.npmjs.com/creating-and-viewing-access-tokens/>
- <https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments>
