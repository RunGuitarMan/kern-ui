# Color Picker

- ID: `color-picker`
- Selector: `krn-color-picker`
- Import: `import { KrnColorPicker } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnColorPicker`
- Lifecycle: **beta**
- Category: Forms

Color Picker. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use Color Picker when users need a validated color value plus visual hue, saturation, lightness, and preview controls.

Avoid: Use a fixed Select or Radio Group when the product accepts only a small semantic palette.

## Compile-verified standalone Angular example

```ts
/**
 * Typed chart accent color
 *
 * Bind a normalized color value for user-configurable reporting.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnColorPicker } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-color-picker-agent-example',
  standalone: true,
  imports: [KrnColorPicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-color-picker pickerLabel="Chart accent" textLabel="Hex color" [formControl]="control" />
  `,
})
export class KernColorPickerAgentExample {
  readonly control = new FormControl<string>('#4666da', { nonNullable: true });
}

void bootstrapApplication(KernColorPickerAgentExample);
```

## API

| Name          | Kind   | Type                                  | Required | Default                                     | Description                                                                |
| ------------- | ------ | ------------------------------------- | -------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `id`          | input  | `string`                              | no       | `''`                                        | Stable identifier value used by the id contract.                           |
| `labels`      | input  | `Partial<KrnColorPickerTranslations>` | no       | `{}`                                        | Localized copy overrides for the component-owned interface text.           |
| `pickerLabel` | input  | `string`                              | no       | `this.translations.colorPicker.chooseColor` | Human-readable copy for the picker state or control.                       |
| `textLabel`   | input  | `string`                              | no       | `this.translations.colorPicker.colorValue`  | Human-readable copy for the text state or control.                         |
| `disabled`    | input  | `boolean`                             | no       | `false`                                     | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`    | input  | `boolean`                             | no       | `false`                                     | Keeps the value perceivable while preventing user edits.                   |
| `invalid`     | input  | `boolean`                             | no       | `false`                                     | Exposes an externally controlled invalid presentation state.               |
| `valueChange` | output | `string`                              | no       | `undefined`                                 | Notifies the consumer after the value change interaction completes.        |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

## Accessibility

- Enter or Space opens the picker and Escape closes it.
- Arrow keys adjust the focused hue, saturation, or lightness control.
- Tab follows the visible controls and Apply commits the draft color.
- Every visual color axis has a named keyboard-operable control and numeric value.
- The text value remains visible so color is not the only representation.
- Invalid color text is announced without silently replacing the committed value.

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
