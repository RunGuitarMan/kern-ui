# Bottom Navigation

- ID: `bottom-navigation`
- Selector: `krn-bottom-navigation`
- Import: `import { KrnBottomNavigation } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnBottomNavigation`
- Lifecycle: **stable**
- Category: Navigation

Bottom Navigation. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled mobile primary navigation
 *
 * Use stable ids and owned selected destination.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBottomNavigation, type KrnNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-bottom-navigation-agent-example',
  standalone: true,
  imports: [KrnBottomNavigation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-bottom-navigation
      ariaLabel="Primary mobile navigation"
      [items]="items"
      [(value)]="selectedDestination"
    />
  `,
})
export class KernBottomNavigationAgentExample {
  readonly items: readonly KrnNavigationItem[] = [
    { id: 'home', label: 'Home', href: '/home' },
    { id: 'tasks', label: 'Tasks', href: '/tasks', badge: 3 },
    { id: 'account', label: 'Account', href: '/account' },
  ];

  selectedDestination: string | null = 'home';
}

void bootstrapApplication(KernBottomNavigationAgentExample);
```

## API

| Name           | Kind   | Type                               | Required | Default                                | Description                                                          |
| -------------- | ------ | ---------------------------------- | -------- | -------------------------------------- | -------------------------------------------------------------------- |
| `items`        | input  | `ReadonlyArray<KrnNavigationItem>` | no       | `[]`                                   | Ordered item collection rendered by the composite widget.            |
| `value`        | model  | `string \| null`                   | no       | `null`                                 | Controlled component value.                                          |
| `ariaLabel`    | input  | `string`                           | no       | `this.translations.navigation.primary` | Accessible name used when visible content is not sufficient.         |
| `itemSelected` | output | `KrnNavigationItem`                | no       | `undefined`                            | Notifies the consumer after the item selected interaction completes. |

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
