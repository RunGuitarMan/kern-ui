# Responsive Application Shell

- ID: `responsive-application-shell`
- Selector: `krn-responsive-application-shell`
- Import: `import { KrnResponsiveApplicationShell } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnResponsiveApplicationShell`
- Lifecycle: **recipe**
- Category: Patterns

Responsive Application Shell. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled responsive product shell
 *
 * Compose header, navigation and mobile fallback with owned disclosure state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResponsiveApplicationShell } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-responsive-application-shell-agent-example',
  standalone: true,
  imports: [KrnResponsiveApplicationShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-responsive-application-shell mainId="main-content" [(navigationOpen)]="navigationOpen">
      <header krnAppHeader>
        <button type="button" (click)="navigationOpen = true">Open navigation</button>
        KERN Console
      </header>
      <nav krnAppNavigation aria-label="Primary">Customers · Reports · Settings</nav>
      <main id="main-content">
        <h1>Customer portfolio</h1>
      </main>
      <nav krnAppMobileNavigation aria-label="Mobile primary navigation">
        Home · Tasks · Account
      </nav>
    </krn-responsive-application-shell>
  `,
})
export class KernResponsiveApplicationShellAgentExample {
  navigationOpen = false;
}

void bootstrapApplication(KernResponsiveApplicationShellAgentExample);
```

## API

| Name                   | Kind  | Type      | Required | Default                                      | Description                                                                   |
| ---------------------- | ----- | --------- | -------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `navigationOpen`       | model | `boolean` | no       | `false`                                      | Controlled navigation open state with a matching Angular model-change output. |
| `mainId`               | input | `string`  | no       | `this.ids.next('main-content')`              | Stable identifier value used by the main contract.                            |
| `navigationLabel`      | input | `string`  | no       | `this.translations.layout.primaryNavigation` | Human-readable copy for the navigation state or control.                      |
| `closeNavigationLabel` | input | `string`  | no       | `this.translations.layout.closeNavigation`   | Human-readable copy for the close navigation state or control.                |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnAppHeader]` — Projects content matching [krnAppHeader].
- `[krnAppNavigation]` — Projects content matching [krnAppNavigation].
- `*` — Projects default component content.
- `[krnAppMobileNavigation]` — Projects content matching [krnAppMobileNavigation].

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
- Uses the shared deterministic KERN id service.

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

Route: `preview/responsive-application-shell`

Scenarios: `default`.
Public API coverage: 1/4
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument         | Control | Default | Test value | Binding                | Description                            |
| ---------------- | ------- | ------- | ---------- | ---------------------- | -------------------------------------- |
| `navigationOpen` | boolean | `false` | `true`     | model `navigationOpen` | Opens the responsive shell navigation. |

Exact API exclusions:

| Public API             | Category           | Evidence                                                                  | Reason                                                                                                                                                               |
| ---------------------- | ------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closeNavigationLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#responsive-application-shell` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `mainId`               | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#responsive-application-shell` | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.                                                        |
| `navigationLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#responsive-application-shell` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
