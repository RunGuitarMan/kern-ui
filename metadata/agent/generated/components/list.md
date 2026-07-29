# List

- ID: `list`
- Selector: `krn-list`
- Import: `import { KrnList } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnList`
- Lifecycle: **stable**
- Category: Data display

List. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Selected customer list
 *
 * Compose semantic list items and expose current selection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnList, KrnListItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-list-agent-example',
  standalone: true,
  imports: [KrnList, KrnListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-list role="listbox" ariaLabel="Customers">
      <krn-list-item heading="Acme Europe" [selected]="true"> Enterprise · Healthy </krn-list-item>
      <krn-list-item heading="Globex">Commercial · Review needed</krn-list-item>
    </krn-list>
  `,
})
export class KernListAgentExample {}

void bootstrapApplication(KernListAgentExample);
```

## API

| Name        | Kind  | Type                  | Required | Default                              | Description                                                                    |
| ----------- | ----- | --------------------- | -------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| `role`      | input | `"list" \| "listbox"` | no       | `'list'`                             | ARIA role used when the consumer must refine the component’s semantic purpose. |
| `ariaLabel` | input | `string`              | no       | `this.translations.dataDisplay.list` | Accessible name used when visible content is not sufficient.                   |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
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

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

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
