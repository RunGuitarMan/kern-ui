# Toggle Button

- ID: `toggle-button`
- Selector: `krn-toggle-button`
- Import: `import { KrnToggleButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnToggleButton`
- Lifecycle: **stable**
- Category: Actions

Toggle Button. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled formatting toggle
 *
 * Keep the pressed state in application-owned state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toggle-button-agent-example',
  standalone: true,
  imports: [KrnToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-toggle-button value="bold" [(pressed)]="boldEnabled">Bold</krn-toggle-button> `,
})
export class KernToggleButtonAgentExample {
  boldEnabled = false;
}

void bootstrapApplication(KernToggleButtonAgentExample);
```

## API

| Name       | Kind  | Type      | Required | Default    | Description                                                                     |
| ---------- | ----- | --------- | -------- | ---------- | ------------------------------------------------------------------------------- |
| `value`    | input | `string`  | yes      | `required` | Controlled component value.                                                     |
| `size`     | input | `KrnSize` | no       | `'md'`     | Named semantic size resolved through KERN density and sizing tokens.            |
| `disabled` | input | `boolean` | no       | `false`    | Prevents user interaction and participates in the disabled-state contract.      |
| `pressed`  | model | `boolean` | no       | `false`    | Controlled toggle-button pressed state exposed through native button semantics. |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Enter / Space activates
- Tab follows document order
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
- selected
- unselected

## Interactive playground

Route: `preview/toggle-button`

Scenarios: `default`.
Public API coverage: 4/4
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default   | Test value            | Binding                     | Description                 |
| ---------- | ------- | --------- | --------------------- | --------------------------- | --------------------------- |
| `disabled` | boolean | `false`   | `true`                | input `disabled` (property) | Prevents user interaction.  |
| `selected` | boolean | `false`   | `true`                | model `pressed`             | Selects the action.         |
| `size`     | select  | `"md"`    | `"sm"`                | input `size` (property)     | Semantic component size.    |
| `value`    | text    | `"watch"` | `"watch · alternate"` | input `value` (property)    | Controlled component value. |

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
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `selected` — Selected; scenario `default`; `selected=true`.
- `unselected` — unselected; scenario `default`; `selected=false`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..

## Related

- `button`
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `value`.
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
