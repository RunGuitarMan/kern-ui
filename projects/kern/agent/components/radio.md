# Radio

- ID: `radio`
- Selector: `krn-radio`
- Import: `import { KrnRadio } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnRadio`
- Lifecycle: **stable**
- Category: Forms

Radio. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Individual radio option
 *
 * Provide a stable submitted value and visible option label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRadio } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-radio-agent-example',
  standalone: true,
  imports: [KrnRadio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-radio name="plan" value="enterprise">Enterprise plan</krn-radio> `,
})
export class KernRadioAgentExample {}

void bootstrapApplication(KernRadioAgentExample);
```

## API

| Name          | Kind   | Type      | Required | Default                | Description                                                                |
| ------------- | ------ | --------- | -------- | ---------------------- | -------------------------------------------------------------------------- |
| `value`       | input  | `string`  | yes      | `required`             | Controlled component value.                                                |
| `name`        | input  | `string`  | no       | `createKrnId('radio')` | Required human-readable name for the represented person, item, or action.  |
| `ariaLabel`   | input  | `string`  | no       | `''`                   | Accessible name used when visible content is not sufficient.               |
| `description` | input  | `string`  | no       | `''`                   | Visible supporting description for the component content.                  |
| `disabled`    | input  | `boolean` | no       | `false`                | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`    | input  | `boolean` | no       | `false`                | Keeps the value perceivable while preventing user edits.                   |
| `selected`    | output | `string`  | no       | `undefined`            | Controlled selected state, distinct from keyboard focus.                   |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses
- Arrow keys operate grouped controls
- Escape cancels transient UI
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
- filled
- empty
- selected
- unselected

## Related

- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Do not omit required inputs: `value`.
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
