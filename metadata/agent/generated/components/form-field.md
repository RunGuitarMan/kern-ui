# Form Field

- ID: `form-field`
- Selector: `krn-form-field`
- Import: `import { KrnFormField } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnFormField`
- Lifecycle: **stable**
- Category: Forms

Form Field. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Labeled reactive form field
 *
 * Compose visible label, control and hint around one typed FormControl.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFormField, KrnHint, KrnLabel, KrnTextInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-form-field-agent-example',
  standalone: true,
  imports: [KrnFormField, ReactiveFormsModule, KrnHint, KrnLabel, KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field>
      <krn-label for="account-name">Account name</krn-label>
      <krn-text-input id="account-name" [formControl]="control" ariaLabel="Account name" />
      <krn-hint>Use the legal customer name.</krn-hint>
    </krn-form-field>
  `,
})
export class KernFormFieldAgentExample {
  readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });
}

void bootstrapApplication(KernFormFieldAgentExample);
```

## API

| Name           | Kind  | Type                                             | Required | Default     | Description                                                                         |
| -------------- | ----- | ------------------------------------------------ | -------- | ----------- | ----------------------------------------------------------------------------------- |
| `id`           | input | `string`                                         | no       | `''`        | Stable identifier value used by the id contract.                                    |
| `label`        | input | `string`                                         | no       | `''`        | Visible text that names the control or data value.                                  |
| `hint`         | input | `string`                                         | no       | `''`        | Supporting guidance displayed with a form control or product action.                |
| `error`        | input | `string`                                         | no       | `''`        | Current failure message or error state exposed by asynchronous content.             |
| `optionalText` | input | `string`                                         | no       | `''`        | Human-readable copy for the optional state or control.                              |
| `required`     | input | `boolean`                                        | no       | `false`     | Marks the value as required and participates in Angular Forms validation.           |
| `disabled`     | input | `boolean`                                        | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.          |
| `readonly`     | input | `boolean`                                        | no       | `false`     | Keeps the value perceivable while preventing user edits.                            |
| `state`        | input | `"invalid" \| "default" \| "valid" \| "pending"` | no       | `'default'` | Current semantic state used to choose copy, iconography, and announcement behavior. |

## Content slots

- `krn-label` — Projects content matching krn-label.
- `*` — Projects default component content.
- `krn-hint, krn-validation-message` — Projects content matching krn-hint, krn-validation-message.

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
- disabled
- readonly
- required

## Interactive playground

Route: `preview/form-field`

Scenarios: `default`, `stress`.
Public API coverage: 9/9
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default                        | Test value                                 | Binding                         | Description                                                               |
| -------------- | ------- | ------------------------------ | ------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------- |
| `state`        | select  | `"default"`                    | `"valid"`                                  | input `state` (property)        | Shows default, valid, pending, or invalid field feedback.                 |
| `label`        | text    | `""`                           | `"Alternate value"`                        | input `label` (property)        | Changes the visible field label.                                          |
| `disabled`     | boolean | `false`                        | `true`                                     | input `disabled` (property)     | Prevents interaction and participates in the component disabled contract. |
| `error`        | text    | `""`                           | `"Alternate value"`                        | input `error` (property)        | Configures the component error contract.                                  |
| `hint`         | text    | `"Required enterprise value."` | `"Required enterprise value. · alternate"` | input `hint` (property)         | Configures the component hint contract.                                   |
| `id`           | text    | `""`                           | `"Alternate value"`                        | input `id` (property)           | Configures the component id contract.                                     |
| `optionalText` | text    | `""`                           | `"Alternate value"`                        | input `optionalText` (property) | Configures the component optionalText contract.                           |
| `readonly`     | boolean | `false`                        | `true`                                     | input `readonly` (property)     | Configures the component readonly contract.                               |
| `required`     | boolean | `true`                         | `false`                                    | input `required` (property)     | Marks the value as required and participates in Angular Forms validation. |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `stress`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `stress`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `readonly` — readonly; scenario `default`; fixture effect `status/neutral` — readonly: The fixture exposes the readonly status without claiming a public component input..
- `required` — required; scenario `default`; `required=true`; fixture effect `status/neutral` — required: The fixture exposes the required status without claiming a public component input..
- `optional` — Optional; scenario `default`; `required=false`.
- `stress` — Stress data; scenario `stress`.

## Related

- `label`
- `hint`
- `validation-message`
- `text-input`

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
