# Rating

- ID: `rating`
- Selector: `krn-rating`
- Import: `import { KrnRating } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnRating`
- Lifecycle: **stable**
- Category: Data display

Rating. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled customer rating
 *
 * Keep the selected numeric rating in application state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRating } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-rating-agent-example',
  standalone: true,
  imports: [KrnRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-rating ariaLabel="Customer satisfaction" [max]="5" [(value)]="rating" /> `,
})
export class KernRatingAgentExample {
  rating = 4;
}

void bootstrapApplication(KernRatingAgentExample);
```

## API

| Name        | Kind  | Type      | Required | Default                                | Description                                                                |
| ----------- | ----- | --------- | -------- | -------------------------------------- | -------------------------------------------------------------------------- |
| `value`     | model | `number`  | no       | `0`                                    | Controlled component value.                                                |
| `max`       | input | `number`  | no       | `5`                                    | Largest accepted numeric or temporal value.                                |
| `disabled`  | input | `boolean` | no       | `false`                                | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`  | input | `boolean` | no       | `false`                                | Keeps the value perceivable while preventing user edits.                   |
| `ariaLabel` | input | `string`  | no       | `this.translations.dataDisplay.rating` | Accessible name used when visible content is not sufficient.               |

## Deprecated selectors

_No deprecated selectors._

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
- readonly
- minimum
- maximum

## Interactive playground

Route: `preview/rating`

Scenarios: `default`.
Public API coverage: 4/5
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default | Test value | Binding                     | Description                                                               |
| ---------- | ------- | ------- | ---------- | --------------------------- | ------------------------------------------------------------------------- |
| `value`    | number  | `4`     | `5`        | model `value`               | Changes the selected rating.                                              |
| `disabled` | boolean | `false` | `true`     | input `disabled` (property) | Prevents interaction and participates in the component disabled contract. |
| `max`      | number  | `5`     | `6`        | input `max` (property)      | Configures the component max contract.                                    |
| `readonly` | boolean | `false` | `true`     | input `readonly` (property) | Configures the component readonly contract.                               |

Exact API exclusions:

| Public API  | Category           | Evidence                                            | Reason                                                                                                                  |
| ----------- | ------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#rating` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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
- `readonly` — readonly; scenario `default`; fixture effect `status/neutral` — readonly: The fixture exposes the readonly status without claiming a public component input..
- `minimum` — minimum; scenario `default`; fixture effect `status/neutral` — minimum: The fixture exposes the minimum status without claiming a public component input..
- `maximum` — maximum; scenario `default`; fixture effect `status/neutral` — maximum: The fixture exposes the maximum status without claiming a public component input..

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

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
