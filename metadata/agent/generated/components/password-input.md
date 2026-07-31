# Password Input

- ID: `password-input`
- Selector: `krn-password-input`
- Import: `import { KrnPasswordInput } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnPasswordInput`
- Lifecycle: **stable**
- Category: Forms

Password Input. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed password entry
 *
 * Bind password state without reading values from the component instance.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPasswordInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-password-input-agent-example',
  standalone: true,
  imports: [KrnPasswordInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-password-input
      id="password"
      ariaLabel="Password"
      autocomplete="current-password"
      [formControl]="control"
    />
  `,
})
export class KernPasswordInputAgentExample {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

void bootstrapApplication(KernPasswordInputAgentExample);
```

## API

| Name              | Kind   | Type                  | Required | Default                                | Description                                                                                      |
| ----------------- | ------ | --------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`              | no       | `''`                                   | Stable identifier value used by the id contract.                                                 |
| `name`            | input  | `string`              | no       | `''`                                   | Required human-readable name for the represented person, item, or action.                        |
| `placeholder`     | input  | `string`              | no       | `''`                                   | Short input hint shown only while no value is present.                                           |
| `ariaLabel`       | input  | `string`              | no       | `''`                                   | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`  | input  | `string`              | no       | `''`                                   | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`              | no       | `''`                                   | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `autocomplete`    | input  | `string`              | no       | `'current-password'`                   | Native autocomplete purpose forwarded to the editable control.                                   |
| `value`           | input  | `string \| undefined` | no       | `undefined`                            | Controlled component value.                                                                      |
| `minLength`       | input  | `number \| undefined` | no       | `undefined`                            | Upper or lower bound applied to the length value.                                                |
| `maxLength`       | input  | `number \| undefined` | no       | `undefined`                            | Upper or lower bound applied to the length value.                                                |
| `showLabel`       | input  | `string`              | no       | `this.translations.forms.showPassword` | Human-readable copy for the show state or control.                                               |
| `hideLabel`       | input  | `string`              | no       | `this.translations.forms.hidePassword` | Human-readable copy for the hide state or control.                                               |
| `showText`        | input  | `string`              | no       | `this.translations.forms.show`         | Human-readable copy for the show state or control.                                               |
| `hideText`        | input  | `string`              | no       | `this.translations.forms.hide`         | Human-readable copy for the hide state or control.                                               |
| `disabled`        | input  | `boolean`             | no       | `false`                                | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`             | no       | `false`                                | Keeps the value perceivable while preventing user edits.                                         |
| `required`        | input  | `boolean`             | no       | `false`                                | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`         | input  | `boolean`             | no       | `false`                                | Exposes an externally controlled invalid presentation state.                                     |
| `valueChange`     | output | `string`              | no       | `undefined`                            | Notifies the consumer after the value change interaction completes.                              |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

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
- readonly
- required
- invalid

## Interactive playground

Route: `preview/password-input`

Scenarios: `default`.
Public API coverage: 12/18
directly controlled; 6 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default              | Test value                       | Binding                         | Description                                                      |
| -------------- | ------- | -------------------- | -------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `placeholder`  | text    | `"Enter password"`   | `"Enter password · alternate"`   | input `placeholder` (property)  | Sets the empty-value prompt.                                     |
| `hideText`     | text    | `"Hide"`             | `"Hide · alternate"`             | input `hideText` (property)     | Uses locale-aware password-toggle copy until explicitly changed. |
| `showText`     | text    | `"Show"`             | `"Show · alternate"`             | input `showText` (property)     | Uses locale-aware password-toggle copy until explicitly changed. |
| `disabled`     | boolean | `false`              | `true`                           | input `disabled` (property)     | Prevents user interaction.                                       |
| `readOnly`     | boolean | `false`              | `true`                           | input `readonly` (property)     | Keeps the value focusable while preventing edits.                |
| `required`     | boolean | `false`              | `true`                           | input `required` (property)     | Marks the control as required.                                   |
| `invalid`      | boolean | `false`              | `true`                           | input `invalid` (property)      | Exposes the invalid visual and ARIA state.                       |
| `autocomplete` | text    | `"current-password"` | `"current-password · alternate"` | input `autocomplete` (property) | Configures the component autocomplete contract.                  |
| `id`           | text    | `""`                 | `"Alternate value"`              | input `id` (property)           | Configures the component id contract.                            |
| `maxLength`    | number  | `100`                | `101`                            | input `maxLength` (property)    | Configures the component maxLength contract.                     |
| `minLength`    | number  | `0`                  | `1`                              | input `minLength` (property)    | Configures the component minLength contract.                     |
| `value`        | text    | `""`                 | `"Alternate value"`              | input `value` (property)        | Controlled component value.                                      |

Exact API exclusions:

| Public API        | Category           | Evidence                                                                   | Reason                                                                                                                                                               |
| ----------------- | ------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#password-input`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#password-input`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#password-input`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `hideLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#password-input`                | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `name`            | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#password-input` | Form submission field names do not alter the rendered component and are covered by forms integration tests.                                                          |
| `showLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#password-input`                | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `readonly` — Readonly; scenario `default`; `readOnly=true`.
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
