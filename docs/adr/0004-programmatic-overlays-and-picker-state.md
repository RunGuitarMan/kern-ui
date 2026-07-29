# ADR 0004: Programmatic overlays and picker state

- Status: Proposed; not part of the current beta contract
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

## Decision required

Before implementation, accept a typed reference model such as
`KrnOverlayRef<Result, DismissReason>`, define its single-close semantics, and decide whether
programmatic content is a Kit service or a lower-level CDK primitive. Picker state should reuse
that ownership model rather than invent a separate popup lifecycle.

## Acceptance gates

- nested and concurrent overlay tests;
- SSR/hydration behavior for open and closed initial state;
- navigation and destroy cancellation;
- real VoiceOver, NVDA, and JAWS focus/announcement evidence;
- mobile viewport, scroll lock, reduced motion, and animation-disposal tests;
- public harness and migration guidance.

Until this decision is accepted, the declarative APIs remain the supported contract. KERN does
not publish a superficially typed service that can leak views, complete twice, or restore focus to
the wrong application.
