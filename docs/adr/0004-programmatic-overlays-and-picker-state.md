# ADR 0004: Programmatic overlays and picker state

- Status: Accepted for programmatic modal overlays; picker state deferred
- Owner: `kern/feedback` and `kern/forms`

## Context

KERN currently exposes controlled declarative dialogs, drawers, sheets, selects, and date/time
pickers. They already share modal ownership, focus trapping/restoration, Escape ordering, SSR-safe
platform access, typed close reasons, Forms integration, and public harnesses.

A small `open(component)` helper would not be an enterprise programmatic overlay contract. It must
also define:

- typed input data, result, dismissal reason, and cancellation;
- TemplateRef and component content with an explicit injection context;
- one completion path under action, Escape, outside click, navigation, destroy, and parent close;
- focus origin, initial focus, restoration target, and nested-overlay ownership;
- portal/view-container ownership and provider scope;
- SSR behavior and hydration of an initially open surface;
- animation completion before disposal;
- harness access that does not expose CDK pane internals.

Likewise, adding a picker `open` input alone would duplicate the internal combobox/calendar state
machine unless keyboard commit/cancel, focus restoration, validation, and Forms touched state are
specified together.

## Decision

Programmatic content is owned by the Kit-level `KrnOverlayService`; CDK retains only platform,
stacking, background, and focus coordination. `KrnOverlayRef<Result, DismissReason>` settles once
after exit and disposal, supports component and `TemplateRef` content with scoped injection, and
dismisses owned descendants before their parent. Navigation, service destruction, parent close,
outside interaction, platform close request, and SSR are explicit typed outcomes.

On the server, `open()` creates no DOM or view and returns a replay-settled `ssr` dismissal. An
initially visible server-rendered surface must use the declarative component API. Externally
controlled picker state is deferred until its keyboard commit/cancel, validation, focus, and Forms
transitions can reuse this ownership model.

## Acceptance gates

- nested ownership and close-once tests;
- deterministic SSR dismissal and declarative hydration coverage;
- navigation, parent, and destroy cancellation;
- mobile viewport, scroll lock, reduced motion, and animation-disposal tests;
- semantic-host public harness coverage;
- real VoiceOver, NVDA, and JAWS focus/announcement evidence tracked separately from automated
  correctness gates.

The accepted contract deliberately excludes async close guards, arbitrary positioning and scroll
strategies, non-modal imperative surfaces, and custom animation durations until concrete product
requirements justify those extensions.
