# Alert Dialog

- ID: `alert-dialog`
- Selector: `krn-alert-dialog`
- Import: `import { KrnAlertDialog } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnAlertDialog`
- Lifecycle: **stable**
- Category: Feedback

Alert Dialog. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled destructive confirmation
 *
 * Require an explicit decision for a destructive action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAlertDialog } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-alert-dialog-agent-example',
  standalone: true,
  imports: [KrnAlertDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Archive customer</button>
    <krn-alert-dialog
      [(open)]="open"
      title="Archive customer"
      description="Archived customers are removed from active reporting."
      [closeOnOutside]="false"
    >
      <p>Archived customers are removed from active reporting.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-alert-dialog>
  `,
})
export class KernAlertDialogAgentExample {
  open = false;
}

void bootstrapApplication(KernAlertDialogAgentExample);
```

## API

| Name              | Kind   | Type                           | Required | Default            | Description                                                              |
| ----------------- | ------ | ------------------------------ | -------- | ------------------ | ------------------------------------------------------------------------ |
| `open`            | model  | `boolean`                      | no       | `false`            | Controls whether the disclosure or overlay surface is visible.           |
| `title`           | input  | `string`                       | no       | `''`               | Visible title that also names the component surface or data view.        |
| `description`     | input  | `string`                       | no       | `''`               | Visible supporting description for the component content.                |
| `eyebrow`         | input  | `string`                       | no       | `''`               | Human-readable copy for the eyebrow state or control.                    |
| `ariaLabel`       | input  | `string \| undefined`          | no       | `undefined`        | Accessible name used when visible content is not sufficient.             |
| `showClose`       | input  | `boolean`                      | no       | `true`             | Controls whether the component applies the show close behavior.          |
| `closeLabel`      | input  | `string \| undefined`          | no       | `undefined`        | Human-readable copy for the close state or control.                      |
| `closeOnEscape`   | input  | `boolean`                      | no       | `true`             | Allows Escape to dismiss the topmost owned overlay.                      |
| `closeOnOutside`  | input  | `boolean \| null`              | no       | `null`             | Allows an interaction outside the owned overlay to dismiss it.           |
| `initialFocus`    | input  | `string`                       | no       | `'first-tabbable'` | Identifies the element that receives focus when the modal surface opens. |
| `restoreFocus`    | input  | `HTMLElement \| false \| null` | no       | `null`             | Explicit focus return target, or `false` to disable focus restoration.   |
| `contentTemplate` | input  | `TemplateRef<unknown> \| null` | no       | `null`             | Template used to render the component body with its typed context.       |
| `actionsTemplate` | input  | `TemplateRef<unknown> \| null` | no       | `null`             | Template used to render product-owned actions in the designated slot.    |
| `closed`          | output | `KrnOverlayCloseReason`        | no       | `undefined`        | Notifies the consumer after the closed interaction completes.            |
| `afterExited`     | output | `void`                         | no       | `undefined`        | Emits after exit motion and global modal cleanup have completed.         |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.
- `[krnDialogAction]` — Projects content matching [krnDialogAction].

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
- nested
- dismissed

## Interactive playground

Route: `preview/alert-dialog`

Scenarios: `default`.
Public API coverage: 7/13
directly controlled; 6 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument         | Control | Default                           | Test value                                    | Binding                           | Description                                                                                      |
| ---------------- | ------- | --------------------------------- | --------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `open`           | boolean | `false`                           | `true`                                        | model `open`                      | Opens the destructive confirmation.                                                              |
| `closeOnOutside` | select  | `null`                            | `true`                                        | input `closeOnOutside` (property) | Inherits the surface policy by default, or explicitly enables or disables outside-click closing. |
| `closeOnEscape`  | boolean | `true`                            | `false`                                       | input `closeOnEscape` (property)  | Configures the component closeOnEscape contract.                                                 |
| `description`    | text    | `"This action cannot be undone."` | `"This action cannot be undone. · alternate"` | input `description` (property)    | Configures the component description contract.                                                   |
| `eyebrow`        | text    | `""`                              | `"Alternate value"`                           | input `eyebrow` (property)        | Configures the component eyebrow contract.                                                       |
| `showClose`      | boolean | `true`                            | `false`                                       | input `showClose` (property)      | Configures the component showClose contract.                                                     |
| `title`          | text    | `"Delete Northstar?"`             | `"Delete Northstar? · alternate"`             | input `title` (property)          | Configures the component title contract.                                                         |

Exact API exclusions:

| Public API        | Category           | Evidence                                                           | Reason                                                                                                                                                               |
| ----------------- | ------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actionsTemplate` | template           | `component-example:agent/components/alert-dialog.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                           |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#alert-dialog`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `closeLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#alert-dialog`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `contentTemplate` | template           | `component-example:agent/components/alert-dialog.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                           |
| `initialFocus`    | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#alert-dialog`          | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.                                                        |
| `restoreFocus`    | complex-data       | `specimen-fixture:preview/alert-dialog?state=default`              | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                     |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `nested` — nested; scenario `default`; fixture effect `status/neutral` — nested: The fixture exposes the nested status without claiming a public component input..
- `dismissed` — dismissed; scenario `default`; `open=false`; fixture effect `status/neutral` — dismissed: The fixture exposes the dismissed status without claiming a public component input..

## Related

- `dialog`
- `confirmation-pattern`
- `alert`
- `banner`
- `toast`
- `tooltip`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use Alert Dialog only when an explicit decision is required before continuing.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
