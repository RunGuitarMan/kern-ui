# Tag

- ID: `tag`
- Selector: `krn-tag`
- Import: `import { KrnTag } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnChip`
- Lifecycle: **stable**
- Category: Data display

Tag. Displays a compact removable label for a user- or system-assigned value.

## Use

Use Tag for this specific contract: Displays a compact removable label for a user- or system-assigned value.

Avoid: Do not choose Tag for visual similarity alone; its semantics and interaction model must match the product task.

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
import { KrnTag } from '@kern-ui/angular/data-display';

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

| Name              | Kind   | Type                  | Required | Default     | Description                                                                |
| ----------------- | ------ | --------------------- | -------- | ----------- | -------------------------------------------------------------------------- |
| `selected`        | model  | `boolean`             | no       | `false`     | Controlled selected state, distinct from keyboard focus.                   |
| `interactive`     | input  | `boolean`             | no       | `false`     | Defines the component's interactive behavior or presentation.              |
| `removable`       | input  | `boolean`             | no       | `false`     | Defines the component's removable behavior or presentation.                |
| `disabled`        | input  | `boolean`             | no       | `false`     | Prevents user interaction and participates in the disabled-state contract. |
| `accessibleLabel` | input  | `string \| undefined` | no       | `undefined` | Human-readable copy for the accessible state or control.                   |
| `remove`          | output | `void`                | no       | `undefined` | Notifies the consumer after the remove interaction completes.              |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Visible labels and semantic structure preserve the meaning and relationships in the data.
- Interactive descendants retain native names and a predictable focus order.

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
