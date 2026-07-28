# Consumer quality gates

Kern validates the built npm artifact as a consumer would receive it. Source-only imports and
workspace path aliases are deliberately excluded from these checks.

## Public API baselines

`npm run verify:api-baseline` discovers every package export in `dist/kern/package.json` that has
both `types` and `default` conditions. Every discovered TypeScript entrypoint must be registered
in `projects/kern/api/entrypoints.json` and have a committed, normalized declaration baseline.

The current baselines cover the root compatibility API, all six runtime subpaths (`cdk`, `core`,
`kit`, `addon-grid`, `addon-charts`, and `patterns`), and `@kern-ui/angular/testing`.

An added, removed, or changed public declaration fails CI. After confirming the semantic-version
impact, migration guidance, and changelog entry, update baselines explicitly:

```bash
npm run build:kern
npm run api:baseline:write
npm run verify:api-baseline
```

Baseline updates are consumer API changes and require declaration-level review. The verifier
automatically rejects a future typed package entrypoint until it is added to the configuration,
so the gate scales to physical runtime subpaths without changing its implementation.

## Runtime entrypoint ownership and identity

`projects/kern/api/runtime-entrypoints.json` is the reviewed ownership and dependency matrix for
`cdk`, `core`, `kit`, `addon-grid`, `addon-charts`, and `patterns`.

`npm run verify:entrypoint-boundaries` runs before compilation and requires:

- exactly one compilation owner for every production source file;
- an acyclic dependency matrix;
- relative imports only inside one physical entrypoint;
- package-subpath imports for every cross-entrypoint dependency;
- no import of the root compatibility entrypoint from a secondary entrypoint;
- public APIs that expose only their declared owners;
- a root API that aggregates each runtime subpath exactly once.

Immediately after the package build, `npm run verify:source-pollution` rejects JavaScript,
declaration, and source-map artifacts emitted into the primary or secondary source trees. Build
output belongs only in `dist` or `out-tsc`.

`npm run verify:entrypoint-identity` packs `dist/kern`, installs it into a locked isolated
workspace, then loads the root and every runtime subpath through the Node ESM resolver. It checks
every JavaScript export has one secondary owner and requires strict `Object.is` identity between
root and direct imports. Explicit representatives cover shared tokens, root services, and
components even if future compiler output changes the broader export set. The production Angular
linker path is exercised separately by the packed consumer builds below.

Changing ownership or adding a dependency requires architectural review of the matrix. A new
runtime subpath also requires a declaration baseline, identity representatives, and a packed
consumer case.

## Packed consumer builds

`npm run verify:consumers` performs an integration test against an actual tarball:

1. copies only committed fixture inputs, excluding local caches, outputs, and `node_modules`;
2. installs the fixture toolchain from its committed lockfile and with Angular CLI cache disabled;
3. packs `dist/kern`;
4. installs the tarball into the isolated workspace without network access;
5. verifies every declared package export resolves to a file, including styles, schematics, root,
   and testing entrypoints;
6. type-checks strict consumers of root, direct runtime subpaths, and testing APIs;
7. production-builds isolated Button, Form, Select, Grid, and Charts applications from both the
   root compatibility API and their direct `kit` or `addon-*` subpaths;
8. enforces raw and gzip JavaScript budgets;
9. limits each root/direct bundle pair to a 1 KiB raw and 512 byte gzip difference;
10. checks retained and forbidden component markers to catch tree-shaking regressions.

Fixtures and budgets live in `tests/consumer-fixtures`. A budget increase must be supported by an
intentional feature or dependency change and reviewed alongside the before/after measured sizes.
Do not raise a limit merely to make CI pass.

Run the complete package-facing gate with:

```bash
npm run build:kern
npm run verify:entrypoint-boundaries
npm run verify:source-pollution
npm run verify:entrypoint-identity
npm run verify:api
npm run verify:api-baseline
npm run verify:testing-entrypoint
npm run verify:consumers
npm run package:dry-run
```

The aggregate `npm run verify` command includes all of these checks.
