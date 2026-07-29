# Toast

- ID: `toast`
- Selector: `krn-toast`
- Import: `import { KrnToast } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnToastViewport`
- Lifecycle: **stable**
- Category: Feedback

Toast. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Application toast viewport
 *
 * Place one viewport and create notifications through the root service.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToast, KrnToastService } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toast-agent-example',
  standalone: true,
  imports: [KrnToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="notify()">Save report</button>
    <krn-toast [(expanded)]="expanded" position="top-end" />
  `,
})
export class KernToastAgentExample {
  private readonly toasts = inject(KrnToastService);

  expanded = false;

  notify(): void {
    this.toasts.success('Report saved', { title: 'Saved' });
  }
}

void bootstrapApplication(KernToastAgentExample);
```

## API

| Name          | Kind  | Type                            | Required | Default                             | Description                                                        |
| ------------- | ----- | ------------------------------- | -------- | ----------------------------------- | ------------------------------------------------------------------ |
| `position`    | input | `KrnToastPosition`              | no       | `'top-end'`                         | Logical placement of the component relative to its owning surface. |
| `maxVisible`  | input | `number`                        | no       | `4`                                 | Upper or lower bound applied to the visible value.                 |
| `maxExpanded` | input | `number`                        | no       | `12`                                | Upper or lower bound applied to the expanded value.                |
| `labels`      | input | `Partial<KrnToastTranslations>` | no       | `{}`                                | Localized copy overrides for the component-owned interface text.   |
| `ariaLabel`   | input | `string`                        | no       | `this.translations.toast.ariaLabel` | Accessible name used when visible content is not sufficient.       |
| `expanded`    | model | `boolean`                       | no       | `false`                             | Controlled expanded state for a disclosure or hierarchical item.   |

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

## Related

- `alert`
- `banner`
- `tooltip`
- `popover`

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
