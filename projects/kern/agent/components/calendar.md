# Calendar

- ID: `calendar`
- Selector: `krn-calendar`
- Import: `import { KrnCalendar } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCalendar`
- Lifecycle: **stable**
- Category: Data display

Calendar. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled renewal calendar
 *
 * Own ISO date, active month and focus state with stable disabled dates.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCalendar } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-calendar-agent-example',
  standalone: true,
  imports: [KrnCalendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-calendar
      ariaLabel="Renewal calendar"
      locale="en-GB"
      today="2026-07-29"
      [disabledDates]="disabledDates"
      [(value)]="selectedDate"
      [(activeMonth)]="activeMonth"
      [(focusedDate)]="focusedDate"
    />
  `,
})
export class KernCalendarAgentExample {
  selectedDate = '2026-08-14';

  activeMonth = '2026-08';

  focusedDate = '2026-08-14';

  readonly disabledDates: ReadonlySet<string> = new Set(['2026-08-16']);
}

void bootstrapApplication(KernCalendarAgentExample);
```

## API

| Name              | Kind   | Type                               | Required | Default              | Description                                                                 |
| ----------------- | ------ | ---------------------------------- | -------- | -------------------- | --------------------------------------------------------------------------- |
| `value`           | model  | `string`                           | no       | `''`                 | Controlled component value.                                                 |
| `activeMonth`     | model  | `string`                           | no       | `''`                 | Controlled active month state with a matching Angular model-change output.  |
| `min`             | input  | `string`                           | no       | `''`                 | Smallest accepted numeric or temporal value.                                |
| `max`             | input  | `string`                           | no       | `''`                 | Largest accepted numeric or temporal value.                                 |
| `disabledDates`   | input  | `ReadonlySet<string>`              | no       | `new Set<string>()`  | Returns whether a plain date is unavailable for selection.                  |
| `locale`          | input  | `string`                           | no       | `inject(KRN_LOCALE)` | Locale identifier used for collation, formatting, and component-owned copy. |
| `labels`          | input  | `Partial<KrnCalendarTranslations>` | no       | `{}`                 | Localized copy overrides for the component-owned interface text.            |
| `weekStartsOn`    | input  | `0 \| 1`                           | no       | `1`                  | Zero-based weekday used as the first calendar column.                       |
| `today`           | input  | `string`                           | no       | `''`                 | Deterministic plain date treated as today on both server and client.        |
| `showTodayAction` | input  | `boolean`                          | no       | `true`               | Controls whether the component applies the show today action behavior.      |
| `dateSelected`    | output | `string`                           | no       | `undefined`          | Notifies the consumer after the date selected interaction completes.        |
| `focusedDate`     | model  | `string`                           | no       | `''`                 | Controlled focused date state with a matching Angular model-change output.  |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
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

## Related

- `date-picker`
- `date-range-picker`
- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not configure min after max.
- Provide deterministic today when server and client clocks or timezones may differ.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
