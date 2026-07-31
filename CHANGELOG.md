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
- Strengthened App Shell with canonical responsive drawer state, composed dialog naming and
  descriptions, configurable initial focus, explicit dialog trigger semantics, and public
  navigation and main-focus methods.
- Strengthened Header with native landmark naming, stable logical grid areas, configurable sticky
  offset, restored hidden semantics, and sticky App Shell projection without an extra layout box.
- Strengthened Sidebar with composed landmark naming, native hidden/inert collapse semantics,
  semantic header/footer projection, automatic App Shell side alignment, and explicit
  expand/collapse methods.
- Removed duplicate state-change outputs where signal models already provide the canonical event.
- Rebuilt Form Field as a control-owned label/description coordinator: registered controls now
  supply identity and Angular state, full control events drive pending/valid/disabled presentation,
  projected labels replace shorthand labels without duplication, every primary control is named by
  the mounted visible field label, self-labelled controls compose both visible names, and composite
  controls delegate label focus. Deterministic live DOM-first ownership prevents duplicate ids,
  pristine Angular errors stay visually neutral until interaction, and `aria-describedby`
  deduplicates manual ids with mounted hints and errors. The public Form Field harness now resolves
  registered primary roots and exposes readonly and pending predicates.
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
- Strengthened Number Input with deterministic standalone `value` ownership, non-destructive range
  validation, finite native constraints, precise bounded stepping, composable ARIA references,
  focus-retaining single-tab-stop steppers, and public native focus and blur methods.
- Strengthened Checkbox with deterministic standalone `checked` ownership, nullable
  Angular-Forms-owned mixed state, user-cleared indeterminate state, composable visible/external
  names and descriptions, native-only tab order, and public native focus and blur methods.
- Strengthened Checkbox Group with deterministic standalone `value` ownership, unique
  duplicate-free values and outputs, composable group names and descriptions, blur-driven touched
  state, and public focus delegation to the first available native checkbox.
- Strengthened Radio with deterministic standalone `checked` ownership, native name-based
  exclusivity, readonly-safe group selection, composable visible/external names and descriptions,
  native-only tab order, blur-driven group touched state, and public native focus and blur methods.
- Strengthened Radio Group with deterministic standalone `value` ownership, Angular Forms
  precedence, duplicate-free selection outputs, composable legend/external/Form Field naming,
  merged descriptions, and selected-first native focus delegation.
- Strengthened Switch with deterministic standalone `checked` ownership, duplicate-free accepted
  changes, readonly-safe native interaction, composable visible/external names and descriptions,
  native-only tab order, and public native focus and blur methods.
- Strengthened Select with deterministic standalone `value` ownership, identity-based
  duplicate-free changes, canonical enabled-option commits, non-interactive popup invariants,
  composable external/Form Field ARIA references, configurable tab order, and public trigger
  focus.
- Strengthened Native Select with deterministic standalone `value` ownership, identity-based
  duplicate-free changes, canonical enabled-option commits, readonly-safe native interaction,
  composable external/Form Field ARIA references, native-only tab order, and public focus and blur
  methods.
- Strengthened Multi Select with deterministic standalone array ownership, identity-based
  duplicate-free canonical option commits, preserved disabled selections, non-interactive popup
  invariants, bounded token summaries, composable external/Form Field ARIA references, native-only
  tab order, and public trigger focus.
- Strengthened Combobox with deterministic standalone `value` ownership, duplicate-free
  enabled-option commits, disabled exact-match protection, non-interactive popup invariants,
  form-safe Enter handling, composable external/Form Field ARIA references, native input naming
  and tab order, and public focus, blur, and selection methods.
- Made Autocomplete modes behavioral rather than decorative, with popup-free inline/none modes,
  stable ARIA autocomplete semantics, effective-filter inline completion, preserved free-text
  editing, and duplicate-free custom-value commits.
- Strengthened Slider with deterministic standalone `value` ownership, finite native constraints,
  bounded progress, duplicate-free accepted changes, readonly-safe interaction, native form
  naming and tab order, and public focus and blur methods.
- Strengthened Range Slider with deterministic standalone range ownership, finite constraints,
  precise decimal pointer snapping, structural change deduplication, composite focus/touched
  semantics, formatted accessible values, readonly-safe interaction, and public focus and blur
  methods.
- Strengthened Segmented Control with deterministic standalone `value` ownership, identity-based
  duplicate-free changes, composable group semantics, labelled custom content, horizontal and
  vertical orientation, focus-based disabled-skipping keyboard navigation, composite touched
  state, configurable tab order, and public focus and blur methods.
- Strengthened Date Picker with deterministic standalone `value` ownership, controlled open state,
  duplicate-free date commits, composable trigger semantics, shortcut-safe calendar navigation,
  composite focus/touched behavior, configurable tab order, and public focus and blur methods.
- Strengthened Date Range Picker with normalized standalone range ownership, controlled open state,
  structural change deduplication, composable trigger semantics, shortcut-safe calendar navigation,
  composite focus/touched behavior, configurable tab order, and public focus and blur methods.
- Strengthened Time Picker with canonical `HH:mm` standalone value ownership, controlled open
  state, duplicate-free commits, min-anchored step validation, composable external/Form Field ARIA
  references, composite focus/touched behavior, configurable tab order, and public focus and blur
  methods.
- Strengthened Color Picker with canonical six-digit hexadecimal standalone value ownership,
  controlled open state, duplicate-free commits, complete HSL editing, perceptual preview
  contrast, composable external/Form Field ARIA references, composite focus/touched behavior,
  configurable tab order, public focus and blur methods, and lightness-aware translations and
  testing harness controls.
- Strengthened File Upload with deterministic standalone file-list ownership, metadata-based
  duplicate suppression, duplicate-free accepted-file outputs, a single visible focus target,
  readonly-safe interaction, composable external/Form Field/local and localized required
  descriptions, configurable tab order, public focus and blur methods, and state-aware testing
  harness filters.
- Strengthened Drag and Drop Upload with deterministic standalone file-list ownership,
  duplicate-free accepted drops, blocked-state drag reset, explicit rejected drop effects, a
  single visible focus target, readonly-safe interaction, composed drop/local/Form Field
  descriptions, configurable tab order, public focus and blur methods, and state-aware testing
  harness filters.
- Strengthened Verification Code with a single autofill-friendly native input, visual pin slots,
  deterministic standalone string ownership, duplicate-free user emissions, composed external and
  Form Field semantics, configurable autocomplete and tab order, public focus and blur methods, and
  testing harness support for both documented selectors.
- Strengthened Tags Input with deterministic standalone array ownership, atomic separator-based
  batch commits, bounded duplicate handling, IME-safe keyboard behavior, composite focus/touched
  semantics, composed external and Form Field ARIA references, configurable autocomplete and tab
  order, focus recovery after removal, and public focus and blur methods.

### Deprecated

- `KrnDataGrid.pagination`; use the discriminated client `mode` with `pagination: true`.
- `KrnDataGrid.virtualize`; use `{ kind: 'virtual' }` through the `mode` input.
- `KrnMenu.hasProjectedTrigger`; apply `KrnMenuTrigger` to the projected trigger instead.

### Removed

- Removed the pre-1.0 Form Field control-state proxies (`id`, `required`, `disabled`, `readonly`,
  and `state`). Keep those semantics on the projected control or its Angular `FormControl`; use
  the `form-field-control-owned-state` migration recipe.
- Removed the pre-1.0 `KrnSwitch.valueChange` output; use `(checkedChange)` or `[(checked)]`
  through the `switch-checked-output` migration recipe.

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
