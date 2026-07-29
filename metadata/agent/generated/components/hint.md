# Hint

- ID: `hint`
- Selector: `krn-hint`
- Import: `import { KrnHint } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnHint`
- Lifecycle: **stable**
- Category: Forms

Hint. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Persistent field guidance
 *
 * Provide concise guidance that can be referenced by a control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnHint } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-hint-agent-example',
  standalone: true,
  imports: [KrnHint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-hint id="cost-center-hint">Use the six-digit finance code.</krn-hint> `,
})
export class KernHintAgentExample {}

void bootstrapApplication(KernHintAgentExample);
```

## API

| Name | Kind  | Type     | Required | Default | Description                                          |
| ---- | ----- | -------- | -------- | ------- | ---------------------------------------------------- |
| `id` | input | `string` | no       | `''`    | Stable identifier value used by the custom contract. |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses
- Arrow keys operate grouped controls
- Escape cancels transient UI
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

## Related

- `form-field`
- `label`
- `validation-message`
- `text-input`

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
