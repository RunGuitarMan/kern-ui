# Hover Card

- ID: `hover-card`
- Selector: `krn-hover-card`
- Import: `import { KrnHoverCard } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnHoverCard`
- Lifecycle: **stable**
- Category: Feedback

Hover Card. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Account preview hover card
 *
 * Provide supplemental preview content through the component-owned focusable trigger.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnHoverCard } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-hover-card-agent-example',
  standalone: true,
  imports: [KrnHoverCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-hover-card ariaLabel="Acme Europe preview">
      <span krnHoverCardTrigger>Acme Europe</span>
      <strong>Acme Europe</strong>
      <p>Enterprise · Renewal 15 October</p>
    </krn-hover-card>
  `,
})
export class KernHoverCardAgentExample {}

void bootstrapApplication(KernHoverCardAgentExample);
```

## API

| Name         | Kind  | Type     | Required | Default                              | Description                                                         |
| ------------ | ----- | -------- | -------- | ------------------------------------ | ------------------------------------------------------------------- |
| `ariaLabel`  | input | `string` | no       | `this.translations.feedback.preview` | Accessible name used when visible content is not sufficient.        |
| `openDelay`  | input | `number` | no       | `350`                                | Delay in milliseconds before the transient surface becomes visible. |
| `closeDelay` | input | `number` | no       | `120`                                | Controls whether the component applies the close delay behavior.    |

## Content slots

- `[krnHoverCardTrigger]` — Required non-interactive label content projected into the Hover Card-owned trigger button; do not project a button, link, form control, or krn-button.
- `*` — Projects default component content.

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
- Uses the shared deterministic KERN id service.

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
- closed
- open
- nested
- dismissed

## Related

- `popover`
- `tooltip`
- `alert`
- `banner`
- `toast`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- The krnHoverCardTrigger slot is button label content; the Hover Card owns trigger semantics, focus, keyboard behavior, and ARIA state.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
