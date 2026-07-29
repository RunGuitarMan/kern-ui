# Time Picker

- ID: `time-picker`
- Selector: `krn-time-picker`
- Import: `import { KrnTimePicker } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTimePicker`
- Lifecycle: **beta**
- Category: Forms

Time Picker. Accepts a precise typeable 24-hour time and offers a short set of common choices.

## Use

Use Time Picker for a precise local wall-clock value represented as a 24-hour HH:mm string.

Avoid: Use a short Select when only a few fixed times are valid, and keep timezone conversion outside the picker.

## Compile-verified standalone Angular example

```ts
/**
 * Typed maintenance time
 *
 * Bind a 24-hour time string within an allowed operating window.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTimePicker } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-time-picker-agent-example',
  standalone: true,
  imports: [KrnTimePicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-time-picker
      ariaLabel="Maintenance start"
      min="06:00"
      max="22:00"
      [formControl]="control"
    />
  `,
})
export class KernTimePickerAgentExample {
  readonly control = new FormControl<string>('18:30', { nonNullable: true });
}

void bootstrapApplication(KernTimePickerAgentExample);
```

## API

| Name          | Kind   | Type                                 | Required | Default                                   | Description                                                                |
| ------------- | ------ | ------------------------------------ | -------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `id`          | input  | `string`                             | no       | `''`                                      | Stable identifier value used by the id contract.                           |
| `labels`      | input  | `Partial<KrnTimePickerTranslations>` | no       | `{}`                                      | Localized copy overrides for the component-owned interface text.           |
| `ariaLabel`   | input  | `string`                             | no       | `this.translations.timePicker.chooseTime` | Accessible name used when visible content is not sufficient.               |
| `min`         | input  | `string`                             | no       | `''`                                      | Smallest accepted numeric or temporal value.                               |
| `max`         | input  | `string`                             | no       | `''`                                      | Largest accepted numeric or temporal value.                                |
| `step`        | input  | `number`                             | no       | `60`                                      | Increment applied by keyboard and pointer value adjustments.               |
| `disabled`    | input  | `boolean`                            | no       | `false`                                   | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`    | input  | `boolean`                            | no       | `false`                                   | Keeps the value perceivable while preventing user edits.                   |
| `required`    | input  | `boolean`                            | no       | `false`                                   | Marks the value as required and participates in Angular Forms validation.  |
| `invalid`     | input  | `boolean`                            | no       | `false`                                   | Exposes an externally controlled invalid presentation state.               |
| `valueChange` | output | `string`                             | no       | `undefined`                               | Notifies the consumer after the value change interaction completes.        |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

## Accessibility

- Enter or Space opens the time panel and Escape closes it.
- Arrow Up and Arrow Down adjust the focused hour or minute spinbutton.
- Enter applies a valid draft time.
- Hour and minute are named spinbuttons with numeric bounds and values.
- The formatted draft and validation state remain perceivable.
- The form value is a stable 24-hour HH:mm string independent of display copy.

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
- closed
- open
- empty results
- async loading

## Related

- `date-picker`
- `date-range-picker`
- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- The value is a 24-hour HH:mm string; timezone conversion remains an application concern.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
