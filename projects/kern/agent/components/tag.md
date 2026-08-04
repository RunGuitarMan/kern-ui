# Tag

- ID: `tag`
- Selector: `krn-tag`
- Import: `import { KrnTag } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnChip`
- Lifecycle: **stable**
- Category: Data display

Tag. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled tag alias
 *
 * Use the tag alias for removable classification metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTag } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tag-agent-example',
  standalone: true,
  imports: [KrnTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tag
      [interactive]="true"
      [removable]="true"
      accessibleLabel="Renewal Q3 tag"
      [(selected)]="selected"
    >
      Renewal Q3
    </krn-tag>
  `,
})
export class KernTagAgentExample {
  selected = true;
}

void bootstrapApplication(KernTagAgentExample);
```

## API

| Name              | Kind   | Type                  | Required | Default     | Description                                                                   |
| ----------------- | ------ | --------------------- | -------- | ----------- | ----------------------------------------------------------------------------- |
| `selected`        | model  | `boolean`             | no       | `false`     | Controlled selected state, distinct from keyboard focus.                      |
| `interactive`     | input  | `boolean`             | no       | `false`     | Enables the documented user interaction for an otherwise presentational item. |
| `removable`       | input  | `boolean`             | no       | `false`     | Displays a named action for removing the represented value.                   |
| `disabled`        | input  | `boolean`             | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.    |
| `accessibleLabel` | input  | `string \| undefined` | no       | `undefined` | Accessible name for the complete composite widget.                            |
| `remove`          | output | `void`                | no       | `undefined` | Notifies the consumer after the remove interaction completes.                 |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

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
- disabled
- selected
- unselected

## Interactive playground

Route: `preview/tag`

Scenarios: `default`.
Public API coverage: 4/5
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default | Test value | Binding                        | Description                           |
| ------------- | ------- | ------- | ---------- | ------------------------------ | ------------------------------------- |
| `interactive` | boolean | `false` | `true`     | input `interactive` (property) | Renders the label as a toggle action. |
| `selected`    | boolean | `false` | `true`     | model `selected`               | Shows the selected treatment.         |
| `removable`   | boolean | `true`  | `false`    | input `removable` (property)   | Shows a remove action.                |
| `disabled`    | boolean | `false` | `true`     | input `disabled` (property)    | Prevents user interaction.            |

Exact API exclusions:

| Public API        | Category           | Evidence                                         | Reason                                                                                                                                                               |
| ----------------- | ------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessibleLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tag` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `selected` — Selected; scenario `default`; `selected=true`.
- `unselected` — unselected; scenario `default`; `selected=false`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `interactive` — Interactive; scenario `default`; `interactive=true`.
- `fixed` — Fixed; scenario `default`; `removable=false`.

## Related

- `chip`
- `badge`
- `status-badge`
- `avatar`

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
