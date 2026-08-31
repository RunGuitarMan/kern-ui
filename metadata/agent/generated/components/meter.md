# Meter

- ID: `meter`
- Selector: `krn-meter`
- Import: `import { KrnMeter } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnMeter`
- Lifecycle: **stable**
- Category: Data display

Meter. Shows a scalar measurement within known bounds and interprets low, high, and optimum ranges.

## Use

Use Meter for this specific contract: Shows a scalar measurement within known bounds and interprets low, high, and optimum ranges.

Avoid: Do not choose Meter for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Account health meter
 *
 * Communicate a bounded value with visible label and thresholds.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMeter } from '@kern-ui/angular/data-display';

@Component({
  selector: 'app-kern-meter-agent-example',
  standalone: true,
  imports: [KrnMeter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-meter label="Account health" [value]="82" [min]="0" [max]="100" [low]="40" [high]="75" />
  `,
})
export class KernMeterAgentExample {}

void bootstrapApplication(KernMeterAgentExample);
```

## API

| Name      | Kind  | Type                                   | Required | Default     | Description                                                                 |
| --------- | ----- | -------------------------------------- | -------- | ----------- | --------------------------------------------------------------------------- |
| `locale`  | input | `Array<string> \| string \| undefined` | no       | `undefined` | Locale identifier used for collation, formatting, and component-owned copy. |
| `label`   | input | `string`                               | yes      | `required`  | Visible text that names the control or data value.                          |
| `value`   | input | `number`                               | yes      | `required`  | Controlled component value.                                                 |
| `min`     | input | `number`                               | no       | `0`         | Smallest accepted numeric or temporal value.                                |
| `max`     | input | `number`                               | no       | `100`       | Largest accepted numeric or temporal value.                                 |
| `low`     | input | `number`                               | no       | `25`        | Defines the component's low behavior or presentation.                       |
| `high`    | input | `number`                               | no       | `75`        | Defines the component's high behavior or presentation.                      |
| `optimum` | input | `number`                               | no       | `100`       | Defines the component's optimum behavior or presentation.                   |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
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
- minimum
- maximum
- partial

## Interactive playground

Route: `preview/meter`

Scenarios: `default`.
Public API coverage: 7/8
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument  | Control | Default          | Test value                   | Binding                    | Description                               |
| --------- | ------- | ---------------- | ---------------------------- | -------------------------- | ----------------------------------------- |
| `value`   | range   | `68`             | `69`                         | input `value` (property)   | Sets the current measured value.          |
| `min`     | number  | `0`              | `1`                          | input `min` (property)     | Sets the lower bound.                     |
| `max`     | number  | `100`            | `101`                        | input `max` (property)     | Sets the upper bound.                     |
| `low`     | number  | `40`             | `41`                         | input `low` (property)     | Sets the low-range threshold.             |
| `high`    | number  | `80`             | `81`                         | input `high` (property)    | Sets the high-range threshold.            |
| `optimum` | number  | `20`             | `21`                         | input `optimum` (property) | Sets the preferred value.                 |
| `label`   | text    | `"Storage used"` | `"Storage used · alternate"` | input `label` (property)   | Names the meter for assistive technology. |

Exact API exclusions:

| Public API | Category     | Evidence                                       | Reason                                                                                                                  |
| ---------- | ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `locale`   | complex-data | `specimen-fixture:preview/meter?state=default` | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `minimum` — Minimum; scenario `default`; `value=0`.
- `maximum` — Maximum; scenario `default`; `value=100`.
- `partial` — Partial; scenario `default`; `value=50`.

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `label`, `value`.
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
