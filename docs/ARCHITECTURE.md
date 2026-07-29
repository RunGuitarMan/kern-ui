# Kern architecture

## Dependency layers

Runtime code follows one physical package graph. CI rejects undeclared edges, cross-owner relative
imports, cycles, duplicate owners, and root imports from secondary entrypoints.

```text
cdk ─→ core ─→ kit ─→ patterns
  └────┴────→ addon-grid
       └────→ addon-charts

root ─→ compatibility re-export of every runtime entrypoint
styles ─→ every rendered component
```

| Entrypoint     | Responsibility                                                      |
| -------------- | ------------------------------------------------------------------- |
| `cdk`          | Platform boundary, stable IDs, content, and overlay coordination    |
| `core`         | Foundations, tokens, icons, theme, configuration, and translations  |
| `kit`          | General layout, action, form, navigation, feedback, and display UI  |
| `addon-grid`   | Virtualized enterprise data grid                                    |
| `addon-charts` | Accessible data visualizations                                      |
| `patterns`     | Opinionated product compositions; depends on Kit, never the reverse |
| `testing`      | Runtime-free Angular CDK harnesses                                  |

Components have safe root-provided defaults; `provideKrn` is not mandatory. Applications use it
when they own locale, direction, density, motion preference, theme, shared UI-copy translations,
overlay host, or a replaceable platform adapter. Scoped injectors may override individual tokens
for embedded applications. `provideKrnTheme` is the narrower provider when only theme, density,
brand, and preference persistence are needed.

## Boundaries

- `kern` is the only publishable package. `/cdk`, `/core`, `/kit`, `/addon-grid`,
  `/addon-charts`, `/patterns`, and `/testing` are its supported physical entrypoints.
- The package root is a compatibility-only aggregator. It declares no runtime implementation and
  preserves strict object identity with every direct entrypoint.
- `@kern-ui/angular/testing` contains CDK harnesses but no Kern runtime imports, services, or
  injection tokens.
- `showcase` is private metadata. Documentation pages and Lab scenarios can evolve without
  expanding the public package.
- `docs` consumes the built public package, uses SSR plus hydration, and lazy-loads its page
  families.
- `lab` consumes the same public package and exposes stable query-driven specimens for browser
  automation.
- `metadata/agent` is a compiler-derived, closed 131-component contract. Its examples are mirrored
  into the package, strict-AOT compiled against the tarball, exposed through the read-only MCP
  adapter, and used by the Docs Code tab.

Each runtime source file has one owner recorded in `projects/kern/api/runtime-entrypoints.json`.
Cross-entrypoint imports use only published package subpaths. The root compatibility entrypoint is
retained for at least one major line, while new consumers should import from the narrow owner.

CSS layers already have declared side-effect subpath exports. Applications must normally import
`styles/kern.css`; tooling and controlled integrations may import tokens, themes, density,
preferences, base, or utilities separately. A partial CSS import is not a supported complete
component setup.

## State and rendering

Components use `OnPush`, signal inputs/outputs/models, computed state, and effects for controlled
state or DOM synchronization. Form controls use ControlValueAccessor or typed reactive forms. The
Angular 22 workspace runs without a `zone.js` dependency, and the library does not require one.

Reusable low-level services reach platform APIs through `KRN_PLATFORM`. The replaceable adapter
exposes the owning document, time scheduling, storage, animation frames, and safely nullable
browser capabilities. Component-local DOM behavior may use Angular's injected `DOCUMENT` or an
element's owning document. Direct ambient browser-global access is not an accepted runtime
dependency. Theme and runtime configuration use attributes supported by Angular's server DOM.

`KrnIdService` is the shared ID primitive. Sequential IDs are deterministic when the server and
client instantiate the same view tree in the same order. Data-driven widgets should use
`fromKey` with a stable application key to avoid order dependence.

The documentation application is built in Angular SSR mode with client hydration. That is
repository integration evidence, not a guarantee for an arbitrary consumer route: applications
must verify their own overlay host, locale registration, deferred content, CSP, and custom
platform adapter.

Release builds bind that application to the immutable `/versions/<semver>/` mount, package the
complete browser and server output deterministically, and record every file hash. The Express
entry point accepts the same mount through `KERN_DOCS_BASE_PATH`; hosting remains an external
deployment choice. See [VERSIONED_DOCUMENTATION.md](VERSIONED_DOCUMENTATION.md).

`provideKrn` supplies the package-wide Angular CDK `OverlayContainer`. Its host resolver is
evaluated on access, falls back to `document.body`, and preserves a single container when a late
host appears. Each Kern CDK overlay registers its origin and pane/backdrop branches with the
overlay coordinator. The coordinator follows that ownership chain, so only overlays originating
inside the top modal remain interactive; both pre-existing and late programmatic background panes
are isolated. It consumes handled Escape events at the top layer and restores pre-existing
`inert`, `aria-hidden`, scroll, and focus state exactly.

## Styling and theming

`src/styles/kern.css` composes tokens, themes, density, preferences, base rules, utilities, CDK
overlay rules, and shared structural styles for action and form controls. It must be loaded once
globally for the supported component presentation. Public CSS custom properties are semantic:
consumers override intent rather than internal component selectors. Source palettes are
expressed with safe fallbacks and OKLCH enhancements. Runtime brand palettes are generated from a
validated hexadecimal color.

