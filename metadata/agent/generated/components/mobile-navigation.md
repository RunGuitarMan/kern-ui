# Mobile Navigation

- ID: `mobile-navigation`
- Selector: `krn-mobile-navigation`
- Import: `import { KrnMobileNavigation } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnMobileNavigation`
- Lifecycle: **recipe**
- Category: Patterns

Mobile Navigation. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Mobile application navigation
 *
 * Compose touch-friendly primary destinations under one accessible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMobileNavigation } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-mobile-navigation-agent-example',
  standalone: true,
  imports: [KrnMobileNavigation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-mobile-navigation ariaLabel="Primary mobile navigation">
      <a href="/home">Home</a>
      <a href="/tasks">Tasks</a>
      <a href="/account">Account</a>
    </krn-mobile-navigation>
  `,
})
export class KernMobileNavigationAgentExample {}

void bootstrapApplication(KernMobileNavigationAgentExample);
```

## API

| Name        | Kind  | Type     | Required | Default                                       | Description                                                  |
| ----------- | ----- | -------- | -------- | --------------------------------------------- | ------------------------------------------------------------ |
| `ariaLabel` | input | `string` | no       | `this.translations.patterns.mobileNavigation` | Accessible name used when visible content is not sufficient. |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- No custom keyboard behavior unless the composition is interactive
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
- loading
- empty
- error
- success

## Interactive playground

Route: `preview/mobile-navigation`

Scenarios: `default`.
Public API coverage: 0/1
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default      | Test value   | Binding             | Description                                            |
| ---------- | ------- | ------------ | ------------ | ------------------- | ------------------------------------------------------ |
| `selected` | select  | `"overview"` | `"activity"` | fixture interaction | Changes the selected projected navigation destination. |

Exact API exclusions:

| Public API  | Category           | Evidence                                                       | Reason                                                                                                                  |
| ----------- | ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#mobile-navigation` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `data/alternate` — overflow: The fixture data projection is changed for this acceptance state..
- `long-text` — long text; scenario `default`; fixture effect `data/alternate` — long text: The fixture data projection is changed for this acceptance state..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `loading` — loading; scenario `default`; fixture effect `data/loading` — loading: The fixture is waiting for enterprise data..
- `empty` — empty; scenario `default`; fixture effect `data/empty` — empty: The fixture data source returned no records..
- `error` — error; scenario `default`; fixture effect `data/error` — error: The fixture data request failed and can be retried..
- `success` — success; scenario `default`; fixture effect `data/success` — success: The fixture operation completed successfully..

## Related

- `user-menu`
- `notification-center`
- `global-search`
- `filter-bar`

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
