# Releasing `@kern-ui/angular` and `@kern-ui/mcp`

Kern publishes through `.github/workflows/release-candidate.yml`. The workflow builds one
candidate containing both version-aligned packages, pauses at the protected `npm-production`
environment, and publishes the exact downloaded tarballs only after maintainer approval. Tarball
publication uses short-lived npm trusted-publishing OIDC credentials. npm's
[trusted-publishing documentation](https://docs.npmjs.com/trusted-publishers/) does not currently
extend OIDC authentication to `npm dist-tag`, so public-tag promotion uses a separately scoped and
rotated granular token only in the promotion step.

The npm registry does not allow trusted-publisher configuration until a package already exists.
Only the declared first version (`0.1.0`) may therefore use the workflow's `bootstrap-token` mode.
That mode is registry-aware and resumable, refuses any package with a different published version,
and still requires GitHub provenance. After the first release, revoke the bootstrap token and use
`trusted-publishing` exclusively.

## One-time repository configuration

Maintainers must configure these controls before enabling publication:

1. Create a GitHub environment named `npm-production`, require designated reviewers, prevent
   self-review where the organization supports it, and restrict deployment to protected release
   tags.
2. Configure npm trusted publishing independently for packages `@kern-ui/angular` and
   `@kern-ui/mcp`, this repository, workflow file `release-candidate.yml`, and environment
   `npm-production`.
3. In the protected `npm-production` environment, create the secret `NPM_DIST_TAG_TOKEN`. Its npm
   granular access token must select only `@kern-ui/angular` and `@kern-ui/mcp`, grant package
   **Read and write**, enable bypass 2FA for non-interactive tag writes, use the shortest practical
   expiration, and be rotated before expiry. While this hybrid flow is used, package publishing
   settings must not select **disallow tokens**, because that also rejects `npm dist-tag` writes.
4. Protect `v*` release tags so only release maintainers can create or update them.
5. Keep default-branch protection and required CI checks enabled. CI compares lifecycle status
   changes with the exact pull-request base or preceding push commit and rejects an unproven
   beta/experimental-to-stable promotion.

For the one-time first publication only, create `NPM_BOOTSTRAP_TOKEN` in `npm-production`. Because
the two package records do not exist yet, this token must be able to create public packages under
the `@kern-ui` scope, write dist-tags, and bypass publish 2FA. Select `bootstrap-token` for `0.1.0`,
then immediately revoke the secret/token, configure both trusted publishers, and retain only the
narrow `NPM_DIST_TAG_TOKEN` described above. The bootstrap guard rejects later versions.

The workflow requests `id-token: write` only in the approved publish job. Candidate assembly has
read-only repository access. `NPM_DIST_TAG_TOKEN` is not job-wide: only the promotion/rollback step
receives it, so the two preceding `npm publish` operations continue to authenticate with OIDC.

## Release procedure

1. Prepare one release-identity change on the default branch:
   - set `projects/kern/package.json`, `projects/kern-mcp/package.json`, and `KERN_DOCS_VERSION` in
     `projects/docs/src/app/release-identity.ts` to the exact same version;
   - set `projects/kern-mcp/package.json#peerDependencies.@kern-ui/angular` and the matching
     `projects/kern/api/release-policy.json#companionPackage.peerDependencies` entry to that exact
     version;
   - set `KERN_DOCS_RELEASE_STATE` to `released`;
   - move the relevant entries out of `[Unreleased]` into an exact
     `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` section in `CHANGELOG.md`;
   - include at least one consumer-visible bullet and an HTTPS
     `[MAJOR.MINOR.PATCH]: .../vMAJOR.MINOR.PATCH` link.
2. Wait for required CI and browser checks.
3. Create the exact `vMAJOR.MINOR.PATCH` or prerelease tag on that default-branch commit. Tags are
   immutable release inputs; do not move an existing tag.
4. Run **Prepare and publish release** from that tag and enter the same version. Use `next` for a
   prerelease; a prerelease is rejected under `latest`. Select `bootstrap-token` only for the first
   `0.1.0` publication and `trusted-publishing` for every subsequent release.
5. Inspect the candidate job, immutable artifact digest, npm and versioned-documentation tarballs,
   manifests, SBOM, checksums, and pending GitHub environment deployment.
6. Approve `npm-production` only when the evidence matches the intended release.

The workflow runs `tools/verify-kern-release-identity.mjs` both while assembling the candidate and
again from the checked-out tag immediately before publication. A normal development checkout with
`KERN_DOCS_RELEASE_STATE = 'source-candidate'` intentionally fails that release-only gate. After a
release, the next development change must restore `source-candidate` while preserving the released
changelog section.

## Candidate evidence

The candidate job first proves that package version, tag, documentation version, released state,
dated changelog section, release bullets, and HTTPS tag link describe the same release. Its strict
lifecycle gate resolves the newest synchronized public `latest`/`next` version below the candidate,
binds it to an ancestor `v<version>` Git tag, and rejects any beta/experimental-to-stable transition
that lacks promotion evidence. It writes this decision as `lifecycle-attestation.json`: the candidate
version/tag/commit, the immutable base version/tag/commit (or no prior public release), and SHA-256
hashes of every lifecycle-verifier input. The attestation is checksummed in `release-manifest.json`;
the publish job rechecks it against the checked-out `RELEASE_COMMIT` without querying mutable npm
dist-tags. The candidate then runs deprecation, manual-evidence, workspace, consumer, and browser
gates before it:

- packs `dist/kern` and `dist/kern-mcp` once each;
- builds and smoke-tests the hydrated SSR documentation at `/versions/<version>/`;
- creates a deterministic documentation archive and a per-file SHA-256 manifest;
- derives each package's exact runtime and peer dependency graph from the committed workspace
  `package-lock.json`, without a second dependency resolution, and rejects every selected edge whose
  exact lockfile version falls outside its declared dependency or peer range;
- runs `npm audit` at the registered `high` threshold;
- generates a separate reproducible CycloneDX SBOM for each package with npm, removes
  invocation-specific fields, and records the source lockfile digest;
- enforces the package dependency and license allow-list;
- binds both package names, versions, npm distribution tag, Git tag, full commit, both npm
  tarballs, documentation archive, documentation manifest, both SBOMs, and the lifecycle
  attestation in
  `release-manifest.json`;
- writes SHA-256 hashes to `SHA256SUMS`.

The publish job downloads that artifact, recomputes every hash, and rereads both package manifests
and SBOMs plus the complete documentation archive. Its resumable publisher first publishes or
restores both exact versions under the non-default `kern-staging` workflow tag. Only after both
registry integrities match the approved tarballs, the token proves write capability for both
packages by idempotently re-applying the already-correct `kern-staging` tag. Only then does one
rollback-protected promotion move `latest` or `next` for both packages; rollback intent is recorded
before each registry mutation so even a mutate-then-timeout response restores the previous public
tags. An occupied version with different bytes is always rejected. The GitHub release is created or
updated only after both public tags converge. `latest` and `next` may be restored by automatic
failure rollback, but a new promotion is monotonic under full SemVer ordering and cannot move either
tag to an older stable or prerelease version.

Before the GitHub release is created, the workflow rereads both public npm manifests, requires the
SLSA provenance attestation, downloads both packages back from the canonical registry, and proves
that their SHA-512 integrity and public dist-tags match the approved tarballs.

The workflow attaches the versioned documentation evidence to the GitHub release but does not
deploy it to an unspecified provider. The immutable artifact and hosting contract are documented
in [VERSIONED_DOCUMENTATION.md](VERSIONED_DOCUMENTATION.md).

## Failure handling

Do not rebuild under the same version after approval. npm versions are immutable:

- failure before npm publication: fix the source, choose a new version/tag when artifacts change,
  and rerun;
- one staged npm package succeeded but the other failed: rerun the approved publish job with the
  same immutable artifact; the exact already-published integrity is verified before the missing
  package is retried, while `latest`/`next` remain unchanged;
- public tag promotion failed: the workflow restores every tag changed by that attempt; inspect
  the rollback result and rerun with the same immutable artifact;
- capability probing failed before public promotion: verify that `NPM_DIST_TAG_TOKEN` is unexpired,
  has read/write access to both exact packages, and can bypass package write 2FA; rotate the
  environment secret without rebuilding the candidate;
- npm succeeded but GitHub release publication failed: rerun the approved publish job; both exact
  npm artifacts are verified and skipped, then the release assets are created or replaced from the
  approved candidate;
- suspected credential, tag, or artifact compromise: stop, follow `SECURITY.md`, and do not approve
  the environment.

SBOM and provenance describe the shipped artifact. They do not assert manual accessibility
certification; that status is tracked separately under `docs/accessibility`.
