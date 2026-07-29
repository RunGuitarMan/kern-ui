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

| Name           | Kind   | Type                           | Required | Default                                    | Description                                                                 |
| -------------- | ------ | ------------------------------ | -------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `id`           | input  | `string`                       | no       | `''`                                       | Stable identifier value used by the id contract.                            |
| `ariaLabel`    | input  | `string`                       | no       | `''`                                       | Accessible name used when visible content is not sufficient.                |
| `locale`       | input  | `string`                       | no       | `inject(KRN_LOCALE)`                       | Locale identifier used for collation, formatting, and component-owned copy. |
| `today`        | input  | `string`                       | no       | `toIsoDate(new Date(this.platform.now()))` | Deterministic plain date treated as today on both server and client.        |
| `weekStartsOn` | input  | `number`                       | no       | `0`                                        | Zero-based weekday used as the first calendar column.                       |
| `labels`       | input  | `Partial<KrnDatePickerLabels>` | no       | `{}`                                       | Localized copy overrides for the component-owned interface text.            |
| `min`          | input  | `string`                       | no       | `''`                                       | Smallest accepted numeric or temporal value.                                |
| `max`          | input  | `string`                       | no       | `''`                                       | Largest accepted numeric or temporal value.                                 |
| `disabled`     | input  | `boolean`                      | no       | `false`                                    | Prevents user interaction and participates in the disabled-state contract.  |
| `readonly`     | input  | `boolean`                      | no       | `false`                                    | Keeps the value perceivable while preventing user edits.                    |
| `required`     | input  | `boolean`                      | no       | `false`                                    | Marks the value as required and participates in Angular Forms validation.   |
| `invalid`      | input  | `boolean`                      | no       | `false`                                    | Exposes an externally controlled invalid presentation state.                |
| `valueChange`  | output | `string`                       | no       | `undefined`                                | Notifies the consumer after the value change interaction completes.         |

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
- closed
- open
- empty results
- async loading

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
