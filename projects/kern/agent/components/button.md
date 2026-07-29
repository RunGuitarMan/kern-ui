# Button

- ID: `button`
- Selector: `krn-button`
- Import: `import { KrnButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnButton`
- Lifecycle: **stable**
- Category: Actions

Button. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Primary save action
 *
 * Render an explicit form action with semantic hierarchy.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-button-agent-example',
  standalone: true,
  imports: [KrnButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-button type="submit" variant="solid" tone="brand">Save changes</krn-button> `,
})
export class KernButtonAgentExample {}

void bootstrapApplication(KernButtonAgentExample);
```

## API

| Name        | Kind   | Type                   | Required | Default     | Description                                                                      |
| ----------- | ------ | ---------------------- | -------- | ----------- | -------------------------------------------------------------------------------- |
| `size`      | input  | `KrnSize`              | no       | `'md'`      | Named semantic size resolved through KERN density and sizing tokens.             |
| `variant`   | input  | `KrnActionVariant`     | no       | `'solid'`   | Named visual hierarchy treatment that preserves the component semantics.         |
| `tone`      | input  | `KrnTone`              | no       | `'brand'`   | Semantic intent that selects coordinated text, icon, border, and surface tokens. |
| `type`      | input  | `KrnButtonType`        | no       | `'button'`  | Native action or input type forwarded to the owned interactive element.          |
| `name`      | input  | `string`               | no       | `''`        | Required human-readable name for the represented person, item, or action.        |
| `value`     | input  | `string`               | no       | `''`        | Controlled component value.                                                      |
| `ariaLabel` | input  | `string`               | no       | `''`        | Accessible name used when visible content is not sufficient.                     |
| `loading`   | input  | `boolean`              | no       | `false`     | Prevents duplicate actions and exposes accessible busy state.                    |
| `disabled`  | input  | `boolean`              | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.       |
| `pressed`   | input  | `boolean \| undefined` | no       | `undefined` | Controlled toggle-button pressed state exposed through native button semantics.  |
| `activated` | output | `MouseEvent`           | no       | `undefined` | Notifies the consumer after the activated interaction completes.                 |

## Content slots

- `[krnLeadingIcon]` — Projects content matching [krnLeadingIcon].
- `*` — Projects default component content.
- `[krnTrailingIcon]` — Projects content matching [krnTrailingIcon].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Enter / Space activates
- Tab follows document order
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
- hover
- focus-visible
- active
- disabled

## Related

- `icon-button`
- `button-group`
- `split-button`
- `floating-action-button`

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
