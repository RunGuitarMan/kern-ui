# Success State

- ID: `success-state`
- Selector: `krn-success-state`
- Import: `import { KrnSuccessState } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSuccessState`
- Lifecycle: **stable**
- Category: Feedback

Success State. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Completed import state
 *
 * Confirm completion and identify the next useful destination.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSuccessState } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-success-state-agent-example',
  standalone: true,
  imports: [KrnSuccessState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-success-state
      title="Import complete"
      description="100 customers were added without errors."
    >
      <a href="/customers">Review customers</a>
    </krn-success-state>
  `,
})
export class KernSuccessStateAgentExample {}

void bootstrapApplication(KernSuccessStateAgentExample);
```

## API

| Name          | Kind  | Type              | Required | Default                                        | Description                                                                      |
| ------------- | ----- | ----------------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `title`       | input | `string`          | no       | `this.translations.feedback.successStateTitle` | Visible title that also names the component surface or data view.                |
| `description` | input | `string`          | no       | `''`                                           | Visible supporting description for the component content.                        |
| `tone`        | input | `KrnFeedbackTone` | no       | `'success'`                                    | Semantic intent that selects coordinated text, icon, border, and surface tokens. |

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
- with next action
- without action

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
