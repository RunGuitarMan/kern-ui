# CRUD Toolbar

- ID: `crud-toolbar`
- Selector: `krn-crud-toolbar`
- Import: `import { KrnCrudToolbar } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnCrudToolbar`
- Lifecycle: **recipe**
- Category: Patterns

CRUD Toolbar. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Customer CRUD toolbar
 *
 * Compose a title and actions while exposing selection count.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCrudToolbar } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-crud-toolbar-agent-example',
  standalone: true,
  imports: [KrnCrudToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-crud-toolbar ariaLabel="Customer actions" [selectedCount]="selectedCount">
      <strong krnToolbarTitle>Customers</strong>
      <button type="button">Create customer</button>
      <button type="button" [disabled]="selectedCount === 0">Archive selected</button>
    </krn-crud-toolbar>
  `,
})
export class KernCrudToolbarAgentExample {
  selectedCount = 2;
}

void bootstrapApplication(KernCrudToolbarAgentExample);
```

## API

| Name            | Kind  | Type                        | Required | Default                                    | Description                                                       |
| --------------- | ----- | --------------------------- | -------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `ariaLabel`     | input | `string`                    | no       | `this.translations.patterns.actions`       | Accessible name used when visible content is not sufficient.      |
| `selectedCount` | input | `number`                    | no       | `0`                                        | Number of selected records summarized by the surrounding pattern. |
| `selectedLabel` | input | `(count: number) => string` | no       | `this.translations.patterns.selectedCount` | Human-readable copy for the selected state or control.            |

## Content slots

- `[krnToolbarTitle]` — Projects content matching [krnToolbarTitle].
- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- No custom keyboard behavior unless the composition is interactive
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

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
- loading
- empty
- error
- success

## Related

- `user-menu`
- `notification-center`
- `global-search`
- `filter-bar`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
