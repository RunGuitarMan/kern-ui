# Date Picker

- ID: `date-picker`
- Selector: `krn-date-picker`
- Import: `import { KrnDatePicker } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnDatePicker`
- Lifecycle: **beta**
- Category: Forms

Date Picker. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use Date Picker for one locale-formatted plain date while preserving an ISO YYYY-MM-DD domain value.

Avoid: Use Date Range Picker for an interval and a native date input only when platform behavior is the explicit requirement.

## Compile-verified standalone Angular example

```ts
/**
 * Typed renewal date
 *
 * Bind an ISO date string with explicit locale and reference date.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDatePicker } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-date-picker-agent-example',
  standalone: true,
  imports: [KrnDatePicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-date-picker
      ariaLabel="Renewal date"
      locale="en-GB"
      today="2026-07-29"
      [formControl]="control"
    />
  `,
})
export class KernDatePickerAgentExample {
  readonly control = new FormControl<string>('2026-10-15', { nonNullable: true });
}

void bootstrapApplication(KernDatePickerAgentExample);
```

## API

| Name              | Kind   | Type                           | Required | Default                                    | Description                                                                                      |
| ----------------- | ------ | ------------------------------ | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`                       | no       | `''`                                       | Stable identifier value used by the id contract.                                                 |
| `ariaLabel`       | input  | `string`                       | no       | `''`                                       | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`  | input  | `string`                       | no       | `''`                                       | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`                       | no       | `''`                                       | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `locale`          | input  | `string`                       | no       | `inject(KRN_LOCALE)`                       | Locale identifier used for collation, formatting, and component-owned copy.                      |
| `today`           | input  | `string`                       | no       | `toIsoDate(new Date(this.platform.now()))` | Deterministic plain date treated as today on both server and client.                             |
| `weekStartsOn`    | input  | `number`                       | no       | `0`                                        | Zero-based weekday used as the first calendar column.                                            |
| `labels`          | input  | `Partial<KrnDatePickerLabels>` | no       | `{}`                                       | Localized copy overrides for the component-owned interface text.                                 |
| `min`             | input  | `string`                       | no       | `''`                                       | Smallest accepted numeric or temporal value.                                                     |
| `max`             | input  | `string`                       | no       | `''`                                       | Largest accepted numeric or temporal value.                                                      |
| `disabled`        | input  | `boolean`                      | no       | `false`                                    | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`                      | no       | `false`                                    | Keeps the value perceivable while preventing user edits.                                         |
| `required`        | input  | `boolean`                      | no       | `false`                                    | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`         | input  | `boolean`                      | no       | `false`                                    | Exposes an externally controlled invalid presentation state.                                     |
| `tabindex`        | input  | `number`                       | no       | `0`                                        | Native sequential-focus order forwarded to the owned interactive element.                        |
| `value`           | input  | `string \| undefined`          | no       | `undefined`                                | Controlled component value.                                                                      |
| `open`            | model  | `boolean`                      | no       | `false`                                    | Controls whether the disclosure or overlay surface is visible.                                   |
| `valueChange`     | output | `string`                       | no       | `undefined`                                | Notifies the consumer after the value change interaction completes.                              |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

## Accessibility

- Enter or Space opens the calendar and Escape closes it.
- Arrow keys move by day; Home and End move within the week.
- Page Up and Page Down move by month; Enter or Space selects the focused date.
- The trigger exposes dialog expansion and the calendar uses grid semantics.
- Month changes, disabled dates, selected date, and today remain perceivable.
- Locale formatting never changes the ISO plain-date form value.

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
- closed
- open
- minimum
- maximum
- empty results
- async loading

## Interactive playground

Route: `preview/date-picker`

Scenarios: `default`.
Public API coverage: 12/17
directly controlled; 5 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default        | Test value          | Binding                         | Description                                       |
| -------------- | ------- | -------------- | ------------------- | ------------------------------- | ------------------------------------------------- |
| `min`          | text    | `"2026-01-01"` | `"2026-02-01"`      | input `min` (property)          | Sets the first selectable ISO date.               |
| `max`          | text    | `"2027-12-31"` | `"2026-11-30"`      | input `max` (property)          | Sets the last selectable ISO date.                |
| `weekStartsOn` | number  | `1`            | `2`                 | input `weekStartsOn` (property) | Uses 0 for Sunday through 6 for Saturday.         |
| `disabled`     | boolean | `false`        | `true`              | input `disabled` (property)     | Prevents user interaction.                        |
| `readOnly`     | boolean | `false`        | `true`              | input `readonly` (property)     | Keeps the value focusable while preventing edits. |
| `required`     | boolean | `false`        | `true`              | input `required` (property)     | Marks the control as required.                    |
| `invalid`      | boolean | `false`        | `true`              | input `invalid` (property)      | Exposes the invalid visual and ARIA state.        |
| `id`           | text    | `""`           | `"Alternate value"` | input `id` (property)           | Configures the component id contract.             |
| `open`         | boolean | `false`        | `true`              | model `open`                    | Controlled disclosure or overlay state.           |
| `tabindex`     | number  | `0`            | `1`                 | input `tabindex` (property)     | Configures the component tabindex contract.       |
| `today`        | text    | `"2026-07-30"` | `"2026-08-15"`      | input `today` (property)        | Configures the component today contract.          |
| `value`        | text    | `""`           | `"Alternate value"` | input `value` (property)        | Controlled component value.                       |

Exact API exclusions:

| Public API        | Category           | Evidence                                                 | Reason                                                                                                                  |
| ----------------- | ------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#date-picker` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#date-picker` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#date-picker` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `labels`          | translation-object | `locale-preview:preview/date-picker?locale=ru-RU`        | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                     |
| `locale`          | locale-environment | `locale-preview:preview/date-picker?locale=ru-RU`        | Locale is owned by the playground environment selector so every locale-sensitive component changes consistently.        |

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
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `minimum` — minimum; scenario `default`; fixture effect `status/neutral` — minimum: The fixture exposes the minimum status without claiming a public component input..
- `maximum` — maximum; scenario `default`; fixture effect `status/neutral` — maximum: The fixture exposes the maximum status without claiming a public component input..
- `empty-results` — empty results; scenario `default`; fixture effect `data/empty` — empty results: The fixture data source returned no records..
- `async-loading` — async loading; scenario `default`; fixture effect `status/info` — async loading: The fixture exposes the async loading status without claiming a public component input..

## Related

- `calendar`
- `date-range-picker`
- `time-picker`
- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Pass ISO plain-date values (YYYY-MM-DD), not locale-formatted display strings.
- Keep min, max, disabled dates, locale and deterministic today consistent between server and client.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
