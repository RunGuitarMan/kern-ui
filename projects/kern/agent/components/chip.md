# Chip

- ID: `chip`
- Selector: `krn-chip`
- Import: `import { KrnChip } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnChip`
- Lifecycle: **stable**
- Category: Data display

Chip. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled removable filter chip
 *
 * Keep selected filter state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnChip } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-chip-agent-example',
  standalone: true,
  imports: [KrnChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-chip
      [interactive]="true"
      [removable]="true"
      accessibleLabel="Enterprise filter"
      [(selected)]="selected"
    >
      Enterprise
    </krn-chip>
  `,
})
export class KernChipAgentExample {
  selected = true;
}

void bootstrapApplication(KernChipAgentExample);
```

## API

| Name              | Kind   | Type      | Required | Default                             | Description                                                                   |
| ----------------- | ------ | --------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `selected`        | model  | `boolean` | no       | `false`                             | Controlled selected state, distinct from keyboard focus.                      |
| `interactive`     | input  | `boolean` | no       | `false`                             | Enables the documented user interaction for an otherwise presentational item. |
| `removable`       | input  | `boolean` | no       | `false`                             | Displays a named action for removing the represented value.                   |
| `disabled`        | input  | `boolean` | no       | `false`                             | Prevents user interaction and participates in the disabled-state contract.    |
| `accessibleLabel` | input  | `string`  | no       | `this.translations.dataDisplay.tag` | Accessible name for the complete composite widget.                            |
| `remove`          | output | `void`    | no       | `undefined`                         | Notifies the consumer after the remove interaction completes.                 |

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
- `tag`
- `avatar`

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
