# Dialog

- ID: `dialog`
- Selector: `krn-dialog`
- Import: `import { KrnDialog } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnDialog`
- Lifecycle: **beta**
- Category: Feedback

Dialog. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use Dialog for a focused modal decision or form that must temporarily block interaction with the page.

Avoid: Use Popover for non-modal supplemental content and a route when the task needs durable navigation or deep linking.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled edit dialog
 *
 * Open and close a modal dialog through application-owned state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDialog } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-dialog-agent-example',
  standalone: true,
  imports: [KrnDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Edit customer</button>
    <krn-dialog
      [(open)]="open"
      title="Edit customer"
      description="Update customer ownership and renewal details."
    >
      <p>Update customer ownership and renewal details.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-dialog>
  `,
})
export class KernDialogAgentExample {
  open = false;
}

void bootstrapApplication(KernDialogAgentExample);
```

## API

| Name              | Kind   | Type                           | Required | Default                             | Description                                                              |
| ----------------- | ------ | ------------------------------ | -------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `open`            | model  | `boolean`                      | no       | `false`                             | Controls whether the disclosure or overlay surface is visible.           |
| `title`           | input  | `string`                       | no       | `''`                                | Visible title that also names the component surface or data view.        |
| `description`     | input  | `string`                       | no       | `''`                                | Visible supporting description for the component content.                |
| `eyebrow`         | input  | `string`                       | no       | `''`                                | Human-readable copy for the eyebrow state or control.                    |
| `ariaLabel`       | input  | `string`                       | no       | `this.translations.feedback.dialog` | Accessible name used when visible content is not sufficient.             |
| `showClose`       | input  | `boolean`                      | no       | `true`                              | Controls whether the component applies the show close behavior.          |
| `closeLabel`      | input  | `string`                       | no       | `this.translations.feedback.close`  | Human-readable copy for the close state or control.                      |
| `closeOnEscape`   | input  | `boolean`                      | no       | `true`                              | Allows Escape to dismiss the topmost owned overlay.                      |
| `closeOnOutside`  | input  | `boolean \| null`              | no       | `null`                              | Allows an interaction outside the owned overlay to dismiss it.           |
| `initialFocus`    | input  | `string`                       | no       | `'first-tabbable'`                  | Identifies the element that receives focus when the modal surface opens. |
| `contentTemplate` | input  | `TemplateRef<unknown> \| null` | no       | `null`                              | Template used to render the component body with its typed context.       |
| `actionsTemplate` | input  | `TemplateRef<unknown> \| null` | no       | `null`                              | Template used to render product-owned actions in the designated slot.    |
| `closed`          | output | `KrnOverlayCloseReason`        | no       | `undefined`                         | Notifies the consumer after the closed interaction completes.            |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab and Shift+Tab stay inside the topmost modal surface.
- Escape closes the topmost dismissible dialog.
- Focus returns to the element that opened the dialog.
- The surface exposes modal dialog semantics with a visible title and optional description.
- Initial focus never lands on an inert or hidden element.
- Nested overlays register ownership for deterministic Escape and focus restoration.

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

Route: `preview/dialog`

Scenarios: `default`.
Public API coverage: 7/12
directly controlled; 5 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument         | Control | Default                            | Test value                                     | Binding                           | Description                                                                                      |
| ---------------- | ------- | ---------------------------------- | ---------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `title`          | text    | `"Edit workspace"`                 | `"Edit workspace · alternate"`                 | input `title` (property)          | Sets the dialog heading.                                                                         |
| `description`    | text    | `"Changes apply to every member."` | `"Changes apply to every member. · alternate"` | input `description` (property)    | Sets the dialog description.                                                                     |
| `open`           | boolean | `false`                            | `true`                                         | model `open`                      | Opens the modal surface.                                                                         |
| `showClose`      | boolean | `true`                             | `false`                                        | input `showClose` (property)      | Shows the close icon action.                                                                     |
| `closeOnEscape`  | boolean | `true`                             | `false`                                        | input `closeOnEscape` (property)  | Allows Escape to dismiss the dialog.                                                             |
| `closeOnOutside` | select  | `null`                             | `true`                                         | input `closeOnOutside` (property) | Inherits the surface policy by default, or explicitly enables or disables outside-click closing. |
| `eyebrow`        | text    | `""`                               | `"Alternate value"`                            | input `eyebrow` (property)        | Configures the component eyebrow contract.                                                       |

Exact API exclusions:

| Public API        | Category           | Evidence                                                     | Reason                                                                                                                                                              |
| ----------------- | ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actionsTemplate` | template           | `component-example:agent/components/dialog.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                          |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#dialog`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                             |
| `closeLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#dialog`          | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `contentTemplate` | template           | `component-example:agent/components/dialog.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                          |
| `initialFocus`    | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#dialog`          | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.                                                       |

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

- `alert-dialog`
- `drawer`
- `bottom-sheet`
- `popover`
- `alert`
- `banner`
- `toast`
- `tooltip`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Keep the trigger available so focus can be restored after close.
- Register ownership when a custom CDK overlay opens from inside the dialog.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
