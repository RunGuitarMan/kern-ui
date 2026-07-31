# ADR 0002: Physical runtime entrypoints

- Status: accepted
- Scope: package ownership, dependency direction, and root compatibility

## Context

Kern needs explicit boundaries for large enterprise consumers without creating a second instance
of an Angular `InjectionToken`, root service, or component when root and direct imports are mixed.
The former single runtime bundle protected identity but made ownership implicit and could not
isolate Grid and Charts at the package level.

## Decision

Kern publishes this acyclic runtime graph:

```text
cdk ──────→ core ─→ kit ─→ patterns
  └─────────┴────→ addon-grid
            └────→ addon-charts
i18n ─────→ core + kit

root ─→ cdk + i18n + core + kit + addon-grid + addon-charts + patterns
testing ─→ Angular CDK testing only
```

The supported package paths are:

```text
@kern-ui/angular/cdk
@kern-ui/angular/i18n
@kern-ui/angular/core
@kern-ui/angular/kit
@kern-ui/angular/addon-grid
@kern-ui/angular/addon-charts
@kern-ui/angular/patterns
@kern-ui/angular/testing
```

Foundations are owned by `core`. General Data Display remains in `kit`; Data Grid is owned only
by `addon-grid`. Charts and product patterns each have one owner. Cross-owner imports use package
subpaths, never relative source paths or the root compatibility API.

The root entrypoint contains re-exports only and remains supported for at least one major line.
It must expose the exact same runtime objects as direct entrypoints.

[ADR 0005](0005-lightweight-i18n-entrypoint.md) records why the independent `i18n` leaf-token
entrypoint exists. Core and Kit may depend on it; it never depends on CDK, Core, Kit, or product
layers.

## Enforcement

`projects/kern/api/runtime-entrypoints.json` is the reviewed ownership and dependency matrix.

- `verify:entrypoint-boundaries` rejects unowned or multiply owned production files, cycles,
  undeclared package edges, cross-owner relative imports, and incomplete public aggregators.
- `verify:entrypoint-identity` links a real Angular fixture against the built package and checks
  root/direct strict identity for all runtime exports and explicit token/service/component
  representatives.
- API baselines cover every typed entrypoint.
- Packed consumers compile root and direct imports, validate exports, and enforce isolated bundle
  and tree-shaking budgets.

## Consequences

- New code can import the smallest stable capability boundary.
- `KRN_PLATFORM`, configuration, translations, theme services, and every other injectable have a
  single compilation owner.
- Grid and Charts can evolve and be budgeted without widening Kit ownership.
- A new entrypoint or dependency edge requires a matrix change, API baseline, identity
  representatives, consumer fixture, and architectural review.
- Removing the root aggregator is a future breaking change and is not implied by this ADR.

This decision supersedes the temporary single-runtime-entrypoint constraint in
[ADR 0001](0001-runtime-boundaries.md).
