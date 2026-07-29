# Drawer

- ID: `drawer`
- Selector: `krn-drawer`
- Import: `import { KrnDrawer } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnDrawer`
- Lifecycle: **beta**
- Category: Feedback

Drawer. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use Drawer for a focused modal workflow whose spatial relationship is naturally anchored to a viewport side.

Avoid: Do not use a modal Drawer as permanent application navigation; use Sidebar or Navigation Rail.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled details drawer
 *
 * Show supporting record details without replacing list context.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDrawer } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-drawer-agent-example',
  standalone: true,
  imports: [KrnDrawer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Customer details</button>
    <krn-drawer
      [(open)]="open"
      title="Customer details"
      description="Review contacts, contracts and account ownership."
    >
      <p>Review contacts, contracts and account ownership.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-drawer>
  `,
})
export class KernDrawerAgentExample {
  open = false;
}

void bootstrapApplication(KernDrawerAgentExample);
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

- Tab and Shift+Tab stay inside the open drawer.
- Escape closes the topmost dismissible drawer.
- Focus returns to the drawer opener.
- The drawer exposes modal dialog semantics and a visible title.
- Logical start/end placement remains correct in LTR and RTL.
- Nested overlays preserve deterministic Escape ordering and focus restoration.

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

## Related

- `dialog`
- `bottom-sheet`
- `settings-panel`
- `alert`
- `banner`
- `toast`
- `tooltip`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not use a modal Drawer for persistent page navigation.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
