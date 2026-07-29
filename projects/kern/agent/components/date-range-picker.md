# Date Range Picker

- ID: `date-range-picker`
- Selector: `krn-date-range-picker`
- Import: `import { KrnDateRangePicker } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnDateRangePicker`
- Lifecycle: **beta**
- Category: Forms

Date Range Picker. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use Date Range Picker when users must choose an ordered inclusive start and end plain-date interval.

Avoid: Use two independent Date Pickers only when the dates do not form one validated interval.

## Compile-verified standalone Angular example

```ts
/**
 * Typed reporting period
 *
 * Bind an explicit ISO start and end date range.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDateRangePicker, type KrnDateRangeValue } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-date-range-picker-agent-example',
  standalone: true,
  imports: [KrnDateRangePicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-date-range-picker
      ariaLabel="Reporting period"
      locale="en-GB"
      today="2026-07-29"
      [formControl]="control"
    />
  `,
})
export class KernDateRangePickerAgentExample {
  readonly control = new FormControl<KrnDateRangeValue>(
    { start: '2026-07-01', end: '2026-09-30' },
    { nonNullable: true },
  );
}

void bootstrapApplication(KernDateRangePickerAgentExample);
```

## API

| Name           | Kind   | Type                           | Required | Default                                    | Description                                                                 |
| -------------- | ------ | ------------------------------ | -------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `id`           | input  | `string`                       | no       | `''`                                       | Stable identifier value used by the id contract.                            |
| `ariaLabel`    | input  | `string`                       | no       | `''`                                       | Accessible name used when visible content is not sufficient.                |
| `locale`       | input  | `string`                       | no       | `inject(KRN_LOCALE)`                       | Locale identifier used for collation, formatting, and component-owned copy. |
| `today`        | input  | `string`                       | no       | `toIsoDate(new Date(this.platform.now()))` | Deterministic plain date treated as today on both server and client.        |
| `weekStartsOn` | input  | `number`                       | no       | `0`                                        | Zero-based weekday used as the first calendar column.                       |
| `labels`       | input  | `Partial<KrnDatePickerLabels>` | no       | `{}`                                       | Localized copy overrides for the component-owned interface text.            |
| `startLabel`   | input  | `string`                       | no       | `this.translations.datePicker.startDate`   | Human-readable copy for the start state or control.                         |
| `endLabel`     | input  | `string`                       | no       | `this.translations.datePicker.endDate`     | Human-readable copy for the end state or control.                           |
| `min`          | input  | `string`                       | no       | `''`                                       | Smallest accepted numeric or temporal value.                                |
| `max`          | input  | `string`                       | no       | `''`                                       | Largest accepted numeric or temporal value.                                 |
| `disabled`     | input  | `boolean`                      | no       | `false`                                    | Prevents user interaction and participates in the disabled-state contract.  |
| `readonly`     | input  | `boolean`                      | no       | `false`                                    | Keeps the value perceivable while preventing user edits.                    |
| `required`     | input  | `boolean`                      | no       | `false`                                    | Marks the value as required and participates in Angular Forms validation.   |
| `invalid`      | input  | `boolean`                      | no       | `false`                                    | Exposes an externally controlled invalid presentation state.                |
| `valueChange`  | output | `KrnDateRangeValue`            | no       | `undefined`                                | Notifies the consumer after the value change interaction completes.         |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `KrnDateRangeValue`.

## Accessibility

- Enter or Space opens the calendar and Escape closes it.
- Arrow, Home, End, Page Up, and Page Down move the calendar focus.
- Enter or Space selects the start, then the end, while keeping the interval visible.
- The current range phase and selected endpoints are announced.
- The calendar exposes grid position, disabled dates, today, and selected endpoints.
- The form value uses stable ISO plain dates and rejects an end before the start.

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
- `calendar`
- `time-picker`
- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not submit an end date before the start date.
- Use stable ISO plain-date values rather than parsing visible localized labels.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
