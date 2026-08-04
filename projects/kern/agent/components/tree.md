# Tree

- ID: `tree`
- Selector: `krn-tree`
- Import: `import { KrnTree } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTree`
- Lifecycle: **beta**
- Category: Data display

Tree. Presents hierarchical data with one roving tab stop, expansion, selection, and locale-aware typeahead.

## Use

Use Tree for hierarchical data that needs roving focus, expansion, selection, and optional asynchronous branches.

Avoid: Use Tree Navigation for route wayfinding and nested lists when items do not require composite-widget keyboard behavior.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled organization tree
 *
 * Use stable node ids and own expanded and selected state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTree, type KrnTreeNode } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tree-agent-example',
  standalone: true,
  imports: [KrnTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tree
      ariaLabel="Organization units"
      [nodes]="nodes"
      [(selected)]="selectedId"
      [(expanded)]="expandedIds"
    />
  `,
})
export class KernTreeAgentExample {
  readonly nodes: readonly KrnTreeNode[] = [
    {
      id: 'engineering',
      label: 'Engineering',
      children: [
        { id: 'platform', label: 'Platform' },
        { id: 'security', label: 'Security' },
      ],
    },
  ];

  selectedId = 'platform';

  expandedIds: ReadonlySet<string> = new Set(['engineering']);
}

void bootstrapApplication(KernTreeAgentExample);
```

## API

| Name           | Kind   | Type                         | Required | Default             | Description                                                                           |
| -------------- | ------ | ---------------------------- | -------- | ------------------- | ------------------------------------------------------------------------------------- |
| `nodes`        | input  | `ReadonlyArray<KrnTreeNode>` | no       | `[]`                | Hierarchical nodes whose ids must be stable and unique across the complete tree.      |
| `ariaLabel`    | input  | `string \| undefined`        | no       | `undefined`         | Accessible name used when visible content is not sufficient.                          |
| `selected`     | model  | `string`                     | no       | `''`                | Controlled selected state, distinct from keyboard focus.                              |
| `expanded`     | model  | `ReadonlySet<string>`        | no       | `new Set<string>()` | Controlled expanded state for a disclosure or hierarchical item.                      |
| `loadChildren` | output | `KrnTreeNode`                | no       | `undefined`         | Requests children when an unloaded node is expanded or its failed request is retried. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow Up and Arrow Down move through visible enabled nodes.
- Arrow Right expands or enters a branch; Arrow Left collapses or returns to its parent.
- Home and End jump; typing moves to the next matching visible node.
- Every node id is non-empty, stable, and unique across the complete tree.
- Hierarchy, position, expansion, selection, loading, and error states are exposed.
- Disabled nodes stay perceivable but are skipped by roving focus.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.

Hydration evidence scope: `library-docs-route-smoke`; status:
`consumer-validation-required`.

## Acceptance states

- default
- overflow
- long text
- dark
- high contrast
- compact
- RTL
- mobile
- hover
- focus-visible
- active
- disabled
- selected
- unselected
- closed
- open
- loading branch
- error branch
- collapsed
- expanded

## Interactive playground

Route: `preview/tree`

Scenarios: `default`, `states`, `stress`.
Public API coverage: 1/4
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument    | Control | Default   | Test value          | Binding          | Description                                      |
| ----------- | ------- | --------- | ------------------- | ---------------- | ------------------------------------------------ |
| `dataState` | select  | `"ready"` | `"loading"`         | fixture data     | Shows ready, loading, error, or large-tree data. |
| `selected`  | text    | `""`      | `"Alternate value"` | model `selected` | Changes the selected tree node.                  |

Exact API exclusions:

| Public API  | Category           | Evidence                                          | Reason                                                                                                                  |
| ----------- | ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tree` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `expanded`  | complex-data       | `specimen-fixture:preview/tree?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `nodes`     | complex-data       | `specimen-fixture:preview/tree?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `stress`; fixture effect `data/alternate` — overflow: The fixture data projection is changed for this acceptance state..
- `long-text` — long text; scenario `stress`; fixture effect `data/alternate` — long text: The fixture data projection is changed for this acceptance state..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — disabled; scenario `default`; fixture effect `data/alternate` — disabled: The fixture data projection is changed for this acceptance state..
- `selected` — selected; scenario `default`; fixture effect `data/selected` — selected: The fixture data projection is changed for this acceptance state..
- `unselected` — unselected; scenario `default`; fixture effect `data/selected` — unselected: The fixture data projection is changed for this acceptance state..
- `closed` — closed; scenario `default`; fixture effect `data/alternate` — closed: The fixture data projection is changed for this acceptance state..
- `open` — open; scenario `default`; fixture effect `data/alternate` — open: The fixture data projection is changed for this acceptance state..
- `loading-branch` — loading branch; scenario `default`; `dataState="loading"`; fixture effect `data/loading` — loading branch: The fixture is waiting for enterprise data..
- `error-branch` — error branch; scenario `default`; `dataState="error"`; fixture effect `data/error` — error branch: The fixture data request failed and can be retried..
- `collapsed` — collapsed; scenario `default`; fixture effect `data/alternate` — collapsed: The fixture data projection is changed for this acceptance state..
- `expanded` — expanded; scenario `default`; fixture effect `data/alternate` — expanded: The fixture data projection is changed for this acceptance state..
- `loading` — Loading; scenario `default`; `dataState="loading"`.
- `error` — Error; scenario `default`; `dataState="error"`.
- `stress` — Stress; scenario `stress`; `dataState="stress"`.
- `async-branches` — Async branches; scenario `states`.

## Related

- `tree-navigation`
- `data-grid`
- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Every node id must be non-empty and unique across the complete tree.
- Do not derive persistent ids from mutable array indexes.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
