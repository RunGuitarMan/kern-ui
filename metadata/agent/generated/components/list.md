# List

- ID: `list`
- Selector: `krn-list`
- Import: `import { KrnList } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnList`
- Lifecycle: **stable**
- Category: Data display

List. Provides semantic structure and spacing for a related sequence of items.

## Use

Use List for this specific contract: Provides semantic structure and spacing for a related sequence of items.

Avoid: Do not choose List for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Selected customer list
 *
 * Compose semantic list items and expose current selection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnList, KrnListItem } from '@kern-ui/angular/data-display';

@Component({
  selector: 'app-kern-list-agent-example',
  standalone: true,
  imports: [KrnList, KrnListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-list role="listbox" ariaLabel="Customers">
      <krn-list-item heading="Acme Europe" [selected]="true"> Enterprise · Healthy </krn-list-item>
      <krn-list-item heading="Globex">Commercial · Review needed</krn-list-item>
    </krn-list>
  `,
})
export class KernListAgentExample {}

void bootstrapApplication(KernListAgentExample);
```

## API

| Name        | Kind  | Type                  | Required | Default     | Description                                                  |
| ----------- | ----- | --------------------- | -------- | ----------- | ------------------------------------------------------------ |
| `role`      | input | `"list" \| "listbox"` | no       | `'list'`    | Defines the component's role behavior or presentation.       |
| `ariaLabel` | input | `string \| undefined` | no       | `undefined` | Accessible name used when visible content is not sufficient. |

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

## Interactive playground

Route: `preview/list`

Scenarios: `default`.
Public API coverage: 1/2
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default  | Test value  | Binding                 | Description                                         |
| -------- | ------- | -------- | ----------- | ----------------------- | --------------------------------------------------- |
| `role`   | select  | `"list"` | `"listbox"` | input `role` (property) | Switches between static-list and listbox semantics. |

Exact API exclusions:

| Public API  | Category           | Evidence                                          | Reason                                                                                                                  |
| ----------- | ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#list` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.

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
