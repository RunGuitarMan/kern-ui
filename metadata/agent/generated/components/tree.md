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

| Name           | Kind   | Type                         | Required | Default                             | Description                                                                           |
| -------------- | ------ | ---------------------------- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `nodes`        | input  | `ReadonlyArray<KrnTreeNode>` | no       | `[]`                                | Hierarchical nodes whose ids must be stable and unique across the complete tree.      |
| `ariaLabel`    | input  | `string`                     | no       | `this.translations.navigation.tree` | Accessible name used when visible content is not sufficient.                          |
| `selected`     | model  | `string`                     | no       | `''`                                | Controlled selected state, distinct from keyboard focus.                              |
| `expanded`     | model  | `ReadonlySet<string>`        | no       | `new Set<string>()`                 | Controlled expanded state for a disclosure or hierarchical item.                      |
| `loadChildren` | output | `KrnTreeNode`                | no       | `undefined`                         | Requests children when an unloaded node is expanded or its failed request is retried. |

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
- loading branch
- error branch
- collapsed
- expanded
- selected

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
