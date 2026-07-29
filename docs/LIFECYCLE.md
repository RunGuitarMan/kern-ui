# Lifecycle governance

`projects/kern/api/lifecycle.json` is the machine-readable source of truth for component and public
symbol maturity. It explicitly covers all 131 catalog entries and all 382 named exports from the
committed secondary-entrypoint API baselines. There is no implicit “new exports are stable”
default.

The registry groups entries only to keep the file reviewable. Flattening `catalogGroups` and
`symbolGroups` yields one record per catalog ID and per `entrypoint:symbol` pair. Each group has an
owner and status; non-stable symbol groups also require a rationale. Catalog groups select an
evidence profile:

| Profile                   | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `stable-release`          | Minimum evidence for a SemVer-protected component               |
| `beta-promotion`          | SSR, hydration, AT, visual, performance, and harness exit gates |
| `experimental-incubation` | Named owner, limitations, and explicit exit criteria            |
| `recipe-validation`       | Composition, responsive behavior, a11y, and adaptation guidance |

Profiles are requirements, not inferred claims. A registry entry does not claim that an evidence
item has passed; durable test or manual evidence must exist separately.

## Verification

Run:

```bash
node tools/verify-kern-lifecycle.mjs
```

The verifier fails when:

- a catalog ID, category, or status differs from the registry;
- a public export is absent, duplicated, or registered under the wrong entrypoint;
- a catalog component class is more or less stable than its catalog entry;
- a source declaration tagged `@experimental` is registered as stable or beta;
- an `@deprecated` API member is missing from the deprecation registry;
- a deprecation lacks a replacement, migration, documentation anchor, or future removal version.

API baseline changes and lifecycle changes should be reviewed together. Adding a symbol requires
an intentional maturity decision; promoting a component requires the evidence profile, changelog
context, and compatibility review.

## Current pre-1.0 promotion queue

The 19 beta catalog entries are deliberate groups, not an unreviewed backlog:

- Select/Combobox/Autocomplete/Multi Select and date/time controls require their controlled,
  async, Forms, locale, SSR, and public-harness contracts plus real AT evidence to remain stable;
- Dialog/Drawer/Bottom Sheet require nested-overlay, focus restoration, mobile viewport, and
  VoiceOver/NVDA/JAWS evidence;
- Tree/Tree Navigation require stable node identity, lazy-child state, route/state ownership, and
  screen-reader evidence;
- Grid/Data Table require controlled/virtual modes, pinning, large-data performance, and the
  documented limits of grouping and two-dimensional virtualization;
- Charts require stable datum identity, validation, bounded summaries, source-data fallback, and
  manual non-visual review;
- Command Palette requires async result-state, focus, command ownership, and AT evidence.

`Resizable Panels` remains the single experimental entry. Promotion requires a reviewed nested
layout/constraint model, persistence contract, pointer and keyboard parity, RTL, responsive
collapse behavior, SSR/hydration evidence, and public harness coverage. Until those gates exist,
keeping the API experimental is safer than presenting uncertainty as stability.

## Deprecations

`projects/kern/api/deprecations.json` is authoritative for active and removed deprecations.
[DEPRECATIONS.md](DEPRECATIONS.md) contains consumer migration examples. During the unreleased
`0.1.0` phase, removing accidental compatibility APIs is preferable to shipping deprecation debt.
After publication, do not shorten a registered removal window without an urgent security or
correctness reason documented in release notes.
