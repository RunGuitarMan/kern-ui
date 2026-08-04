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

| Name              | Kind   | Type                                  | Required | Default     | Description                                                                                      |
| ----------------- | ------ | ------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`                              | no       | `''`        | Stable identifier value used by the id contract.                                                 |
| `labels`          | input  | `Partial<KrnColorPickerTranslations>` | no       | `{}`        | Localized copy overrides for the component-owned interface text.                                 |
| `pickerLabel`     | input  | `string \| undefined`                 | no       | `undefined` | Human-readable copy for the picker state or control.                                             |
| `textLabel`       | input  | `string \| undefined`                 | no       | `undefined` | Human-readable copy for the text state or control.                                               |
| `ariaLabelledBy`  | input  | `string`                              | no       | `''`        | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`                              | no       | `''`        | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `disabled`        | input  | `boolean`                             | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`                             | no       | `false`     | Keeps the value perceivable while preventing user edits.                                         |
| `invalid`         | input  | `boolean`                             | no       | `false`     | Exposes an externally controlled invalid presentation state.                                     |
| `tabindex`        | input  | `number`                              | no       | `0`         | Native sequential-focus order forwarded to the owned interactive element.                        |
| `value`           | input  | `string \| undefined`                 | no       | `undefined` | Controlled component value.                                                                      |
| `open`            | model  | `boolean`                             | no       | `false`     | Controls whether the disclosure or overlay surface is visible.                                   |
| `valueChange`     | output | `string`                              | no       | `undefined` | Notifies the consumer after the value change interaction completes.                              |

## Deprecated selectors

_No deprecated selectors._

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
- readonly
- invalid
- closed
- open
- empty results
- async loading

## Interactive playground

Route: `preview/color-picker`

Scenarios: `default`.
Public API coverage: 7/12
directly controlled; 5 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default | Test value          | Binding                     | Description                                                               |
| ---------- | ------- | ------- | ------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `invalid`  | boolean | `false` | `true`              | input `invalid` (property)  | Exposes the invalid visual and ARIA state.                                |
| `disabled` | boolean | `false` | `true`              | input `disabled` (property) | Prevents interaction and participates in the component disabled contract. |
| `id`       | text    | `""`    | `"Alternate value"` | input `id` (property)       | Configures the component id contract.                                     |
| `open`     | boolean | `false` | `true`              | model `open`                | Controlled disclosure or overlay state.                                   |
| `readonly` | boolean | `false` | `true`              | input `readonly` (property) | Configures the component readonly contract.                               |
| `tabindex` | number  | `0`     | `1`                 | input `tabindex` (property) | Configures the component tabindex contract.                               |
| `value`    | text    | `""`    | `"Alternate value"` | input `value` (property)    | Controlled component value.                                               |

Exact API exclusions:

| Public API        | Category           | Evidence                                                  | Reason                                                                                                                                                               |
| ----------------- | ------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#color-picker` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#color-picker` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `labels`          | translation-object | `locale-preview:preview/color-picker?locale=ru-RU`        | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                                                                  |
| `pickerLabel`     | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#color-picker` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `textLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#color-picker` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `filled` — filled; scenario `default`; fixture effect `content/filled` — filled: The component is composed with a representative populated value..
- `empty` — empty; scenario `default`; fixture effect `content/empty` — empty: The component is composed with intentionally empty content..
- `readonly` — readonly; scenario `default`; fixture effect `status/neutral` — readonly: The fixture exposes the readonly status without claiming a public component input..
- `invalid` — Invalid; scenario `default`; `invalid=true`.
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `empty-results` — empty results; scenario `default`; fixture effect `data/empty` — empty results: The fixture data source returned no records..
- `async-loading` — async loading; scenario `default`; fixture effect `status/info` — async loading: The fixture exposes the async loading status without claiming a public component input..

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
