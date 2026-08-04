# Breadcrumbs

- ID: `breadcrumbs`
- Selector: `krn-breadcrumbs`
- Import: `import { KrnBreadcrumbs } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnBreadcrumbs`
- Lifecycle: **stable**
- Category: Navigation

Breadcrumbs. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed account breadcrumbs
 *
 * Describe hierarchy with a typed immutable breadcrumb collection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBreadcrumbs, type KrnBreadcrumbItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-breadcrumbs-agent-example',
  standalone: true,
  imports: [KrnBreadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-breadcrumbs [items]="items" ariaLabel="Account location" /> `,
})
export class KernBreadcrumbsAgentExample {
  readonly items: readonly KrnBreadcrumbItem[] = [
    { label: 'Customers', href: '/customers' },
    { label: 'Acme Europe', current: true },
  ];
}

void bootstrapApplication(KernBreadcrumbsAgentExample);
```

## API

| Name            | Kind   | Type                               | Required | Default     | Description                                                           |
| --------------- | ------ | ---------------------------------- | -------- | ----------- | --------------------------------------------------------------------- |
| `items`         | input  | `ReadonlyArray<KrnBreadcrumbItem>` | no       | `[]`        | Ordered item collection rendered by the composite widget.             |
| `maxItems`      | input  | `number`                           | no       | `5`         | Upper or lower bound applied to the items value.                      |
| `separator`     | input  | `string`                           | no       | `'›'`       | Visible text inserted between adjacent values or navigation segments. |
| `ariaLabel`     | input  | `string \| undefined`              | no       | `undefined` | Accessible name used when visible content is not sufficient.          |
| `moreLabel`     | input  | `string \| undefined`              | no       | `undefined` | Human-readable copy for the more state or control.                    |
| `showAllLabel`  | input  | `string \| undefined`              | no       | `undefined` | Human-readable copy for the show all state or control.                |
| `itemActivated` | output | `KrnBreadcrumbItem`                | no       | `undefined` | Notifies the consumer after the item activated interaction completes. |

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

Route: `preview/breadcrumbs`

Scenarios: `default`.
Public API coverage: 2/6
directly controlled; 4 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument    | Control | Default | Test value        | Binding                      | Description                                  |
| ----------- | ------- | ------- | ----------------- | ---------------------------- | -------------------------------------------- |
| `maxItems`  | number  | `5`     | `6`               | input `maxItems` (property)  | Controls when middle breadcrumbs collapse.   |
| `separator` | text    | `"›"`   | `"› · alternate"` | input `separator` (property) | Configures the component separator contract. |

Exact API exclusions:

| Public API     | Category           | Evidence                                                 | Reason                                                                                                                                                               |
| -------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#breadcrumbs` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `items`        | complex-data       | `specimen-fixture:preview/breadcrumbs?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |
| `moreLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#breadcrumbs` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `showAllLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#breadcrumbs` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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

- `tabs`
- `vertical-tabs`
- `pagination`
- `stepper`

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
