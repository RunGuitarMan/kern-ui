# Line Chart

- ID: `line-chart`
- Selector: `krn-line-chart`
- Import: `import { KrnLineChart } from '@kern-ui/angular/addon-charts';`
- Canonical symbol: `KrnLineChart`
- Lifecycle: **beta**
- Category: Data display

Line Chart. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use Line Chart for an ordered trend where direction and change over adjacent values are the primary task.

Avoid: Use Bar Chart for unordered category comparison and a table when exact values dominate.

## Compile-verified standalone Angular example

```ts
/**
 * Typed monthly revenue line chart
 *
 * Provide stable datum identity and explicit accessible chart context.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLineChart, type KrnChartDatum } from '@kern-ui/angular/addon-charts';

@Component({
  selector: 'app-kern-line-chart-agent-example',
  standalone: true,
  imports: [KrnLineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-line-chart
      title="Monthly recurring revenue"
      description="Revenue for the current quarter"
      [data]="revenue"
    />
  `,
})
export class KernLineChartAgentExample {
  readonly revenue: readonly KrnChartDatum[] = [
    { id: 'jul', label: 'July', value: 1420000 },
    { id: 'aug', label: 'August', value: 1570000 },
    { id: 'sep', label: 'September', value: 1800000 },
  ];
}

void bootstrapApplication(KernLineChartAgentExample);
```

## API

| Name                  | Kind  | Type                             | Required | Default                                                  | Description                                                                               |
| --------------------- | ----- | -------------------------------- | -------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `title`               | input | `string`                         | yes      | `required`                                               | Visible title that also names the component surface or data view.                         |
| `eyebrow`             | input | `string`                         | no       | `''`                                                     | Human-readable copy for the eyebrow state or control.                                     |
| `description`         | input | `string`                         | no       | `''`                                                     | Visible supporting description for the component content.                                 |
| `data`                | input | `ReadonlyArray<KrnChartDatum>`   | yes      | `required`                                               | Immutable data supplied by the consumer.                                                  |
| `palette`             | input | `ReadonlyArray<string>`          | no       | `['var(--krn-chart-1, #4f6feb)']`                        | Ordered semantic color values available to the color control.                             |
| `locale`              | input | `string \| Array<string>`        | no       | `inject(KRN_LOCALE)`                                     | Locale identifier used for collation, formatting, and component-owned copy.               |
| `labels`              | input | `Partial<KrnChartLabels>`        | no       | `{}`                                                     | Localized copy overrides for the component-owned interface text.                          |
| `valueFormatter`      | input | `KrnChartValueFormatter \| null` | no       | `null`                                                   | Formats a domain value for visible and accessible presentation.                           |
| `percentFormatter`    | input | `KrnChartValueFormatter \| null` | no       | `null`                                                   | Formats a normalized value for visible and accessible percentage copy.                    |
| `datumIdentity`       | input | `KrnChartDatumIdentity`          | no       | `(datum, index) => datum.id ?? (datum.label \|\| index)` | Returns a stable unique key used to preserve DOM and active state across data reordering. |
| `negativeValuePolicy` | input | `KrnChartNegativeValuePolicy`    | no       | `'clamp'`                                                | Clamps negative values to zero by default or rejects them with a validation error.        |
| `summaryItemLimit`    | input | `number`                         | no       | `12`                                                     | Limits the accessible text summary while the full data table remains available.           |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab reaches the source-data toggle, then the single roving data mark.
- Arrow Left and Arrow Right move between marks and reverse in RTL.
- Home and End move to the first and last mark; Enter or Space discloses its value.
- The chart has a specific title and keyboard-operable data marks.
- A semantic source-data table exposes the same ordered labels and values.
- Focus treatment and value details supplement line geometry and color.

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

## Interactive playground

Route: `preview/line-chart`

Scenarios: `default`, `states`, `stress`.
Public API coverage: 5/12
directly controlled; 7 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument              | Control | Default                         | Test value                                  | Binding                                | Description                                            |
| --------------------- | ------- | ------------------------------- | ------------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| `title`               | text    | `"Weekly active users"`         | `"Weekly active users · alternate"`         | input `title` (property)               | Sets the visible chart title.                          |
| `description`         | text    | `"Unique members, last 6 days"` | `"Unique members, last 6 days · alternate"` | input `description` (property)         | Adds concise context for the dataset.                  |
| `summaryItemLimit`    | number  | `12`                            | `13`                                        | input `summaryItemLimit` (property)    | Limits items in the accessible data summary.           |
| `eyebrow`             | text    | `"THROUGHPUT"`                  | `"THROUGHPUT · alternate"`                  | input `eyebrow` (property)             | Configures the component eyebrow contract.             |
| `negativeValuePolicy` | select  | `"clamp"`                       | `"reject"`                                  | input `negativeValuePolicy` (property) | Configures the component negativeValuePolicy contract. |

Exact API exclusions:

| Public API         | Category           | Evidence                                                         | Reason                                                                                                                  |
| ------------------ | ------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `data`             | complex-data       | `specimen-fixture:preview/line-chart?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `datumIdentity`    | callback           | `component-example:agent/components/line-chart.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `labels`           | translation-object | `locale-preview:preview/line-chart?locale=ru-RU`                 | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                     |
| `locale`           | complex-data       | `specimen-fixture:preview/line-chart?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `palette`          | complex-data       | `specimen-fixture:preview/line-chart?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `percentFormatter` | callback           | `component-example:agent/components/line-chart.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `valueFormatter`   | callback           | `component-example:agent/components/line-chart.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `stress`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `stress`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — hover; scenario `default`; fixture effect `status/neutral` — hover: The fixture exposes the hover status without claiming a public component input..
- `focus-visible` — focus-visible; scenario `default`; fixture effect `status/neutral` — focus-visible: The fixture exposes the focus visible status without claiming a public component input..
- `active` — active; scenario `default`; fixture effect `status/neutral` — active: The fixture exposes the active status without claiming a public component input..
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `stress` — Stress data; scenario `stress`.
- `interactive-order` — Interactive order; scenario `states`.

## Related

- `bar-chart`
- `donut-chart`
- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `title`, `data`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Provide a specific title and meaningful labels; visual marks are not the only data representation.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
