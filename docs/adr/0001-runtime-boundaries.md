# ADR 0001: Runtime boundaries before physical runtime splitting

- Status: superseded by [ADR 0002](0002-runtime-entrypoint-feasibility.md)
- Scope: `@kern-ui/angular` pre-1.0 architecture

## Context

Kern needs independently consumable enterprise primitives, but component families still use
cross-family relative imports and share Angular injection tokens. Creating physical runtime
secondary entry points immediately could compile some services more than once and make token
identity depend on the consumer's import path. Test harnesses have a different dependency shape:
they can remain isolated when they import Angular CDK testing only.

## Historical decision

1. Establish `foundations`, `cdk`, and `core` as logical layers in the current package.
2. Enforce downward dependencies with lint rules.
3. Keep platform access, ID generation, runtime configuration, and generic content contracts in
   the lowest suitable layer.
4. Expose CSS layers through package subpaths because CSS has no Angular runtime identity.
5. Add runtime TypeScript secondary entry points only after all cross-entry imports use their
   published package paths and isolated consumer bundle tests prove there is no duplicate runtime
   code.
6. Permit the physical `@kern-ui/angular/testing` entry point now, guarded by a package check that
   rejects runtime-package imports, injection-token code, missing harness declarations, and an
   excessive test-bundle size.

## Consequences

- Consumers retain one compatible import path during the pre-1.0 refactor.
- New infrastructure has stable ownership and can be adopted component by component.
- Physical tree-shaking improvements arrive after import migration rather than before it.
- Consumer tests can use an isolated, versioned harness API without depending on component DOM.
- Shared form/action styles have left component metadata, reducing repeated FESM code; runtime
  family imports still share the primary bundle boundary.

## Exit criteria

- no lower layer imports from component or pattern layers;
- no undeclared relative imports across future runtime entry-point boundaries;
- one instance of every injection token when root and subpath imports are mixed;
- isolated Button, Form, Select, Grid, and Charts consumer bundles have enforced budgets;
- public declarations expose only exported, supported types.
