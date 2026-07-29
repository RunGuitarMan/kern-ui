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
