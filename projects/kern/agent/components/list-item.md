# List Item

- ID: `list-item`
- Selector: `krn-list-item`
- Import: `import { KrnListItem } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnListItem`
- Lifecycle: **stable**
- Category: Data display

List Item. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Customer list row
 *
 * Compose leading identity, text and trailing metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnListItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-list-item-agent-example',
  standalone: true,
  imports: [KrnListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-list-item heading="Acme Europe" [selected]="true">
      <span krnListLeading aria-hidden="true">AC</span>
      Enterprise account
      <span krnListTrailing>Healthy</span>
    </krn-list-item>
  `,
})
export class KernListItemAgentExample {}

void bootstrapApplication(KernListItemAgentExample);
```

## API

| Name       | Kind  | Type      | Required | Default | Description                                              |
| ---------- | ----- | --------- | -------- | ------- | -------------------------------------------------------- |
| `heading`  | input | `string`  | no       | `''`    | Human-readable copy for the heading state or control.    |
| `selected` | input | `boolean` | no       | `false` | Controlled selected state, distinct from keyboard focus. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnListLeading]` — Projects content matching [krnListLeading].
- `*` — Projects default component content.
- `[krnListTrailing]` — Projects content matching [krnListTrailing].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
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
- selected
- unselected

## Interactive playground

Route: `preview/list-item`

Scenarios: `default`.
Public API coverage: 2/2
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default                     | Test value                              | Binding                     | Description                                |
| ---------- | ------- | --------------------------- | --------------------------------------- | --------------------------- | ------------------------------------------ |
| `selected` | boolean | `false`                     | `true`                                  | input `selected` (property) | Shows the selected list-item state.        |
| `heading`  | text    | `"Quarterly audit package"` | `"Quarterly audit package · alternate"` | input `heading` (property)  | Configures the component heading contract. |

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
- `selected` — Selected; scenario `default`; `selected=true`.
- `unselected` — unselected; scenario `default`; `selected=false`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

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
