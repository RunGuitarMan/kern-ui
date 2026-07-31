# Dropdown Button

- ID: `dropdown-button`
- Selector: `krn-dropdown-button`
- Import: `import { KrnDropdownButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnDropdownButton`
- Lifecycle: **stable**
- Category: Actions

Dropdown Button. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled bulk-action menu
 *
 * Expose keyboard-operable secondary actions with controlled state and scoped placement.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDropdownButton, provideKrnMenuButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-dropdown-button-agent-example',
  standalone: true,
  imports: [KrnDropdownButton],
  providers: [
    provideKrnMenuButtonOptions({
      menuAlign: 'start',
      matchTriggerWidth: true,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-dropdown-button [(open)]="open">
      <span krnLabel>Bulk actions</span>
      <button krnMenu type="button">Assign owner</button>
      <button krnMenu type="button">Archive</button>
    </krn-dropdown-button>
  `,
})
export class KernDropdownButtonAgentExample {
  open = false;
}

void bootstrapApplication(KernDropdownButtonAgentExample);
```

## API

| Name                | Kind  | Type               | Required | Default                          | Description                                                                         |
| ------------------- | ----- | ------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `size`              | input | `KrnSize`          | no       | `this.options.size`              | Named semantic size resolved through KERN density and sizing tokens.                |
| `variant`           | input | `KrnActionVariant` | no       | `this.options.variant`           | Named visual hierarchy treatment that preserves the component semantics.            |
| `tone`              | input | `KrnTone`          | no       | `this.options.tone`              | Semantic intent that selects coordinated text, icon, border, and surface tokens.    |
| `disabled`          | input | `boolean`          | no       | `false`                          | Prevents user interaction and participates in the disabled-state contract.          |
| `loading`           | input | `boolean`          | no       | `false`                          | Prevents duplicate actions and exposes accessible busy state.                       |
| `open`              | model | `boolean`          | no       | `false`                          | Controls whether the disclosure or overlay surface is visible.                      |
| `menuAlign`         | input | `KrnMenuAlignment` | no       | `this.options.menuAlign`         | Logical horizontal alignment used before the CDK collision fallbacks.               |
| `menuOffset`        | input | `number`           | no       | `this.options.menuOffset`        | Non-negative logical gap in CSS pixels between the trigger and menu.                |
| `matchTriggerWidth` | input | `boolean`          | no       | `this.options.matchTriggerWidth` | Makes the connected overlay exactly as wide as the complete trigger origin.         |
| `closeOnSelection`  | input | `boolean`          | no       | `true`                           | Closes after an enabled menu item activates; use the keep-open marker for one item. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnLabel]` — Projects content matching [krnLabel].
- `[krnMenu]` — Projects content matching [krnMenu].

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
- closed
- open
- nested
- dismissed
- loading

## Interactive playground

Route: `preview/dropdown-button`

Scenarios: `default`.
Public API coverage: 10/10
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument            | Control | Default   | Test value  | Binding                              | Description                                                                |
| ------------------- | ------- | --------- | ----------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `open`              | boolean | `false`   | `true`      | model `open`                         | Opens the dropdown action menu.                                            |
| `menuAlign`         | select  | `"end"`   | `"start"`   | input `menuAlign` (property)         | Aligns the connected menu to the logical start or end edge of the trigger. |
| `closeOnSelection`  | boolean | `true`    | `false`     | input `closeOnSelection` (property)  | Configures the component closeOnSelection contract.                        |
| `disabled`          | boolean | `false`   | `true`      | input `disabled` (property)          | Prevents interaction and participates in the component disabled contract.  |
| `loading`           | boolean | `false`   | `true`      | input `loading` (property)           | Prevents duplicate actions and exposes an accessible busy state.           |
| `matchTriggerWidth` | boolean | `false`   | `true`      | input `matchTriggerWidth` (property) | Configures the component matchTriggerWidth contract.                       |
| `menuOffset`        | number  | `8`       | `9`         | input `menuOffset` (property)        | Configures the component menuOffset contract.                              |
| `size`              | select  | `"md"`    | `"sm"`      | input `size` (property)              | Semantic component size.                                                   |
| `tone`              | select  | `"brand"` | `"neutral"` | input `tone` (property)              | Semantic intent; color is never the only state indicator.                  |
| `variant`           | select  | `"solid"` | `"soft"`    | input `variant` (property)           | Visual emphasis within the component hierarchy.                            |

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
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `nested` — nested; scenario `default`; fixture effect `status/neutral` — nested: The fixture exposes the nested status without claiming a public component input..
- `dismissed` — dismissed; scenario `default`; `open=false`; fixture effect `status/neutral` — dismissed: The fixture exposes the dismissed status without claiming a public component input..
- `loading` — Loading; scenario `default`; `loading=true`.

## Related

- `button`
- `icon-button`
- `button-group`
- `split-button`

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
