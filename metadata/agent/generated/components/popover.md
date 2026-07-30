# Popover

- ID: `popover`
- Selector: `krn-popover`
- Import: `import { KrnPopover } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnPopover`
- Lifecycle: **stable**
- Category: Feedback

Popover. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled contextual popover
 *
 * Compose trigger and content while keeping disclosure state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPopover } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-popover-agent-example',
  standalone: true,
  imports: [KrnPopover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-popover [(open)]="open" ariaLabel="Account health details">
      <span krnPopoverTrigger>Health details</span>
      <p>Three checks passed and one requires attention.</p>
    </krn-popover>
  `,
})
export class KernPopoverAgentExample {
  open = false;
}

void bootstrapApplication(KernPopoverAgentExample);
```

## API

| Name        | Kind   | Type                             | Required | Default                                      | Description                                                     |
| ----------- | ------ | -------------------------------- | -------- | -------------------------------------------- | --------------------------------------------------------------- |
| `open`      | model  | `boolean`                        | no       | `false`                                      | Controls whether the disclosure or overlay surface is visible.  |
| `ariaLabel` | input  | `string`                         | no       | `this.translations.feedback.moreInformation` | Accessible name used when visible content is not sufficient.    |
| `autoFocus` | input  | `boolean`                        | no       | `true`                                       | Controls whether the component applies the auto focus behavior. |
| `closed`    | output | `"escape" \| "outside" \| "api"` | no       | `undefined`                                  | Notifies the consumer after the closed interaction completes.   |

## Content slots

- `[krnPopoverTrigger]` — Required non-interactive label content projected into the Popover-owned trigger button; do not project a button, link, form control, or krn-button.
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

## Interactive playground

Route: `preview/popover`

Scenarios: `default`.
Public API coverage: 2/3
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument    | Control | Default | Test value | Binding                      | Description                                  |
| ----------- | ------- | ------- | ---------- | ---------------------------- | -------------------------------------------- |
| `open`      | boolean | `false` | `true`     | model `open`                 | Opens the popover surface.                   |
| `autoFocus` | boolean | `true`  | `false`    | input `autoFocus` (property) | Configures the component autoFocus contract. |

Exact API exclusions:

| Public API  | Category           | Evidence                                             | Reason                                                                                                                  |
| ----------- | ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#popover` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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

- `tooltip`
- `hover-card`
- `dialog`
- `alert`
- `banner`
- `toast`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use Tooltip for a short label and Dialog for a modal workflow.
- The krnPopoverTrigger slot is button label content; the Popover owns trigger semantics, focus, keyboard behavior, and ARIA state.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
