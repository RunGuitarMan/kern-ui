# Empty State

- ID: `empty-state`
- Selector: `krn-empty-state`
- Import: `import { KrnEmptyState } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnEmptyState`
- Lifecycle: **stable**
- Category: Feedback

Empty State. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Empty customer portfolio
 *
 * Explain the absence of records and provide a next action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnEmptyState } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-empty-state-agent-example',
  standalone: true,
  imports: [KrnEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-empty-state
      title="No customers yet"
      description="Create the first customer to start tracking renewals."
    >
      <button type="button">Create customer</button>
    </krn-empty-state>
  `,
})
export class KernEmptyStateAgentExample {}

void bootstrapApplication(KernEmptyStateAgentExample);
```

## API

| Name          | Kind  | Type              | Required | Default                                      | Description                                                                      |
| ------------- | ----- | ----------------- | -------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| `title`       | input | `string`          | no       | `this.translations.feedback.emptyStateTitle` | Visible title that also names the component surface or data view.                |
| `description` | input | `string`          | no       | `''`                                         | Visible supporting description for the component content.                        |
| `tone`        | input | `KrnFeedbackTone` | no       | `'neutral'`                                  | Semantic intent that selects coordinated text, icon, border, and surface tokens. |

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
- with action
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
