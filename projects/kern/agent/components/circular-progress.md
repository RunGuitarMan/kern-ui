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
| `locale`        | input | `string \| Array<string>` | no       | `inject(KRN_LOCALE)`                  | Locale identifier used for collation, formatting, and component-owned copy. |

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
- partial
- maximum

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
