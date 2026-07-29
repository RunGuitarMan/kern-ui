# Releasing `@kern-ui/angular`

Kern publishes through `.github/workflows/release-candidate.yml`. The workflow builds one
candidate, pauses at the protected `npm-production` environment, and publishes the exact
downloaded tarball only after maintainer approval. It does not use a long-lived `NPM_TOKEN`.

## One-time repository configuration

Maintainers must configure these controls before enabling publication:

1. Create a GitHub environment named `npm-production`, require designated reviewers, prevent
   self-review where the organization supports it, and restrict deployment to protected release
   tags.
2. Configure npm trusted publishing for package `@kern-ui/angular`, this repository, workflow file
   `release-candidate.yml`, and environment `npm-production`.
3. Protect `v*` release tags so only release maintainers can create or update them.
4. Keep default-branch protection and required CI checks enabled.

The workflow requests `id-token: write` only in the approved publish job. Candidate assembly has
read-only repository access.

## Release procedure

1. Prepare one release-identity change on the default branch:
   - set `projects/kern/package.json` and `KERN_DOCS_VERSION` in
     `projects/docs/src/app/release-identity.ts` to the exact same version;
   - set `KERN_DOCS_RELEASE_STATE` to `released`;
   - move the relevant entries out of `[Unreleased]` into an exact
     `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` section in `CHANGELOG.md`;
   - include at least one consumer-visible bullet and an HTTPS
     `[MAJOR.MINOR.PATCH]: .../vMAJOR.MINOR.PATCH` link.
2. Wait for required CI and browser checks.
3. Create the exact `vMAJOR.MINOR.PATCH` or prerelease tag on that default-branch commit. Tags are
   immutable release inputs; do not move an existing tag.
4. Run **Prepare and publish release** from that tag and enter the same version. Use `next` for a
   prerelease; a prerelease is rejected under `latest`.
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
dated changelog section, release bullets, and HTTPS tag link describe the same release. It then
runs lifecycle, deprecation, manual-evidence, workspace, consumer, and browser gates before it:

- packs `dist/kern` once;
- builds and smoke-tests the hydrated SSR documentation at `/versions/<version>/`;
- creates a deterministic documentation archive and a per-file SHA-256 manifest;
- resolves the final runtime and peer dependency graph;
- runs `npm audit` at the registered `high` threshold;
- generates a CycloneDX SBOM with npm;
- enforces the package dependency and license allow-list;
- binds package name, version, npm distribution tag, Git tag, full commit, npm tarball,
  documentation archive, documentation manifest, and SBOM in `release-manifest.json`;
- writes SHA-256 hashes to `SHA256SUMS`.

The publish job downloads that artifact, recomputes every hash, rereads the package manifest, SBOM,
and complete documentation archive, creates a draft GitHub release, and invokes
`npm publish <exact-tarball> --provenance` through npm trusted publishing. The GitHub release
becomes public only after npm accepts the package.

The workflow attaches the versioned documentation evidence to the GitHub release but does not
deploy it to an unspecified provider. The immutable artifact and hosting contract are documented
in [VERSIONED_DOCUMENTATION.md](VERSIONED_DOCUMENTATION.md).

## Failure handling

Do not rebuild under the same version after approval. npm versions are immutable:

- failure before npm publication: fix the source, choose a new version/tag when artifacts change,
  and rerun;
- failure after creating the draft GitHub release: keep it draft or delete it before a controlled
  retry;
- npm succeeded but GitHub release publication failed: verify npm provenance and hashes, then
  publish the existing draft without replacing its assets;
- suspected credential, tag, or artifact compromise: stop, follow `SECURITY.md`, and do not approve
  the environment.

SBOM and provenance describe the shipped artifact. They do not assert manual accessibility
certification; that status is tracked separately under `docs/accessibility`.
