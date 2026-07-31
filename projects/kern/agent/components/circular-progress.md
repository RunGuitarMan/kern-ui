# Circular Progress

- ID: `circular-progress`
- Selector: `krn-circular-progress`
- Import: `import { KrnCircularProgress } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCircularProgress`
- Lifecycle: **stable**
- Category: Feedback

Circular Progress. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Compact sync progress
 *
 * Show known progress where horizontal space is constrained.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCircularProgress } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-circular-progress-agent-example',
  standalone: true,
  imports: [KrnCircularProgress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-circular-progress
      ariaLabel="Account sync progress"
      [value]="72"
      [max]="100"
      [showValue]="true"
    />
  `,
})
export class KernCircularProgressAgentExample {}

void bootstrapApplication(KernCircularProgressAgentExample);
```

## API

| Name            | Kind  | Type                      | Required | Default                               | Description                                                                 |
| --------------- | ----- | ------------------------- | -------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `value`         | input | `number`                  | no       | `0`                                   | Controlled component value.                                                 |
| `max`           | input | `number`                  | no       | `100`                                 | Largest accepted numeric or temporal value.                                 |
| `indeterminate` | input | `boolean`                 | no       | `false`                               | Represents an unknown progress value or a mixed selection state.            |
| `showValue`     | input | `boolean`                 | no       | `false`                               | Controls whether the component applies the show value behavior.             |
| `ariaLabel`     | input | `string`                  | no       | `this.translations.feedback.progress` | Accessible name used when visible content is not sufficient.                |
| `locale`        | input | `Array<string> \| string` | no       | `inject(KRN_LOCALE)`                  | Locale identifier used for collation, formatting, and component-owned copy. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Escape closes modal layers
- Focus returns to the trigger
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
- minimum
- maximum
- partial

## Interactive playground

Route: `preview/circular-progress`

Scenarios: `default`.
Public API coverage: 4/6
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument        | Control | Default | Test value | Binding                          | Description                           |
| --------------- | ------- | ------- | ---------- | -------------------------------- | ------------------------------------- |
| `value`         | range   | `68`    | `69`       | input `value` (property)         | Sets determinate completion.          |
| `max`           | number  | `100`   | `101`      | input `max` (property)           | Sets the completion scale maximum.    |
| `indeterminate` | boolean | `false` | `true`     | input `indeterminate` (property) | Shows progress without a known value. |
| `showValue`     | boolean | `true`  | `false`    | input `showValue` (property)     | Shows the formatted percentage.       |

Exact API exclusions:

| Public API  | Category           | Evidence                                                       | Reason                                                                                                                  |
| ----------- | ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#circular-progress` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `locale`    | complex-data       | `specimen-fixture:preview/circular-progress?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

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
- `indeterminate` — Indeterminate; scenario `default`; `indeterminate=true`.
- `value-hidden` — Value Hidden; scenario `default`; `showValue=false`.

## Related

- `alert`
- `banner`
- `toast`
- `tooltip`

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
