# Menubar

- ID: `menubar`
- Selector: `krn-menubar`
- Import: `import { KrnMenubar } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnMenubar`
- Lifecycle: **stable**
- Category: Navigation

Menubar. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed application menubar
 *
 * Expose a compact keyboard-oriented application menu.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMenubar, type KrnNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-menubar-agent-example',
  standalone: true,
  imports: [KrnMenubar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-menubar ariaLabel="Application menu" [items]="items" /> `,
})
export class KernMenubarAgentExample {
  readonly items: readonly KrnNavigationItem[] = [
    { id: 'customers', label: 'Customers', href: '/customers' },
    { id: 'reports', label: 'Reports', href: '/reports' },
  ];
}

void bootstrapApplication(KernMenubarAgentExample);
```

## API

| Name           | Kind   | Type                               | Required | Default                                        | Description                                                          |
| -------------- | ------ | ---------------------------------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| `items`        | input  | `ReadonlyArray<KrnNavigationItem>` | no       | `[]`                                           | Ordered item collection rendered by the composite widget.            |
| `ariaLabel`    | input  | `string`                           | no       | `this.translations.navigation.applicationMenu` | Accessible name used when visible content is not sufficient.         |
| `itemSelected` | output | `KrnNavigationItem`                | no       | `undefined`                                    | Notifies the consumer after the item selected interaction completes. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

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

## Interactive playground

Route: `preview/menubar`

Scenarios: `default`.
Public API coverage: 0/2
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument    | Control | Default     | Test value  | Binding      | Description                                     |
| ----------- | ------- | ----------- | ----------- | ------------ | ----------------------------------------------- |
| `itemState` | select  | `"default"` | `"current"` | fixture data | Changes the deterministic menubar item fixture. |

Exact API exclusions:

| Public API  | Category           | Evidence                                             | Reason                                                                                                                  |
| ----------- | ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#menubar` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `items`     | complex-data       | `specimen-fixture:preview/menubar?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

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
