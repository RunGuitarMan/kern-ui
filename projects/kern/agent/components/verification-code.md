# Verification Code

- ID: `verification-code`
- Selector: `krn-verification-code`
- Import: `import { KrnVerificationCode } from '@kern-ui/angular/forms';`
- Canonical symbol: `KrnOtpInput`
- Lifecycle: **stable**
- Category: Forms

Verification Code. Captures a fixed-length verification code across coordinated editable positions.

## Use

Use Verification Code for this specific contract: Captures a fixed-length verification code across coordinated editable positions.

Avoid: Do not choose Verification Code for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Typed six-digit verification code
 *
 * Bind the complete code as one string while rendering segmented inputs.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnVerificationCode } from '@kern-ui/angular/forms';

@Component({
  selector: 'app-kern-verification-code-agent-example',
  standalone: true,
  imports: [KrnVerificationCode, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-verification-code label="Verification code" [length]="6" [formControl]="control" />
  `,
})
export class KernVerificationCodeAgentExample {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

void bootstrapApplication(KernVerificationCodeAgentExample);
```

## API

| Name              | Kind   | Type                  | Required | Default           | Description                                                                                      |
| ----------------- | ------ | --------------------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`              | no       | `''`              | Stable identifier used by the id contract.                                                       |
| `label`           | input  | `string \| undefined` | no       | `undefined`       | Visible text that names the control or data value.                                               |
| `length`          | input  | `number`              | no       | `6`               | Defines the component's length behavior or presentation.                                         |
| `numericOnly`     | input  | `boolean`             | no       | `true`            | Defines the component's numeric only behavior or presentation.                                   |
| `autocomplete`    | input  | `string`              | no       | `'one-time-code'` | Native autocomplete purpose forwarded to the editable control.                                   |
| `ariaLabelledBy`  | input  | `string`              | no       | `''`              | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`              | no       | `''`              | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `tabindex`        | input  | `number`              | no       | `0`               | Native sequential-focus order forwarded to the owned interactive element.                        |
| `disabled`        | input  | `boolean`             | no       | `false`           | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`             | no       | `false`           | Keeps the value perceivable while preventing user edits.                                         |
| `required`        | input  | `boolean`             | no       | `false`           | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`         | input  | `boolean`             | no       | `false`           | Exposes an externally controlled invalid presentation state.                                     |
| `value`           | input  | `string \| undefined` | no       | `undefined`       | Controlled component value.                                                                      |
| `valueChange`     | output | `string`              | no       | `undefined`       | Notifies the consumer after the value change interaction completes.                              |
| `completed`       | output | `string`              | no       | `undefined`       | Notifies the consumer after the completed interaction completes.                                 |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

## Accessibility

- Typing fills the focused position and advances when possible
- Backspace clears and moves backward; arrow keys move between positions
- The real form control retains its visible name, described-by relationships, and Angular state.
- Required, readonly, disabled, and invalid states remain programmatically perceivable.

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
- required
- invalid

## Interactive playground

Route: `preview/verification-code`

Scenarios: `default`.
Public API coverage: 11/13
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default                                 | Test value                                          | Binding                         | Description                                                                |
| -------------- | ------- | --------------------------------------- | --------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `length`       | number  | `6`                                     | `7`                                                 | input `length` (property)       | Changes the number of verification cells.                                  |
| `autocomplete` | text    | `"one-time-code"`                       | `"one-time-code · alternate"`                       | input `autocomplete` (property) | Native autocomplete purpose forwarded to the editable control.             |
| `disabled`     | boolean | `false`                                 | `true`                                              | input `disabled` (property)     | Prevents user interaction and participates in the disabled-state contract. |
| `id`           | text    | `""`                                    | `"Alternate value"`                                 | input `id` (property)           | Stable identifier used by the id contract.                                 |
| `invalid`      | boolean | `false`                                 | `true`                                              | input `invalid` (property)      | Exposes an externally controlled invalid presentation state.               |
| `label`        | text    | `"Enter the 6-digit verification code"` | `"Enter the 6-digit verification code · alternate"` | input `label` (property)        | Visible text that names the control or data value.                         |
| `numericOnly`  | boolean | `true`                                  | `false`                                             | input `numericOnly` (property)  | Defines the component's numeric only behavior or presentation.             |
| `readonly`     | boolean | `false`                                 | `true`                                              | input `readonly` (property)     | Keeps the value perceivable while preventing user edits.                   |
| `required`     | boolean | `false`                                 | `true`                                              | input `required` (property)     | Marks the value as required and participates in Angular Forms validation.  |
| `tabindex`     | number  | `0`                                     | `1`                                                 | input `tabindex` (property)     | Native sequential-focus order forwarded to the owned interactive element.  |
| `value`        | text    | `""`                                    | `"Alternate value"`                                 | input `value` (property)        | Controlled component value.                                                |

Exact API exclusions:

| Public API        | Category           | Evidence                                                       | Reason                                                                                                                  |
| ----------------- | ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#verification-code` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#verification-code` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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
- `filled` — filled; scenario `default`; `value="482731"`; fixture effect `content/filled` — filled: The component is composed with a representative populated value..
- `empty` — empty; scenario `default`; fixture effect `content/empty` — empty: The component is composed with intentionally empty content..
- `readonly` — readonly; scenario `default`; fixture effect `status/neutral` — readonly: The fixture exposes the readonly status without claiming a public component input..
- `required` — Required; scenario `default`; `required=true`.
- `invalid` — Invalid; scenario `default`; `invalid=true`.

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
