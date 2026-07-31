# Checkbox

- ID: `checkbox`
- Selector: `krn-checkbox`
- Import: `import { KrnCheckbox } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCheckbox`
- Lifecycle: **stable**
- Category: Forms

Checkbox. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed policy acknowledgement
 *
 * Bind a boolean consent value through Angular Forms.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCheckbox } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-checkbox-agent-example',
  standalone: true,
  imports: [KrnCheckbox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-checkbox [formControl]="control">
      I confirm the account owner has approved this change.
    </krn-checkbox>
  `,
})
export class KernCheckboxAgentExample {
  readonly control = new FormControl<boolean>(false, { nonNullable: true });
}

void bootstrapApplication(KernCheckboxAgentExample);
```

## API

| Name                  | Kind   | Type                   | Required | Default                          | Description                                                                                      |
| --------------------- | ------ | ---------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`                  | input  | `string`               | no       | `''`                             | Stable identifier value used by the id contract.                                                 |
| `name`                | input  | `string`               | no       | `''`                             | Required human-readable name for the represented person, item, or action.                        |
| `value`               | input  | `string`               | no       | `createKrnId('checkbox-option')` | Controlled component value.                                                                      |
| `checked`             | input  | `boolean \| undefined` | no       | `undefined`                      | Controlled checked state rendered by the native choice control.                                  |
| `ariaLabel`           | input  | `string`               | no       | `''`                             | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`      | input  | `string`               | no       | `''`                             | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy`     | input  | `string`               | no       | `''`                             | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `description`         | input  | `string`               | no       | `''`                             | Visible supporting description for the component content.                                        |
| `disabled`            | input  | `boolean`              | no       | `false`                          | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`            | input  | `boolean`              | no       | `false`                          | Keeps the value perceivable while preventing user edits.                                         |
| `required`            | input  | `boolean`              | no       | `false`                          | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`             | input  | `boolean`              | no       | `false`                          | Exposes an externally controlled invalid presentation state.                                     |
| `indeterminate`       | input  | `boolean`              | no       | `false`                          | Represents an unknown progress value or a mixed selection state.                                 |
| `tabindex`            | input  | `number`               | no       | `0`                              | Native sequential-focus order forwarded to the owned interactive element.                        |
| `checkedChange`       | output | `boolean`              | no       | `undefined`                      | Notifies the consumer after the checked change interaction completes.                            |
| `indeterminateChange` | output | `boolean`              | no       | `undefined`                      | Notifies the consumer after the indeterminate change interaction completes.                      |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Angular Forms control with value type `boolean | null`.

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
- selected
- unselected

## Interactive playground

Route: `preview/checkbox`

Scenarios: `default`.
Public API coverage: 10/14
directly controlled; 4 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument        | Control | Default                                      | Test value                                               | Binding                          | Description                                       |
| --------------- | ------- | -------------------------------------------- | -------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| `selected`      | boolean | `false`                                      | `true`                                                   | fixture interaction              | Shows the checked state.                          |
| `indeterminate` | boolean | `false`                                      | `true`                                                   | input `indeterminate` (property) | Shows a mixed selection state.                    |
| `disabled`      | boolean | `false`                                      | `true`                                                   | input `disabled` (property)      | Prevents user interaction.                        |
| `readOnly`      | boolean | `false`                                      | `true`                                                   | input `readonly` (property)      | Keeps the value focusable while preventing edits. |
| `required`      | boolean | `false`                                      | `true`                                                   | input `required` (property)      | Marks the control as required.                    |
| `invalid`       | boolean | `false`                                      | `true`                                                   | input `invalid` (property)       | Exposes the invalid visual and ARIA state.        |
| `checked`       | boolean | `false`                                      | `true`                                                   | input `checked` (property)       | Configures the component checked contract.        |
| `description`   | text    | `"Receive a summary every Monday at 09:00."` | `"Receive a summary every Monday at 09:00. · alternate"` | input `description` (property)   | Configures the component description contract.    |
| `id`            | text    | `""`                                         | `"Alternate value"`                                      | input `id` (property)            | Configures the component id contract.             |
| `tabindex`      | number  | `0`                                          | `1`                                                      | input `tabindex` (property)      | Configures the component tabindex contract.       |
| `value`         | text    | `"Example value"`                            | `"Example value · alternate"`                            | input `value` (property)         | Controlled component value.                       |

Exact API exclusions:

| Public API        | Category           | Evidence                                                             | Reason                                                                                                                  |
| ----------------- | ------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#checkbox`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#checkbox`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#checkbox`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `name`            | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#checkbox` | Form submission field names do not alter the rendered component and are covered by forms integration tests.             |

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
- `selected` — Selected; scenario `default`; `selected=true`.
- `unselected` — unselected; scenario `default`; `selected=false`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..
- `indeterminate` — Indeterminate; scenario `default`; `indeterminate=true`.

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
