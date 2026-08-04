# Progress Bar

- ID: `progress-bar`
- Selector: `krn-progress-bar`
- Import: `import { KrnProgressBar } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnProgressBar`
- Lifecycle: **stable**
- Category: Feedback

Progress Bar. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Deterministic import progress
 *
 * Communicate known progress with a stable accessible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnProgressBar } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-progress-bar-agent-example',
  standalone: true,
  imports: [KrnProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-progress-bar
      ariaLabel="Customer import progress"
      [value]="processed"
      [max]="total"
      valueText="68 of 100 customers"
    />
  `,
})
export class KernProgressBarAgentExample {
  processed = 68;

  readonly total = 100;
}

void bootstrapApplication(KernProgressBarAgentExample);
```

## API

| Name            | Kind  | Type                  | Required | Default     | Description                                                      |
| --------------- | ----- | --------------------- | -------- | ----------- | ---------------------------------------------------------------- |
| `value`         | input | `number`              | no       | `0`         | Controlled component value.                                      |
| `max`           | input | `number`              | no       | `100`       | Largest accepted numeric or temporal value.                      |
| `indeterminate` | input | `boolean`             | no       | `false`     | Represents an unknown progress value or a mixed selection state. |
| `ariaLabel`     | input | `string \| undefined` | no       | `undefined` | Accessible name used when visible content is not sufficient.     |
| `valueText`     | input | `string`              | no       | `''`        | Human-readable copy for the value state or control.              |

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

Route: `preview/progress-bar`

Scenarios: `default`.
Public API coverage: 4/5
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument        | Control | Default | Test value          | Binding                          | Description                                             |
| --------------- | ------- | ------- | ------------------- | -------------------------------- | ------------------------------------------------------- |
| `value`         | range   | `68`    | `69`                | input `value` (property)         | Sets determinate completion.                            |
| `max`           | number  | `100`   | `101`               | input `max` (property)           | Sets the completion scale maximum.                      |
| `indeterminate` | boolean | `false` | `true`              | input `indeterminate` (property) | Shows progress without a known value.                   |
| `valueText`     | text    | `""`    | `"Alternate value"` | input `valueText` (property)     | Overrides the computed accessible progress description. |

Exact API exclusions:

| Public API  | Category           | Evidence                                                  | Reason                                                                                                                  |
| ----------- | ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#progress-bar` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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
