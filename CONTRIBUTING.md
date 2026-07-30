# Contributing to Kern

Thank you for helping improve Kern. The project is intended for large, long-lived Angular
applications, so changes must preserve accessibility, predictable contracts, and upgradeability
as carefully as they preserve appearance.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security
vulnerabilities must be reported privately according to [SECURITY.md](SECURITY.md).

## Before opening a change

- Search existing issues and pull requests before starting duplicate work.
- Open an issue before a new component, a breaking API change, a new dependency, or a broad
  visual-language change.
- Use an ADR in `docs/adr/` for decisions that change package boundaries, runtime architecture,
  compatibility policy, or the public extension model.
- Keep a pull request focused. Mechanical migrations and behavioral changes should normally be
  separate.

## Local setup

Kern uses the Node version in `.nvmrc`, npm, and the committed lockfile.

```bash
npm ci
npm start
```

The documentation application and its deterministic component previews run at
`http://localhost:4200`. The default `npm start` command watches `kern`, `showcase`, and `docs` as
one Nx development stack. `npm run serve:docs` is the narrower escape hatch for a prebuilt,
Docs-only session. The dev stack performs one initial dependency build and then rebuilds the
ordered `kern → showcase` graph only after library source changes.

### Working with Nx

Nx is the workspace orchestrator. `docs` may depend on `showcase` and `kern`, while `showcase` may
depend on `kern`; tagged ESLint boundaries prevent dependencies in the opposite direction. Prefer
the root npm scripts for the complete supported checks and use Nx for focused iteration:

```bash
npm run nx:projects
npx nx show project showcase
npx nx test kern
npx nx run showcase:test-specimens
npm run affected:test -- --base=main --head=HEAD
```

The committed root `.env` sets `NG_BUILD_MAX_WORKERS=1`. Nx loads it automatically so Angular and
Sass compilation shuts down deterministically with the supported Node 24 toolchain. Do not remove
or override it in CI without running the complete verification gate repeatedly. Nx remains the
only persistent task-cache owner—the nested Angular cache is disabled per project—and can still
run independent targets in parallel.

The workspace contains:

- `projects/kern`: the publishable `@kern-ui/angular` package;
- `projects/showcase`: typed component catalog and documentation metadata;
- `projects/docs`: SSR documentation, interactive playground, and deterministic preview host;
- `tests`: Playwright end-to-end, accessibility, responsive, and visual tests.

Import library code through supported public entry points. Deep imports into any
`projects/kern/<entrypoint>/src/lib` implementation folder are not consumer API.

## Engineering requirements

### Public contracts

- Prefer small, typed, composable APIs over component-specific mechanisms.
- Treat selectors, inputs, models, outputs, exported TypeScript declarations, injection tokens,
  CSS custom properties, style entry points, and documented keyboard behavior as public API.
- Export every type referenced by a public declaration.
- Do not expose template helpers or internal state as public class members.
- Keep the generated component API contract in sync with runtime source; do not hand-edit the
  generated file.
- Assign and justify `stable`, `beta`, `experimental`, `recipe`, or `deprecated` status in the
  catalog. A status promotion needs evidence; a stability reduction needs migration context.
- Add or update an `@kern-ui/angular/testing` harness when a consumer would otherwise need to
  query internal DOM.
- Deprecate before removal and include an actionable migration path. See
  [docs/VERSIONING.md](docs/VERSIONING.md).

### Angular and runtime behavior

- Use standalone components, strict TypeScript, signals, `OnPush`, and the workspace's zoneless
  runtime conventions.
- Keep DOM and browser-global access injectable and SSR-safe.
- Preserve stable identity for stateful collections; do not use array indexes as persisted keys.
- Reuse shared Kern foundations and CDK primitives instead of duplicating overlay, focus, ID, or
  form-control behavior.
- Add shared component UI copy to the typed translation contract; keep product-specific text in
  consumer inputs rather than the library dictionary.

### Accessibility

- Start from native HTML semantics and add ARIA only where the platform needs help.
- Support the complete keyboard model for the implemented widget pattern, visible focus, zoom,
  high contrast, reduced motion, RTL, and programmatic name/description/error relationships.
- Focus must be intentionally placed and restored for overlays and dynamic content.
- Add unit coverage for semantics and keyboard state, plus Playwright coverage for user-visible
  flows. Automated axe checks complement, but do not replace, keyboard and assistive-technology
  review.

### Styling and tokens

- Use semantic Kern tokens and logical properties; avoid hard-coded product colors and physical
  left/right positioning.
- A new token needs a clear semantic purpose, light/dark/high-contrast values, and documentation.
- Treat `styles/kern.css` as the supported global composition. Shared action/form selectors are
  internal implementation details and must stay prefixed; consumers should not target them.
- Component layout should respond to its container where embedding context matters.
- Visual changes need deterministic Docs preview coverage. Review all supported themes,
  densities, directions, and relevant responsive states.

## Verification

Run the full local gate before requesting review:

```bash
npm run verify
```

The gate runs token validation, linting, TypeScript project references, all unit suites,
production builds, public API verification, and a package dry run.

Run browser coverage when behavior, layout, accessibility, documentation, or styles change:

```bash
npm run test:e2e
```

Useful focused commands are:

```bash
npm run test:kern
npm run test:showcase
npm run test:showcase:specimens
npm run test:a11y
npm run test:responsive
npm run test:visual
```

Update visual snapshots only for an intentional, reviewed visual change:

```bash
npm run test:visual -- --update-snapshots
```

Do not make a failing check pass by weakening assertions, increasing image tolerances, or
silencing accessibility rules without documenting the reason and obtaining reviewer agreement.

## Pull requests

A reviewable pull request includes:

- the user or maintainer problem being solved;
- the chosen contract and important alternatives considered;
- tests for behavior, regressions, keyboard interaction, and public API as applicable;
- documentation and migration guidance for consumer-visible changes;
- before/after evidence for visual changes;
- a changelog entry under `Unreleased` for consumer-visible work.

Use concise, imperative commit messages. The repository does not currently require a CLA or a
specific commit-message convention. Contributions are provided under the repository's MIT
License.

Maintainers may ask for a change to be split, redesigned, or moved behind an experimental API.
Opening a pull request does not guarantee that an API will be accepted or released.

Architecture boundaries and current trade-offs are documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); decisions that change them require an ADR.

## Releases

Only maintainers prepare releases. The manual release-candidate workflow validates the exact
source revision, assembles one immutable candidate, pauses at the protected `npm-production`
environment, and then publishes that exact verified tarball through npm trusted publishing with
OIDC provenance after maintainer approval. See [docs/RELEASING.md](docs/RELEASING.md),
[docs/VERSIONING.md](docs/VERSIONING.md), and [CHANGELOG.md](CHANGELOG.md).
