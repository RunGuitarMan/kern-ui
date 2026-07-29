# Loading Overlay

- ID: `loading-overlay`
- Selector: `krn-loading-overlay`
- Import: `import { KrnLoadingOverlay } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnLoadingOverlay`
- Lifecycle: **stable**
- Category: Feedback

Loading Overlay. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled blocking save state
 *
 * Keep existing content perceivable while a blocking operation is active.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLoadingOverlay } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-loading-overlay-agent-example',
  standalone: true,
  imports: [KrnLoadingOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-loading-overlay [active]="saving" [blocking]="true" label="Saving customer">
      <section>
        <h2>Customer profile</h2>
        <button type="button" (click)="saving = !saving">Toggle save state</button>
      </section>
    </krn-loading-overlay>
  `,
})
export class KernLoadingOverlayAgentExample {
  saving = false;
}

void bootstrapApplication(KernLoadingOverlayAgentExample);
```

## API

| Name       | Kind  | Type      | Required | Default                                        | Description                                                                  |
| ---------- | ----- | --------- | -------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `active`   | input | `boolean` | no       | `false`                                        | Marks the item as the current interaction target without implying selection. |
| `blocking` | input | `boolean` | no       | `true`                                         | Marks feedback as requiring attention before the workflow can continue.      |
| `label`    | input | `string`  | no       | `this.translations.feedback.loadingInProgress` | Visible text that names the control or data value.                           |

## Content slots

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
- loading

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
