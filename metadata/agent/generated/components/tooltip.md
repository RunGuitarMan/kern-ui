# Tooltip

- ID: `tooltip`
- Selector: `[krnTooltip]`
- Import: `import { KrnTooltip } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTooltip`
- Lifecycle: **stable**
- Category: Feedback

Tooltip. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Accessible abbreviated-action tooltip
 *
 * Supplement an already named control with concise hover and focus guidance.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTooltip } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tooltip-agent-example',
  standalone: true,
  imports: [KrnTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      aria-label="Download audit report"
      krnTooltip="Download audit report"
      krnTooltipPosition="below"
    >
      ↓
    </button>
  `,
})
export class KernTooltipAgentExample {}

void bootstrapApplication(KernTooltipAgentExample);
```

## API

| Name                  | Kind  | Type                                        | Required | Default   | Description                                                        |
| --------------------- | ----- | ------------------------------------------- | -------- | --------- | ------------------------------------------------------------------ |
| `krnTooltip`          | input | `string`                                    | no       | `''`      | Human-readable copy for the text state or control.                 |
| `krnTooltipShowDelay` | input | `number`                                    | no       | `400`     | Controls whether the component applies the show delay behavior.    |
| `krnTooltipHideDelay` | input | `number`                                    | no       | `80`      | Controls whether the component applies the hide delay behavior.    |
| `krnTooltipPosition`  | input | `"above" \| "after" \| "before" \| "below"` | no       | `'above'` | Logical placement of the component relative to its owning surface. |

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

Route: `preview/tooltip`

Scenarios: `default`.
Public API coverage: 4/4
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument    | Control | Default              | Test value                       | Binding                                | Description                                         |
| ----------- | ------- | -------------------- | -------------------------------- | -------------------------------------- | --------------------------------------------------- |
| `text`      | text    | `"Copy public link"` | `"Copy public link · alternate"` | input `krnTooltip` (property)          | Sets the concise tooltip content.                   |
| `position`  | select  | `"above"`            | `"below"`                        | input `krnTooltipPosition` (property)  | Chooses the preferred placement around the trigger. |
| `showDelay` | number  | `400`                | `450`                            | input `krnTooltipShowDelay` (property) | Delays opening in milliseconds.                     |
| `hideDelay` | number  | `80`                 | `100`                            | input `krnTooltipHideDelay` (property) | Delays closing in milliseconds.                     |

Exact API exclusions:

_No excluded public API members._

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
- `nested` — nested; scenario `default`; fixture effect `status/neutral` — nested: The fixture exposes the nested status without claiming a public component input..
- `dismissed` — dismissed; scenario `default`; fixture effect `status/neutral` — dismissed: The fixture exposes the dismissed status without claiming a public component input..

## Related

- `popover`
- `hover-card`
- `alert`
- `banner`
- `toast`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Never place essential or interactive content only inside a Tooltip.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
