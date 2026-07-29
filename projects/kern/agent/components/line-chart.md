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
