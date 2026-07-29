# Floating Action Button

- ID: `floating-action-button`
- Selector: `krn-floating-action-button`
- Import: `import { KrnFloatingActionButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnFloatingActionButton`
- Lifecycle: **stable**
- Category: Actions

Floating Action Button. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Create-record floating action
 *
 * Expose a single high-priority creation action on compact layouts.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFloatingActionButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-floating-action-button-agent-example',
  standalone: true,
  imports: [KrnFloatingActionButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-floating-action-button ariaLabel="Create customer" [extended]="true">
      <span krnFabIcon aria-hidden="true">+</span>
      Create customer
    </krn-floating-action-button>
  `,
})
export class KernFloatingActionButtonAgentExample {}

void bootstrapApplication(KernFloatingActionButtonAgentExample);
```

## API

| Name        | Kind   | Type               | Required | Default     | Description                                                                      |
| ----------- | ------ | ------------------ | -------- | ----------- | -------------------------------------------------------------------------------- |
| `ariaLabel` | input  | `string`           | yes      | `required`  | Accessible name used when visible content is not sufficient.                     |
| `size`      | input  | `KrnSize`          | no       | `'lg'`      | Named semantic size resolved through KERN density and sizing tokens.             |
| `variant`   | input  | `KrnActionVariant` | no       | `'solid'`   | Named visual hierarchy treatment that preserves the component semantics.         |
| `tone`      | input  | `KrnTone`          | no       | `'brand'`   | Semantic intent that selects coordinated text, icon, border, and surface tokens. |
| `extended`  | input  | `boolean`          | no       | `true`      | Displays the floating action label in addition to its icon.                      |
| `loading`   | input  | `boolean`          | no       | `false`     | Prevents duplicate actions and exposes accessible busy state.                    |
| `disabled`  | input  | `boolean`          | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.       |
| `activated` | output | `MouseEvent`       | no       | `undefined` | Notifies the consumer after the activated interaction completes.                 |

## Content slots

- `[krnFabIcon]` — Projects content matching [krnFabIcon].
- `*` — Projects default component content.

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

- `button`
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `ariaLabel`.
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
