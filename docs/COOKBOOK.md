# Enterprise cookbook

This cookbook covers the decisions that are easy to get wrong when a team adopts KERN without
prior library knowledge. The generated component manifest remains authoritative for individual
inputs and outputs; these recipes explain how components should be composed in production. The
machine-readable contract includes complete standalone sources for all 13 recipes. CI installs
those sources from the packed npm artifact and strict-AOT compiles them together with all 131
per-component examples.

## Install and diagnose

Prefer the idempotent installer, then keep the doctor in CI:

```bash
ng add @kern-ui/angular --project my-app
ng generate @kern-ui/angular:doctor --project my-app --strict --json
```

KERN components have safe defaults. Add `provideKrn` only when the application owns shared theme,
locale, direction, motion, translations, or overlay-host configuration. Load
`@kern-ui/angular/styles/kern.css` exactly once.

## Choose a selection control

| Requirement                                     | Component     |
| ----------------------------------------------- | ------------- |
| One value from a small, known set               | Native Select |
| One value from a known custom-rendered set      | Select        |
| Several values from a bounded known set         | Multi Select  |
| Search, but only known options may be committed | Combobox      |
| Suggestions with valid unmatched free text      | Autocomplete  |
| User-authored multiple values                   | Tags Input    |

Use immutable domain values and a stable identity function for object options. Do not use display
labels as identifiers, and do not silently switch from a bounded select to free text. For remote
Combobox/Autocomplete results, set `filterLocally` to `false`, handle `queryChange`, and drive
`optionsState` through `ready`, `loading`, or `error`. Select and Multi Select accept the same
explicit result state when their option source loads asynchronously.

## Build a typed form

Generate the initial strict structure:

```bash
ng generate @kern-ui/angular:typed-form profile --project my-app
```

Keep the Angular `FormControl<T>` as the source of truth. Put the visible label, hint, and exact
validation message in Form Field; use the component CVA instead of mirroring values through
additional `(change)` handlers. Form-level submission errors belong in an Alert, not in an
unrelated field.

## Load server-owned Grid data

Use controlled mode together with `KrnDataGridDataSource<T>`. The adapter cancels superseded
requests, prevents stale responses from winning, exposes loading/error signals, and does not
dictate the transport:

```ts
import {
  KrnDataGridDataSource,
  type KrnDataGridQuery,
} from '@kern-ui/angular/addon-grid';

interface Account {
  readonly id: string;
  readonly name: string;
}

readonly source = new KrnDataGridDataSource<Account>(async (query, { signal }) => {
  const response = await fetch(`/api/accounts?query=${encodeURIComponent(JSON.stringify(query))}`, {
    signal,
  });
  if (!response.ok) throw new Error('Accounts could not be loaded.');
  return response.json();
});

load(query: KrnDataGridQuery): void {
  void this.source.load(query);
}
```

Bind `source.data()`, `source.totalRows()`, `source.loading()`, and `source.error()` to the Grid.
Always return a stable domain key from `rowIdentity`; never use the visible row index. Use
fixed-height virtual mode for large local collections and controlled mode for server paging.
Call `source.disconnect()` from the owning feature's destroy lifecycle to abort an in-flight
request. Mark essential columns with logical `pinned: 'start' | 'end'`; KERN preserves those
edges in LTR/RTL and recalculates offsets after resize or visibility changes.

## Model dates and time

Date Picker and Calendar use date-only values; Time Picker uses time-of-day values. Keep those
values separate from instants and time zones in the domain model. Convert to an instant only at
the application boundary where the intended zone is known. Provide a deterministic `today` value
in SSR, tests, and long-lived sessions when the server and browser clocks may disagree.

Use Date Range Picker only when both ends form one domain value. For two unrelated dates, use two
Date Pickers with explicit labels and cross-field validation.

## Model trees

