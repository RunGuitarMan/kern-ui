# Tree Navigation

- ID: `tree-navigation`
- Selector: `krn-tree-navigation`
- Import: `import { KrnTreeNavigation } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTreeNavigation`
- Lifecycle: **beta**
- Category: Navigation

Tree Navigation. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use Tree Navigation for hierarchical route or document wayfinding with expandable branches.

Avoid: Use Tree for selectable domain data and Menu for a short transient action hierarchy.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled product navigation tree
 *
 * Own selected and expanded ids for a typed nested navigation model.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTreeNavigation, type KrnTreeNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tree-navigation-agent-example',
  standalone: true,
  imports: [KrnTreeNavigation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tree-navigation
      ariaLabel="Product navigation"
      [items]="items"
      [(selectedId)]="selectedId"
      [(expandedIds)]="expandedIds"
    />
  `,
})
export class KernTreeNavigationAgentExample {
  readonly items: readonly KrnTreeNavigationItem[] = [
    {
      id: 'customers',
      label: 'Customers',
      children: [
        { id: 'active-customers', label: 'Active' },
        { id: 'risk-customers', label: 'At risk' },
      ],
    },
  ];

  selectedId: string | null = 'active-customers';

  expandedIds: readonly string[] = ['customers'];
}

void bootstrapApplication(KernTreeNavigationAgentExample);
```

## API

| Name           | Kind   | Type                                   | Required | Default     | Description                                                                           |
| -------------- | ------ | -------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------- |
| `items`        | input  | `ReadonlyArray<KrnTreeNavigationItem>` | no       | `[]`        | Ordered item collection rendered by the composite widget.                             |
| `selectedId`   | model  | `string \| null`                       | no       | `null`      | Stable id of the currently selected item.                                             |
| `expandedIds`  | model  | `ReadonlyArray<string>`                | no       | `[]`        | Stable ids of the currently expanded hierarchical items.                              |
| `ariaLabel`    | input  | `string \| undefined`                  | no       | `undefined` | Accessible name used when visible content is not sufficient.                          |
| `indent`       | input  | `string`                               | no       | `'1rem'`    | Logical inline indentation applied for each hierarchical depth level.                 |
| `showGuides`   | input  | `boolean`                              | no       | `true`      | Controls whether the component applies the show guides behavior.                      |
| `itemSelected` | output | `KrnTreeNavigationItem`                | no       | `undefined` | Notifies the consumer after the item selected interaction completes.                  |
| `loadChildren` | output | `KrnTreeNavigationItem`                | no       | `undefined` | Requests children when an unloaded item is expanded or its failed request is retried. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow Up and Arrow Down move through visible enabled items.
- Arrow Right expands or enters a branch; Arrow Left collapses or returns to its parent.
- Home and End jump; typing moves to the next matching visible item; Enter activates.
- Every navigation item id is non-empty, stable, and unique.
- Current location is distinct from focus and selection.
- Expansion and hierarchy remain perceivable when labels overflow.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.
- Uses the shared deterministic KERN id service.

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
- current
- loading branch
- error branch
- collapsed
- expanded
- selected

## Interactive playground

Route: `preview/tree-navigation`

Scenarios: `default`, `states`.
Public API coverage: 3/6
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument     | Control | Default         | Test value   | Binding                       | Description                                   |
| ------------ | ------- | --------------- | ------------ | ----------------------------- | --------------------------------------------- |
| `selected`   | select  | `"automations"` | `"overview"` | model `selectedId`            | Changes the selected navigation node.         |
| `indent`     | text    | `"1rem"`        | `"20rem"`    | input `indent` (property)     | Configures the component indent contract.     |
| `showGuides` | boolean | `true`          | `false`      | input `showGuides` (property) | Configures the component showGuides contract. |

Exact API exclusions:

| Public API    | Category           | Evidence                                                     | Reason                                                                                                                  |
| ------------- | ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`   | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tree-navigation` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `expandedIds` | complex-data       | `specimen-fixture:preview/tree-navigation?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `items`       | complex-data       | `specimen-fixture:preview/tree-navigation?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `data/alternate` — overflow: The fixture data projection is changed for this acceptance state..
- `long-text` — long text; scenario `default`; fixture effect `data/alternate` — long text: The fixture data projection is changed for this acceptance state..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — disabled; scenario `default`; fixture effect `data/alternate` — disabled: The fixture data projection is changed for this acceptance state..
- `current` — current; scenario `default`; fixture effect `data/alternate` — current: The fixture data projection is changed for this acceptance state..
- `loading-branch` — loading branch; scenario `default`; fixture effect `data/loading` — loading branch: The fixture is waiting for enterprise data..
- `error-branch` — error branch; scenario `default`; fixture effect `data/error` — error branch: The fixture data request failed and can be retried..
- `collapsed` — collapsed; scenario `default`; fixture effect `data/alternate` — collapsed: The fixture data projection is changed for this acceptance state..
- `expanded` — expanded; scenario `default`; fixture effect `data/alternate` — expanded: The fixture data projection is changed for this acceptance state..
- `selected` — selected; scenario `default`; fixture effect `data/selected` — selected: The fixture data projection is changed for this acceptance state..
- `async-branches` — Async branches; scenario `states`.

## Related

- `tree`
- `menu`
- `sidebar`
- `breadcrumbs`
- `tabs`
- `vertical-tabs`
- `pagination`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Every item id must be non-empty, unique and stable across updates.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
