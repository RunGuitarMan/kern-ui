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

| Name            | Kind   | Type                               | Required | Default                                          | Description                                                           |
| --------------- | ------ | ---------------------------------- | -------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `items`         | input  | `ReadonlyArray<KrnBreadcrumbItem>` | no       | `[]`                                             | Ordered item collection rendered by the composite widget.             |
| `maxItems`      | input  | `number`                           | no       | `5`                                              | Upper or lower bound applied to the items value.                      |
| `separator`     | input  | `string`                           | no       | `'›'`                                            | Visible text inserted between adjacent values or navigation segments. |
| `ariaLabel`     | input  | `string`                           | no       | `this.translations.navigation.breadcrumb`        | Accessible name used when visible content is not sufficient.          |
| `moreLabel`     | input  | `string`                           | no       | `this.translations.navigation.breadcrumbMore`    | Human-readable copy for the more state or control.                    |
| `showAllLabel`  | input  | `string`                           | no       | `this.translations.navigation.breadcrumbShowAll` | Human-readable copy for the show all state or control.                |
| `itemActivated` | output | `KrnBreadcrumbItem`                | no       | `undefined`                                      | Notifies the consumer after the item activated interaction completes. |

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
