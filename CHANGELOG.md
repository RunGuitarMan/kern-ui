# Changelog

All notable consumer-visible changes to Kern are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and released
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Internal refactors,
test-only work, and documentation corrections need entries only when they change a consumer
contract or upgrade decision.

## [Unreleased]

### Added

- Open-source contribution, support, security, conduct, versioning, and browser-support policies.
- Pull request and issue templates plus automated quality, browser, dependency, and CodeQL
  workflows.
- A protected release workflow that binds package, tag, documentation state, dated changelog,
  artifacts, and checksums into one immutable candidate, pauses for maintainer approval, and
  publishes the exact verified tarball through npm trusted publishing.
- Cross-cutting `provideKrn` configuration for locale, direction, theme, density, motion,
  preference persistence, overlay host, platform adaptation, and typed translation overrides.
- Shared SSR-safe platform, deterministic-ID, overlay-coordination, and typed-content primitives.
- Physical `/cdk`, `/core`, `/kit`, `/addon-grid`, `/addon-charts`, and `/patterns` runtime
  entrypoints with a compatibility-only package root and strict mixed-import identity gates.
- The isolated `@kern-ui/angular/testing` secondary entry point with harnesses for buttons, forms,
  selection controls, date/time controls, navigation, feedback, uploads, dialogs, and data grid.
- Typed shared-copy contracts across component families plus locale-aware search and generated
  value labels.
- Complete English and Russian locale packs with schema-parity verification.
- Generated component input/model/output metadata and curated lifecycle status for all catalog
  entries.
- A package-distributed component manifest, per-component agent guidance, `llms.txt`, runnable
  recipes, and a packed read-only `kern-mcp` executable.
- Typed form, data-grid, CRUD/master-detail, doctor, install, and versioned migration schematics.
- A cancellable, latest-request-wins server data-source adapter for controlled Data Grid use.
- Runtime performance budgets for large Grid, Tree, Select, Chart, 200-field Forms, frame latency,
  and retained overlay heap.
- Chromium, Firefox, and WebKit hydration, keyboard/focus, semantics, and axe smoke coverage.

### Changed

- Migrated contributor orchestration from the Angular CLI workspace to Nx while preserving the
  published package entrypoints and consumer setup; consolidated component exploration in Docs
  and removed the legacy Lab application.
- Rebuilt Docs previews around a shareable component workbench with complete theme, contrast,
  density, direction, locale, motion, brand, canvas, state, preset, and public-API controls.
- Consolidated repeated action and form structure into the required global `styles/kern.css`
  composition, reducing duplicated runtime CSS.
- Strengthened form-field projection, typed selection controls, date/calendar keyboard behavior,
  and Angular Forms contracts.
- Strengthened data-grid identity, typed rendering, responsive column access, virtual focus, and
  column-management contracts, including nested-control action mode, density-measured fixed-height
  virtual rows, logical start/end pinning, and a cancellable controlled data source.
- Added explicit async loading/error states and server-query control to selection components, plus
  retryable lazy-child state for Tree and Tree Navigation.
- Strengthened Charts with stable datum identity, finite-value validation, negative-value policy,
  explicit empty state, and bounded accessible summaries.
- Unified overlay stacking, inert background handling, scroll locking, focus restoration, and
  toast interaction timing.
- Made AppShell navigation modal and keyboard-operable at mobile breakpoints, and aligned
  Popover/Hover Card semantics with disclosure and non-modal preview behavior.
- Removed duplicate state-change outputs where signal models already provide the canonical event.
- Strengthened Text Input with deterministic standalone `value` ownership, IME-safe and
  duplicate-free updates, composable ARIA references, validated length constraints, and public
  native focus, blur, and selection methods.
- Strengthened Textarea with deterministic standalone `value` ownership, IME-safe updates,
  non-destructive length validation, reactive auto-resizing, composable ARIA references, and
  public native focus, blur, and selection methods.
- Strengthened Password Input with deterministic standalone `value` ownership, IME-safe updates,
  non-destructive length validation, composable ARIA references, password-safe native defaults,
  focus-retaining visibility controls, and public native focus, blur, and selection methods.
- Strengthened Search Input with deterministic standalone `value` ownership, IME-safe submission,
  non-destructive length validation, composable ARIA references, a focus-retaining single-tab-stop
  cleaner, and public native focus, blur, and selection methods. Clearing no longer emits
  `searchSubmitted`; that output now exclusively represents an explicit Enter submission.

### Deprecated

- `KrnDataGrid.pagination`; use the discriminated client `mode` with `pagination: true`.
- `KrnDataGrid.virtualize`; use `{ kind: 'virtual' }` through the `mode` input.
- `KrnMenu.hasProjectedTrigger`; apply `KrnMenuTrigger` to the projected trigger instead.

### Removed

### Fixed

- Restored source-compatible string templates for Pagination, Command Palette, Charts, and
  `KrnTranslations`; optional typed formatters now add plural-aware semantics without recursively
  evaluating legacy translation tokens.
- Russian truncated-chart summaries now use the correct singular, paucal, and plural forms.
- Tree and tree-navigation semantics now expose state on the focusable tree item.
- Tree rejects empty or duplicate node identifiers before rendering an ambiguous hierarchy.
- Constrained Combobox resolves a committed value to a late asynchronous option label without
  replacing an in-progress remote query.
- Calendar normalizes out-of-range views, skips fully blocked months without losing its roving
  focus target, restores focus after outside-month selection, and disables its “Today” action
  when the configured date is invalid, out of range, or explicitly blocked.
- Angular validator state is reflected by form controls and FormField during SSR and first render;
  generic required controls accept `false`, while checkbox and switch retain required-true
  semantics.
- Native Select round-trips collision-prone primitive, object, empty-string, and placeholder values
  without string coercion, and serializes its null/selected state correctly before hydration.
- Data Grid keeps repeated object and primitive occurrences distinct, rejects duplicate row keys,
  gives virtual mode resize parity, and rejects unsupported virtual row expansion.
- Virtual Grid preserves logical pinned columns after its row layout rules are applied, including
  in RTL; public Grid and Tree harnesses exclude utility/decorative content and expose async tree
  state predicates.
- Grid headers, selection controls, resize handles, and projected actions participate in one
  managed grid focus model instead of adding uncontrolled page tab stops; action mode is cleared
  when focus leaves the grid.
- Configured Angular CDK overlay hosts are honored, and handled Escape events close only the
  top-most Kern surface. Registered origin ownership keeps nested popups interactive while
  isolating both pre-existing and late programmatic background overlays.
- Escape closes an open form popup before it can close a containing dialog or application shell.
- RTL navigation, locale-aware formatting, shared labels, and deterministic “today” behavior are
  covered by explicit contracts.
- Explicit `motion: "full"` now overrides an operating-system reduced-motion preference without
  weakening the default reduced-motion behavior.

### Security
