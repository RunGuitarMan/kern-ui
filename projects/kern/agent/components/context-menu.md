# Context Menu

- ID: `context-menu`
- Selector: `krn-context-menu`
- Import: `import { KrnContextMenu } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnContextMenu`
- Lifecycle: **stable**
- Category: Navigation

Context Menu. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed row context actions
 *
 * Provide nested context actions with stable ids.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnContextMenu, type KrnContextMenuItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-context-menu-agent-example',
  standalone: true,
  imports: [KrnContextMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-context-menu ariaLabel="Customer row actions" [items]="items">
      <button type="button">Open row actions</button>
    </krn-context-menu>
  `,
})
export class KernContextMenuAgentExample {
  readonly items: readonly KrnContextMenuItem[] = [
    { id: 'open', label: 'Open customer' },
    {
      id: 'export',
      label: 'Export',
      children: [
        { id: 'export-csv', label: 'CSV' },
        { id: 'export-json', label: 'JSON' },
      ],
    },
  ];
}

void bootstrapApplication(KernContextMenuAgentExample);
```

## API

| Name           | Kind   | Type                                | Required | Default                                       | Description                                                          |
| -------------- | ------ | ----------------------------------- | -------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `items`        | input  | `ReadonlyArray<KrnContextMenuItem>` | no       | `[]`                                          | Ordered item collection rendered by the composite widget.            |
| `ariaLabel`    | input  | `string`                            | no       | `this.translations.navigation.contextActions` | Accessible name used when visible content is not sufficient.         |
| `itemSelected` | output | `KrnContextMenuItem`                | no       | `undefined`                                   | Notifies the consumer after the item selected interaction completes. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys move within composites
- Home / End jump
- Enter activates
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
- current
- closed
- open
- nested
- dismissed

## Interactive playground

Route: `preview/context-menu`

Scenarios: `default`.
Public API coverage: 0/2
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default | Test value | Binding             | Description                     |
| -------- | ------- | ------- | ---------- | ------------------- | ------------------------------- |
| `open`   | boolean | `false` | `true`     | fixture interaction | Opens the context-menu fixture. |

Exact API exclusions:

| Public API  | Category           | Evidence                                                  | Reason                                                                                                                  |
| ----------- | ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#context-menu` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `items`     | complex-data       | `specimen-fixture:preview/context-menu?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

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
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `current` — current; scenario `default`; fixture effect `status/neutral` — current: The fixture exposes the current status without claiming a public component input..
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `nested` — nested; scenario `default`; fixture effect `status/neutral` — nested: The fixture exposes the nested status without claiming a public component input..
- `dismissed` — dismissed; scenario `default`; `open=false`; fixture effect `status/neutral` — dismissed: The fixture exposes the dismissed status without claiming a public component input..

## Related

- `breadcrumbs`
- `tabs`
- `vertical-tabs`
- `pagination`

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
