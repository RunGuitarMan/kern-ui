# Skip Link

- ID: `skip-link`
- Selector: `krn-skip-link`
- Import: `import { KrnSkipLink } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSkipLink`
- Lifecycle: **stable**
- Category: Navigation

Skip Link. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Main-content skip link
 *
 * Give keyboard users a direct route past repeated navigation.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSkipLink } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-skip-link-agent-example',
  standalone: true,
  imports: [KrnSkipLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-skip-link targetId="main-content" label="Skip to account details" />
    <main id="main-content" tabindex="-1">Account details</main>
  `,
})
export class KernSkipLinkAgentExample {}

void bootstrapApplication(KernSkipLinkAgentExample);
```

## API

| Name        | Kind   | Type     | Required | Default                                          | Description                                                      |
| ----------- | ------ | -------- | -------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `targetId`  | input  | `string` | no       | `'main-content'`                                 | Stable identifier value used by the target contract.             |
| `label`     | input  | `string` | no       | `this.translations.navigation.skipToMainContent` | Visible text that names the control or data value.               |
| `activated` | output | `void`   | no       | `undefined`                                      | Notifies the consumer after the activated interaction completes. |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys move within composites
- Home / End jump
- Enter activates
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
- current

## Related

- `breadcrumbs`
- `tabs`
- `vertical-tabs`
- `pagination`

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