Node identifiers must be non-empty, unique, and stable across immutable updates. Keep expanded
and selected identifiers controlled when route state or persistence owns them. Tree Navigation is
for destinations; Tree is for hierarchical data interaction. Do not hide asynchronous loading
inside a node label—set `childrenState` to `idle`, `loading`, or `error`, handle `loadChildren`,
and replace the immutable node branch when children arrive. An `error` branch remains retryable.

## Compose overlays

KERN-owned dialogs, drawers, sheets, selects, popovers, and tooltips share focus restoration,
Escape ordering, scroll locking, and modal ownership. Keep the originating trigger mounted until
the surface closes. An inner popup consumes Escape before its containing dialog.

Menu, Popover, and Hover Card render their own semantic trigger button. Content marked with
`krnMenuTrigger`, `krnPopoverTrigger`, or `krnHoverCardTrigger` is non-interactive label content;
use a `span`, not another button, link, input, or `button[krnButton]`.

For a custom Angular CDK overlay inside a KERN modal, register the trigger-to-pane relationship
through `KrnOverlayCoordinator`. Use a dedicated `overlayHost` only when a shell or
microfrontend owns the complete overlay branch; the resolver may point to an element rendered
after bootstrap.

## Present analytics

Charts require finite numeric values, non-empty labels, and unique stable datum identities.
Choose and document a negative-value policy. Keep the source-data table available; it is the exact
fallback for assistive technology and detailed inspection. Large series should be summarized or
aggregated before rendering rather than placing thousands of interactive SVG marks in the DOM.

Line charts communicate change over an ordered domain, bar charts compare discrete values, and
donut charts are appropriate only for a small part-to-whole set. Do not encode meaning by color
alone.

## Configure a locale

Install a complete built-in pack without copying its fields:

```ts
import { krnLocaleConfig, KRN_RU_RU_LOCALE, provideKrn } from '@kern-ui/angular/core';

export const appConfig = {
  providers: [provideKrn(krnLocaleConfig(KRN_RU_RU_LOCALE))],
};
```

Product copy stays in the application. Use typed partial translation overrides only for shared
component UI copy, and test formatting with the same locale on server and client.

Legacy token templates remain supported:

```ts
provideKrn({
  translations: {
    navigation: {
      pageLabel: 'Seite {page}',
      formatCommandAvailableMany: (count) => `${count} Befehle verfügbar`,
    },
  },
});
```

Templates interpolate only their documented exact tokens in a single pass. Prefer the optional
typed `format…` fields when pluralization or locale grammar depends on a runtime value.
Extension components that expose the same dual contract can call the public
`krnFormatTranslation(template, parameters, formatter, ...arguments)` resolver instead of
reimplementing interpolation.

## Test through public contracts

Use `@kern-ui/angular/testing` harnesses instead of internal CSS selectors. Component harnesses
cover actions, forms, selection, date/time, navigation, feedback, uploads, overlays, and Grid.
Keep domain assertions in application tests and interaction mechanics in harness methods.

For a complex feature, test at three levels:

1. strict compilation of the consuming component;
2. harness-driven behavior and keyboard focus;
3. one browser integration path with axe and SSR/hydration where applicable.

## Work within performance envelopes

KERN's release gates exercise 10,000 virtual Grid rows, a 500-node Tree, a 1,000-option Select, a
120-mark Chart, 200 form fields, and repeated modal cycles. Versioned budgets cover browser-side
scroll/input frame latency, bounded DOM, and retained modal heap in addition to cold-route smoke.
The emitted JSON metrics are release evidence, not permission to render unbounded interactive DOM.
Measure the consuming screen with realistic cells, templates, network latency, and change
frequency; switch to controlled loading or aggregation before exceeding the appropriate envelope.

## Agents and generated usage

An agent should search `agent/component-manifest.json`, read the selected per-component contract,
start from its compile-verified example or enterprise recipe, and run `validate_usage` through the
read-only KERN MCP server. `validate_usage` resolves exported and local aliases with the TypeScript
AST and rejects type-only component imports as runtime wiring. An agent should not guess deep
import paths, required inputs, projected slots, or lifecycle status from selector names.
