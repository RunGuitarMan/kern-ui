# Slider

- ID: `slider`
- Selector: `krn-slider`
- Import: `import { KrnSlider } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSlider`
- Lifecycle: **stable**
- Category: Forms

Slider. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed risk threshold
 *
 * Bind a numeric threshold with explicit range and label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSlider } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-slider-agent-example',
  standalone: true,
  imports: [KrnSlider, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-slider label="Risk threshold" [min]="0" [max]="100" [step]="5" [formControl]="control" />
  `,
})
export class KernSliderAgentExample {
  readonly control = new FormControl<number>(65, { nonNullable: true });
}

void bootstrapApplication(KernSliderAgentExample);
```

## API

| Name             | Kind   | Type                                       | Required | Default                         | Description                                                                |
| ---------------- | ------ | ------------------------------------------ | -------- | ------------------------------- | -------------------------------------------------------------------------- |
| `id`             | input  | `string`                                   | no       | `''`                            | Stable identifier value used by the id contract.                           |
| `label`          | input  | `string`                                   | no       | `''`                            | Visible text that names the control or data value.                         |
| `ariaLabel`      | input  | `string`                                   | no       | `this.translations.forms.value` | Accessible name used when visible content is not sufficient.               |
| `min`            | input  | `number`                                   | no       | `0`                             | Smallest accepted numeric or temporal value.                               |
| `max`            | input  | `number`                                   | no       | `100`                           | Largest accepted numeric or temporal value.                                |
| `step`           | input  | `number`                                   | no       | `1`                             | Increment applied by keyboard and pointer value adjustments.               |
| `disabled`       | input  | `boolean`                                  | no       | `false`                         | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`       | input  | `boolean`                                  | no       | `false`                         | Keeps the value perceivable while preventing user edits.                   |
| `invalid`        | input  | `boolean`                                  | no       | `false`                         | Exposes an externally controlled invalid presentation state.               |
| `showValue`      | input  | `boolean`                                  | no       | `true`                          | Controls whether the component applies the show value behavior.            |
| `valueFormatter` | input  | `((value: number) => string) \| undefined` | no       | `undefined`                     | Formats a domain value for visible and accessible presentation.            |
| `valueChange`    | output | `number`                                   | no       | `undefined`                     | Notifies the consumer after the value change interaction completes.        |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `number`.

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

## Related

- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
