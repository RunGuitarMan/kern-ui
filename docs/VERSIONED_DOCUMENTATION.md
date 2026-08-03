# Versioned documentation artifacts

Every release produces one immutable documentation artifact from the same Git tag and commit as
`@kern-ui/angular` and `@kern-ui/mcp`. The artifact is a complete Angular SSR application with
hydration; it is not a source snapshot or a browser-only export.

The repository deliberately does not choose a hosting provider. Publication infrastructure must
deploy the released bytes without rebuilding them and preserve the manifest mount path. Selecting
that infrastructure is an external operations decision.

## Artifact contract

For version `X`, the release contains:

- `kern-docs-X.tgz`: deterministic archive rooted at `kern-docs/`;
- `kern-docs-X.manifest.json`: identical to
  `kern-docs/versioned-docs-manifest.json` inside the archive;
- `release-manifest.json`: binds both documentation files and both package artifacts to version
  `X`, tag `vX`, the full Git commit, and `/versions/X/`;
- `SHA256SUMS`: exact hashes of both npm tarballs and SBOMs, the documentation archive,
  documentation manifest, and release manifest.

The documentation manifest contains every SSR/browser file path, byte length, SHA-256 hash, an
aggregate content hash, package identity, source identity, and runtime entry point. It marks
hydration as verified only when the build includes `browser/kern-hydration-evidence.json` from a
successful Chromium smoke test. The evidence records its checks, the actual Chromium version, the
pinned Playwright version, and is bound to the exact build bytes; the manifest records the evidence
hash. Entries are sorted, the exact Node/npm/Angular/Playwright toolchain is recorded, and archive
metadata is normalized, so packaging the same build and identity twice produces identical bytes.

## Build and verification

The release workflow performs the equivalent of:

```bash
npx nx build docs \
  --configuration production \
  --base-href /versions/X/ \
  --output-path dist/versioned-docs

node tools/smoke-kern-versioned-docs.mjs \
  --input-dir=dist/versioned-docs \
  --base-path=/versions/X/

node tools/verify-kern-versioned-docs.mjs prepare \
  --version=X \
  --tag=vX \
  --commit=FULL_GIT_SHA \
  --base-path=/versions/X/ \
  --input-dir=dist/versioned-docs \
  --artifact-dir=release
```

The smoke test requests the version root, a hashed browser bundle, the machine-readable agent
contract, and a dynamic component route from the built Node server. It then launches headless
Chromium, follows a client-side lazy route under `/versions/X/`, changes state in a hydrated
component, and rejects page, console, HTTP, or request errors. On success it writes deterministic,
build-bound hydration evidence. Preparation rejects missing or stale evidence, missing SSR/browser
output, unsafe paths, symlinks, an incorrect `<base href>`, or an incorrect prerendered root.

Before approval, `verify-kern-release-artifacts.mjs prepare` independently validates the
documentation archive and includes its hashes in the release evidence. After approval, the
downloaded candidate is passed to the same documentation verifier and the release verifier. No
documentation rebuild occurs across that boundary.

For an independent check of downloaded release evidence:

```bash
node tools/verify-kern-release-artifacts.mjs verify \
  --version=X \
  --tag=vX \
  --commit=FULL_GIT_SHA \
  --npm-tag=latest \
  --artifact-dir=release
```

## Hosting boundary

Run the archive entry point with the manifest mount path:

```bash
KERN_DOCS_BASE_PATH=/versions/X/ \
  node kern-docs/server/server.mjs
```

Use the Node version recorded in `build.toolchain.node` in the sidecar manifest.

A hosting implementation must:

1. map `/versions/X/` to the exact released archive without rewriting its contents;
2. treat that version path as immutable and cache hashed assets accordingly;
3. keep any `latest` or channel alias separate and replaceable;
4. retain older supported versions according to project version policy;
5. verify `SHA256SUMS` and the manifests before promotion.

The repository does not claim that documentation is deployed until an external hosting target and
its access, rollback, retention, and availability policy are selected.
