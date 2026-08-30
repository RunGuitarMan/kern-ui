# Calendar

- ID: `calendar`
- Selector: `krn-calendar`
- Import: `import { KrnCalendar } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnCalendar`
- Lifecycle: **stable**
- Category: Data display

Calendar. Displays a localized month grid and manages bounded date focus and selection.

## Use

Use Calendar for this specific contract: Displays a localized month grid and manages bounded date focus and selection.

Avoid: Do not choose Calendar for visual similarity alone; its semantics and interaction model must match the product task.

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
import { KrnCalendar } from '@kern-ui/angular/data-display';

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

| Name              | Kind   | Type                               | Required | Default             | Description                                                                 |
| ----------------- | ------ | ---------------------------------- | -------- | ------------------- | --------------------------------------------------------------------------- |
| `value`           | model  | `string`                           | no       | `''`                | Controlled component value.                                                 |
| `activeMonth`     | model  | `string`                           | no       | `''`                | Controlled active month state with a matching Angular model-change output.  |
| `min`             | input  | `string`                           | no       | `''`                | Smallest accepted numeric or temporal value.                                |
| `max`             | input  | `string`                           | no       | `''`                | Largest accepted numeric or temporal value.                                 |
| `disabledDates`   | input  | `ReadonlySet<string>`              | no       | `new Set<string>()` | Controls whether the component applies the disabled dates behavior.         |
| `locale`          | input  | `string \| undefined`              | no       | `undefined`         | Locale identifier used for collation, formatting, and component-owned copy. |
| `labels`          | input  | `Partial<KrnCalendarTranslations>` | no       | `{}`                | Localized copy overrides for the component-owned interface text.            |
| `weekStartsOn`    | input  | `0 \| 1`                           | no       | `1`                 | Zero-based weekday used as the first calendar column.                       |
| `today`           | input  | `string`                           | no       | `''`                | Deterministic plain date treated as today on both server and client.        |
| `showTodayAction` | input  | `boolean`                          | no       | `true`              | Controls whether the component applies the show today action behavior.      |
| `dateSelected`    | output | `string`                           | no       | `undefined`         | Notifies the consumer after the date selected interaction completes.        |
| `focusedDate`     | model  | `string`                           | no       | `''`                | Controlled focused date state with a matching Angular model-change output.  |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys move the focused date; Page keys change month
- Home and End move within the week; Enter or Space selects the date
- Visible labels and semantic structure preserve the meaning and relationships in the data.
- Interactive descendants retain native names and a predictable focus order.

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
- minimum
- maximum

## Interactive playground

Route: `preview/calendar`

Scenarios: `default`.
Public API coverage: 8/11
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument          | Control | Default        | Test value          | Binding                            | Description                                                            |
| ----------------- | ------- | -------------- | ------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `activeMonth`     | text    | `"2026-07"`    | `"2026-08"`         | model `activeMonth`                | Changes the visible ISO calendar month.                                |
| `focusedDate`     | text    | `""`           | `"2026-08-15"`      | model `focusedDate`                | Changes the roving-focus ISO date.                                     |
| `value`           | text    | `""`           | `"Alternate value"` | model `value`                      | Changes the selected ISO date.                                         |
| `max`             | text    | `""`           | `"2026-11-30"`      | input `max` (property)             | Largest accepted numeric or temporal value.                            |
| `min`             | text    | `""`           | `"2026-02-01"`      | input `min` (property)             | Smallest accepted numeric or temporal value.                           |
| `showTodayAction` | boolean | `true`         | `false`             | input `showTodayAction` (property) | Controls whether the component applies the show today action behavior. |
| `today`           | text    | `"2026-07-26"` | `"2026-08-15"`      | input `today` (property)           | Deterministic plain date treated as today on both server and client.   |
| `weekStartsOn`    | select  | `1`            | `0`                 | input `weekStartsOn` (property)    | Zero-based weekday used as the first calendar column.                  |

Exact API exclusions:

| Public API      | Category           | Evidence                                          | Reason                                                                                                                  |
| --------------- | ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `disabledDates` | complex-data       | `specimen-fixture:preview/calendar?state=default` | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `labels`        | translation-object | `locale-preview:preview/calendar?locale=ru-RU`    | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                     |
| `locale`        | locale-environment | `locale-preview:preview/calendar?locale=ru-RU`    | Locale is owned by the playground environment selector so every locale-sensitive component changes consistently.        |

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
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `minimum` — minimum; scenario `default`; fixture effect `status/neutral` — minimum: The fixture exposes the minimum status without claiming a public component input..
- `maximum` — maximum; scenario `default`; fixture effect `status/neutral` — maximum: The fixture exposes the maximum status without claiming a public component input..

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
