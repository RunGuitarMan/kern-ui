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

| Name              | Kind   | Type      | Required | Default            | Description                                                                                      |
| ----------------- | ------ | --------- | -------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`  | no       | `''`               | Stable identifier value used by the id contract.                                                 |
| `value`           | input  | `string`  | yes      | `required`         | Controlled component value.                                                                      |
| `name`            | input  | `string`  | no       | `this.generatedId` | Required human-readable name for the represented person, item, or action.                        |
| `checked`         | input  | `boolean` | no       | `false`            | Controlled checked state rendered by the native choice control.                                  |
| `ariaLabel`       | input  | `string`  | no       | `''`               | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`  | input  | `string`  | no       | `''`               | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`  | no       | `''`               | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `description`     | input  | `string`  | no       | `''`               | Visible supporting description for the component content.                                        |
| `disabled`        | input  | `boolean` | no       | `false`            | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean` | no       | `false`            | Keeps the value perceivable while preventing user edits.                                         |
| `tabindex`        | input  | `number`  | no       | `0`                | Native sequential-focus order forwarded to the owned interactive element.                        |
| `selected`        | output | `string`  | no       | `undefined`        | Controlled selected state, distinct from keyboard focus.                                         |

## Deprecated selectors

_No deprecated selectors._

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
- readonly
- selected
- unselected

## Interactive playground

Route: `preview/radio`

Scenarios: `default`.
Public API coverage: 7/11
directly controlled; 4 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                         | Test value                                  | Binding                        | Description                                       |
| ------------- | ------- | ------------------------------- | ------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| `selected`    | boolean | `false`                         | `true`                                      | fixture interaction            | Selects the annual billing option.                |
| `disabled`    | boolean | `false`                         | `true`                                      | input `disabled` (property)    | Prevents user interaction.                        |
| `readOnly`    | boolean | `false`                         | `true`                                      | input `readonly` (property)    | Keeps the value focusable while preventing edits. |
| `checked`     | boolean | `false`                         | `true`                                      | input `checked` (property)     | Configures the component checked contract.        |
| `description` | text    | `"Flexible, billed each month"` | `"Flexible, billed each month · alternate"` | input `description` (property) | Configures the component description contract.    |
| `id`          | text    | `""`                            | `"Alternate value"`                         | input `id` (property)          | Configures the component id contract.             |
| `tabindex`    | number  | `0`                             | `1`                                         | input `tabindex` (property)    | Configures the component tabindex contract.       |
| `value`       | text    | `"monthly"`                     | `"monthly · alternate"`                     | input `value` (property)       | Controlled component value.                       |

Exact API exclusions:

| Public API        | Category           | Evidence                                                          | Reason                                                                                                                  |
| ----------------- | ------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#radio`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#radio`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#radio`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `name`            | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#radio` | Form submission field names do not alter the rendered component and are covered by forms integration tests.             |

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
- `selected` — Selected; scenario `default`; `selected=true`.
- `unselected` — unselected; scenario `default`; `selected=false`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..

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
