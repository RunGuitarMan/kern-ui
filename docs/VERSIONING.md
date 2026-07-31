# Versioning and compatibility

Kern versions the publishable `@kern-ui/angular` package with Semantic Versioning. The version in
`projects/kern/package.json` is authoritative; workspace applications are not published products.

## Compatibility matrix

| Kern line | Angular peers | RxJS peer | Contributor Node | Status               |
| --------- | ------------- | --------- | ---------------- | -------------------- |
| `0.1.x`   | `^22.0.0`     | `^7.4.0`  | `24.x`           | Unreleased candidate |

The exact peer dependency ranges in the published package remain authoritative. Supporting a new
Angular major requires its own compatibility work and release; consumers should not use forced
peer installation as evidence of support.

## What is public API

The compatibility contract includes:

- the `@kern-ui/angular` compatibility entry point; the `/cdk`, `/i18n`, `/core`, `/kit`,
  `/addon-grid`, `/addon-charts`, `/patterns`, and `/testing` entry points; declared style
  subpaths; and their exported declarations;
- component and directive selectors;
- inputs, models, outputs, defaults, required state, and generic type behavior;
- public injection tokens, providers, and intentional imperative methods;
- documented slots, CSS custom properties, themes, density and motion names, and the requirement
  to load `styles/kern.css` for complete component presentation;
- documented keyboard interaction, focus behavior, accessible names, and form contracts.

Deep source imports, undeclared family subpaths such as `/forms`, undocumented DOM structure,
generated class names, private/protected members, test fixtures, preview internals, and
documentation-application code are not public API.

The component catalog generates API names, kinds, types, required flags, and defaults from runtime
source. Lifecycle status and behavior guidance remain curated contracts.

## Lifecycle status

| Status         | Compatibility expectation                                                    |
| -------------- | ---------------------------------------------------------------------------- |
| `stable`       | Supported API; the pre-1.0 policy below still applies until `1.0.0`          |
| `beta`         | Suitable for evaluation and controlled production use; refinements may occur |
| `experimental` | Early contract that may change or be removed in a pre-1.0 minor release      |
| `recipe`       | Adaptable composition; its primitives are supported at their own status      |
| `deprecated`   | Still supported for the documented window; replacement is identified         |

Status is not a certification of every browser or assistive-technology combination. The
machine-readable status and promotion profiles are described in [LIFECYCLE.md](LIFECYCLE.md);
support evidence and limitations are documented in [COMPONENTS.md](COMPONENTS.md) and
[BROWSER_SUPPORT.md](BROWSER_SUPPORT.md).

## Change classification

### Major

A major release is required after `1.0.0` for removal or incompatible alteration of public API,
including a higher Angular, Node, or browser floor. Changes to focus order, selection semantics,
overlay behavior, or CSS token meaning can also be breaking even when TypeScript still compiles.

### Minor

A minor release adds backward-compatible components, variants, tokens, optional inputs, or
capabilities. A feature may be marked beta or experimental when its contract is not yet stable.

### Patch

A patch release contains backward-compatible fixes, accessibility corrections, performance
improvements, and documentation updates. A fix may intentionally change behavior that contradicted
the documented contract. Such changes must be called out in the changelog when they can affect
tests or workflows.

Critical security and accessibility fixes may bypass the normal deprecation window. The release
notes must explain the impact and mitigation.

## Pre-1.0 policy

Before `1.0.0`, an incompatible change may ship in a minor release. Kern will still avoid silent
breakage:

- announce the change under `Unreleased`;
- deprecate for at least one minor release when a safe compatibility layer is practical;
- provide before/after code and a migration path;
- keep patch releases backward-compatible except for urgent security or correctness fixes.

Beta and experimental APIs may change in a minor release with changelog and migration context;
experimental APIs may be removed without a full deprecation cycle. Stable APIs do not receive
that exception.

## Deprecation and removal

Deprecations use `@deprecated` in TypeScript where possible and appear in the documentation and
changelog. Every deprecation identifies the replacement and planned removal window in
`projects/kern/api/deprecations.json`; CI compares the registry with the public declaration
baselines. Current migration guidance is in [DEPRECATIONS.md](DEPRECATIONS.md).

After `1.0.0`, a stable API remains available through the rest of its current major line and is
removed only in a subsequent major release. Automated migrations should accompany broad or
mechanical breaking changes.

## Release artifacts

Release tags use `vMAJOR.MINOR.PATCH`; prereleases use identifiers such as
`v1.0.0-rc.1`. A release candidate must:

1. be dispatched from an exact protected tag whose commit belongs to the default branch;
2. have matching source and built package versions;
3. pass lifecycle, evidence, `npm run verify`, and complete Playwright gates;
4. include an updated `CHANGELOG.md`;
5. include the exact npm tarball, versioned SSR documentation tarball and file manifest, npm
   CycloneDX SBOM, release manifest, and SHA-256 checksums;
6. wait for approval in the protected `npm-production` GitHub environment.

After approval, npm trusted publishing uses GitHub OIDC and `--provenance` to publish the exact
verified tarball; no long-lived npm token is required. The same evidence is attached to the GitHub
release. Repository and npm configuration requirements are in [RELEASING.md](RELEASING.md).
The provider-neutral documentation artifact contract is in
[VERSIONED_DOCUMENTATION.md](VERSIONED_DOCUMENTATION.md).
