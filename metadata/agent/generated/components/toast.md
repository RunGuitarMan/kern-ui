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
- closed
- open

## Interactive playground

Route: `preview/toast`

Scenarios: `default`.
Public API coverage: 4/6
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default     | Test value    | Binding                        | Description                                    |
| ------------- | ------- | ----------- | ------------- | ------------------------------ | ---------------------------------------------- |
| `expanded`    | boolean | `false`     | `true`        | model `expanded`               | Expands the toast viewport stack.              |
| `maxExpanded` | number  | `12`        | `13`          | input `maxExpanded` (property) | Configures the component maxExpanded contract. |
| `maxVisible`  | number  | `4`         | `5`           | input `maxVisible` (property)  | Configures the component maxVisible contract.  |
| `position`    | select  | `"top-end"` | `"top-start"` | input `position` (property)    | Configures the component position contract.    |

Exact API exclusions:

| Public API  | Category           | Evidence                                           | Reason                                                                                                                  |
| ----------- | ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#toast` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `labels`    | translation-object | `locale-preview:preview/toast?locale=ru-RU`        | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                     |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `closed` — closed; scenario `default`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — open; scenario `default`; fixture effect `status/info` — open: The fixture exposes the open status without claiming a public component input..

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
