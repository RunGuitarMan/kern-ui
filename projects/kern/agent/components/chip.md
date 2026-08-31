# Chip

- ID: `chip`
- Selector: `krn-chip`
- Import: `import { KrnChip } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnChip`
- Lifecycle: **stable**
- Category: Data display

Chip. Displays a compact value that can be selected without becoming a form-control option.

## Use

Use Chip for this specific contract: Displays a compact value that can be selected without becoming a form-control option.

Avoid: Do not choose Chip for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled removable filter chip
 *
 * Keep selected filter state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnChip } from '@kern-ui/angular/data-display';

@Component({
  selector: 'app-kern-chip-agent-example',
  standalone: true,
  imports: [KrnChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-chip
      [interactive]="true"
      [removable]="true"
      accessibleLabel="Enterprise filter"
      [(selected)]="selected"
    >
      Enterprise
    </krn-chip>
  `,
})
export class KernChipAgentExample {
  selected = true;
}

void bootstrapApplication(KernChipAgentExample);
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

Route: `preview/chip`

Scenarios: `default`.
Public API coverage: 4/5
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default | Test value | Binding                        | Description                           |
| ------------- | ------- | ------- | ---------- | ------------------------------ | ------------------------------------- |
| `interactive` | boolean | `true`  | `false`    | input `interactive` (property) | Renders the label as a toggle action. |
| `selected`    | boolean | `true`  | `false`    | model `selected`               | Shows the selected treatment.         |
| `removable`   | boolean | `false` | `true`     | input `removable` (property)   | Shows a remove action.                |
| `disabled`    | boolean | `false` | `true`     | input `disabled` (property)    | Prevents user interaction.            |

Exact API exclusions:

| Public API        | Category           | Evidence                                          | Reason                                                                                                                                                               |
| ----------------- | ------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessibleLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#chip` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `selected` — selected; scenario `default`; `selected=true`; fixture effect `status/neutral` — selected: The fixture exposes the selected status without claiming a public component input..
- `unselected` — Unselected; scenario `default`; `selected=false`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `static` — Static; scenario `default`; `interactive=false`.
- `removable` — Removable; scenario `default`; `removable=true`.

## Related

- `badge`
- `status-badge`
- `tag`
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