`KRN_TOKEN_NAMES` is the public typed contract. `KRN_TOKEN_MANIFEST` adds tier, visibility, and
typed access paths for both public and internal variables. `npm run verify:tokens` requires
exact parity between this registry and declarations in the shipped token/theme/density sheets.

After a production package build, `npm run verify:api` inspects the rolled-up declaration file
and rejects public inheritance or member signatures that depend on non-exported local types.
`npm run verify:api-baseline` additionally compares every typed package entrypoint with a
committed declaration baseline. `npm run verify:consumers` installs the packed artifact and
enforces isolated Button, Form, Select, Grid, and Charts production-bundle budgets plus
tree-shaking markers. See [Consumer quality gates](CONSUMER_QUALITY_GATES.md).

Logical properties, container queries, forced-colors rules, reduced-motion rules, minimum touch
targets, and visible focus rings are shared foundations. Most component-specific styles remain
scoped by Angular. Repeated action and form structure lives in prefixed global selectors to avoid
duplicating the same CSS in every component definition; the selector surface is internal even
though the stylesheet is required.

Theme modes are `light`, `dark`, `system`, and `high-contrast`; density modes are `compact`,
`comfortable`, and `spacious`. Motion uses semantic duration tokens and the `system`, `reduce`,
or `full` preference. Locale defaults to Angular's `LOCALE_ID`, while direction defaults to the
document `dir`. `KRN_TRANSLATIONS` supplies typed English component UI-copy defaults; complete
schema-checked English and Russian packs can be adapted through `krnLocaleConfig`.
`provideKrn({ translations })` accepts a typed partial override, and component label inputs remain
available for one-off copy. Existing token templates such as `Page {page}` remain source-compatible;
new locale packs can add the corresponding optional typed formatter for grammar that cannot be
expressed by a template. Runtime interpolation is single-pass and resolves only named tokens.
Kern does not bundle application content.

## Accessibility contract

The target is WCAG 2.2 AA. Native semantics are preferred. Composite widgets use the keyboard
model appropriate to their ARIA pattern, including roving focus where required. Dialog-like
overlays coordinate stacking, background inertness, scroll locking, focus trapping/restoration,
and Escape handling. Status changes use visible text and live regions where announcement is
useful.

Catalog keyboard notes and state matrices are acceptance requirements. They are not, by
themselves, test results or manual assistive-technology certification. Release evidence combines
unit tests, all-route rendering, representative keyboard and axe scenarios, responsive/zoom
checks, and a focused cross-engine matrix. See [COMPONENTS.md](COMPONENTS.md) and
[BROWSER_SUPPORT.md](BROWSER_SUPPORT.md) for the exact scope.

## Extending Kern

1. Add the smallest semantic primitive to the owning physical entrypoint under
   `projects/kern/<entrypoint>/src/lib/<family>`.
2. Use shared semantic tokens; do not hard-code a parallel palette or spacing scale.
3. Use a typed union for mutually exclusive variants instead of boolean combinations.
4. Add behavioral unit tests, including keyboard/forms/overlay behavior where applicable.
5. Export through the family barrel and `public-api.ts`.
6. Assign a lifecycle status, add one catalog record, and add a deterministic Lab specimen.
7. Add or update a public CDK harness when consumers would otherwise depend on internal markup.
8. Run static checks, production package build, browser accessibility, responsive, and visual
   projects.

## Current trade-offs

- Shared action and form CSS has moved out of repeated component metadata into the required
  global sheet. Consumers cannot omit `styles/kern.css`.
- The root compatibility API intentionally exposes the complete surface; direct runtime
  entrypoints are the preferred bundle and ownership boundary.
- Charts are accessible, dependency-free SVG primitives with stable datum identity, validation,
  bounded summaries, explicit negative-value policy, and a source-data table; they are not yet a
  full analytical charting grammar.
- Data-grid virtualization is optional and aimed at measurable fixed-height row sets. It supports
  selection, sorting, filtering, managed cell actions, column resizing, logical column pinning,
  and a cancellable controlled/server data-source adapter, but rejects expandable detail rows.
  Grouping, variable-height virtualization, and two-dimensional column virtualization require
  the reviewed row/column identity, ARIA, focus, and scroll-strategy decision in
  [ADR 0003](adr/0003-data-grid-grouping-and-two-dimensional-virtualization.md).
- Locale-aware components accept locale, complete English/Russian packs, typed shared-copy
  overrides, and label configuration. Product teams own other language dictionaries and all
  product-specific visible and accessible copy.
- Programmatic overlay results and externally controlled picker popup state remain outside the
  beta contract until the focus, provider, SSR, disposal, and result model in
  [ADR 0004](adr/0004-programmatic-overlays-and-picker-state.md) is accepted.

The staged pre-split decision is recorded in historical
[ADR 0001](adr/0001-runtime-boundaries.md). The implemented physical ownership model is recorded
in [ADR 0002](adr/0002-runtime-entrypoint-feasibility.md).
