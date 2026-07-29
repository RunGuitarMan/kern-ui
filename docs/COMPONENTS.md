# Component and state coverage

The typed catalog in `projects/showcase/src/lib/catalog.ts` is the documentation manifest. It
contains 131 entries; every entry has a route, exact generated input/model/output metadata,
keyboard and accessibility notes, do/don't guidance, and a declared state matrix. The
machine-readable lifecycle source of truth is `projects/kern/api/lifecycle.json`; CI requires the
catalog to match it exactly.

| Category     | Entries | Representative capabilities                                   |
| ------------ | ------: | ------------------------------------------------------------- |
| Layout       |      17 | App shell, responsive primitives, scrolling, resizable panels |
| Actions      |      10 | Buttons, groups, split/dropdown actions, toggles, copy        |
| Forms        |      30 | Typed text/choice controls, selection, dates, uploads, OTP    |
| Navigation   |      14 | Tabs, menus, pagination, stepper, tree, command palette       |
| Feedback     |      19 | Alerts, toast, overlays, progress, skeleton, state patterns   |
| Data display |      26 | Dense data, grid/table, calendar, charts, media               |
| Patterns     |      15 | Search, settings, CRUD, master-detail, forms, app shells      |
| **Total**    | **131** |                                                               |

The generated API contract in
`projects/showcase/src/lib/generated-component-contract.ts` is derived from runtime source and
checked against every catalog selector. Do not edit it by hand. Summary, behavior, status, and
usage guidance remain deliberate human-authored documentation.

The Code tab does not use handwritten snippets. It reads the generated showcase registry built
from `metadata/agent/examples`: one explicit standalone application for every catalog entry.
Those same sources are mirrored into the npm package, installed into an isolated consumer, and
strict-AOT compiled against the packed artifact. The shared specimen secondary entrypoint powers
both Docs and Lab, and its coverage gate requires a focused render branch for all 131 entries.

## Lifecycle manifest

Lifecycle status communicates compatibility and ownership, not visual completeness:

| Status         | Current entries | Meaning                                                         |
| -------------- | --------------: | --------------------------------------------------------------- |
| `stable`       |              96 | Supported contract; compatibility policy applies                |
| `beta`         |              19 | Production evaluation is welcome; contract may still be refined |
| `experimental` |               1 | Early API; incompatible pre-1.0 changes may occur               |
| `recipe`       |              15 | Opinionated composition to adapt, not a sealed primitive        |
| `deprecated`   |               0 | Supported temporarily with a documented replacement             |

Statuses are curated rather than inferred from test counts. The lifecycle registry also covers
every named public export and blocks an unregistered symbol from silently defaulting to stable. A
status change is a consumer-visible decision and requires review, evidence, changelog context, and
migration guidance when it reduces stability. See [LIFECYCLE.md](LIFECYCLE.md) and
[VERSIONING.md](VERSIONING.md).

## Visual matrix

Interactive catalog entries declare default, hover, focus-visible, active, disabled, loading,
selected, invalid, readonly, overflow, long-text, dark, high-contrast, compact-density, RTL, and
mobile acceptance states. Non-interactive entries omit interaction states that do not apply and
retain the shared environment and content requirements.

The manifest is a review checklist; it does not mean that every state of every entry has a
dedicated screenshot or manual assistive-technology certificate.

## Verification levels

Repository evidence is intentionally split by purpose:

1. catalog tests require unique IDs/selectors, runtime API coverage, statuses, and state metadata;
2. unit tests cover component contracts, forms, keyboard behavior, overlays, tokens, and harnesses;
3. the Chromium E2E suite renders every catalog route and exercises representative workflows;
4. responsive tests cover narrow layout, RTL, and 200% text sizing on representative surfaces;
5. Chromium, Firefox, and WebKit run focused hydration, semantics, keyboard/focus, and axe smoke;
6. deterministic Chromium screenshots cover selected high-value Lab scenarios.

Automated evidence is release-blocking where configured, but it complements rather than replaces
manual review in the consuming application's browser, operating-system, assistive-technology,
locale, and policy matrix. See [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md).

The repository manual matrix is intentionally pending and explicitly not certified. See
[accessibility evidence](accessibility/README.md).

## Maintainer rule

A new entry is incomplete until its runtime selector and API are generated, lifecycle status is
assigned, behavior guidance is specific to the pattern, a deterministic specimen exists, and
relevant unit/browser coverage is added. Copying the generic catalog notes is not sufficient for
a complex widget.
