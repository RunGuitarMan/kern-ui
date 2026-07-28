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
- A manual, non-publishing release-candidate workflow.
- Cross-cutting `provideKrn` configuration for locale, direction, theme, density, motion,
  preference persistence, overlay host, platform adaptation, and typed translation overrides.
- Shared SSR-safe platform, deterministic-ID, overlay-coordination, and typed-content primitives.
- Physical `/cdk`, `/core`, `/kit`, `/addon-grid`, `/addon-charts`, and `/patterns` runtime
  entrypoints with a compatibility-only package root and strict mixed-import identity gates.
- The isolated `@kern-ui/angular/testing` secondary entry point with harnesses for buttons, forms,
  select, dialogs, and data grid.
- Typed shared-copy contracts across component families plus locale-aware search and generated
  value labels.
- Generated component input/model/output metadata and curated lifecycle status for all catalog
  entries.
- Chromium, Firefox, and WebKit hydration, keyboard/focus, semantics, and axe smoke coverage.

### Changed

- Consolidated repeated action and form structure into the required global `styles/kern.css`
  composition, reducing duplicated runtime CSS.
- Strengthened form-field projection, typed selection controls, date/calendar keyboard behavior,
  and Angular Forms contracts.
- Strengthened data-grid identity, typed rendering, responsive column access, virtual focus, and
  column-management contracts, including nested-control action mode and measured virtual rows.
- Unified overlay stacking, inert background handling, scroll locking, focus restoration, and
  toast interaction timing.
- Made AppShell navigation modal and keyboard-operable at mobile breakpoints, and aligned
  Popover/Hover Card semantics with disclosure and non-modal preview behavior.
- Removed duplicate state-change outputs where signal models already provide the canonical event.

### Deprecated

### Removed

### Fixed

- Tree and tree-navigation semantics now expose state on the focusable tree item.
- Tree rejects empty or duplicate node identifiers before rendering an ambiguous hierarchy.
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
