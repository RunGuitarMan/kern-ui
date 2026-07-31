# App Shell

- ID: `app-shell`
- Selector: `krn-app-shell`
- Import: `import { KrnAppShell } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnAppShell`
- Lifecycle: **stable**
- Category: Layout

App Shell. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Responsive application shell
 *
 * Compose header, navigation and main content with controlled mobile navigation.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAppShell } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-app-shell-agent-example',
  standalone: true,
  imports: [KrnAppShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-app-shell [(mobileNavigationOpen)]="navigationOpen">
      <header krnAppHeader>Operations workspace</header>
      <nav krnAppSidebar aria-label="Workspace">Overview · Reports · Settings</nav>
      <main>
        <h1>Overview</h1>
        <p>Quarterly operating summary.</p>
      </main>
    </krn-app-shell>
  `,
})
export class KernAppShellAgentExample {
  navigationOpen = false;
}

void bootstrapApplication(KernAppShellAgentExample);
```

## API

| Name                    | Kind  | Type                                        | Required | Default                                     | Description                                                                          |
| ----------------------- | ----- | ------------------------------------------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `sidebarWidth`          | input | `KrnLayoutSpace`                            | no       | `'17rem'`                                   | Inline size reserved for the expanded application sidebar.                           |
| `railWidth`             | input | `KrnLayoutSpace`                            | no       | `'3.5rem'`                                  | Inline size reserved for the application navigation rail.                            |
| `mainMaxWidth`          | input | `KrnLayoutSpace`                            | no       | `'100%'`                                    | Maximum inline size allocated to the primary application content.                    |
| `sidebarPosition`       | input | `"end" \| "start"`                          | no       | `'start'`                                   | Logical start or end placement of the application sidebar.                           |
| `mobileNavigation`      | input | `"auto" \| "hidden" \| "rail" \| "sidebar"` | no       | `'auto'`                                    | Template rendered as the application’s narrow-viewport navigation.                   |
| `mobileNavigationOpen`  | model | `boolean`                                   | no       | `false`                                     | Controlled mobile navigation open state with a matching Angular model-change output. |
| `mobileNavigationId`    | input | `string`                                    | no       | `this.ids.next('mobile-navigation')`        | Stable identifier value used by the mobile navigation contract.                      |
| `mobileNavigationLabel` | input | `string`                                    | no       | `this.translations.layout.mobileNavigation` | Human-readable copy for the mobile navigation state or control.                      |
| `openNavigationLabel`   | input | `string`                                    | no       | `this.translations.layout.openNavigation`   | Human-readable copy for the open navigation state or control.                        |
| `closeNavigationLabel`  | input | `string`                                    | no       | `this.translations.layout.closeNavigation`  | Human-readable copy for the close navigation state or control.                       |
| `mainId`                | input | `string`                                    | no       | `'main-content'`                            | Stable identifier value used by the main contract.                                   |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `krn-header,[krnAppHeader]` — Projects content matching krn-header,[krnAppHeader].
- `krn-navigation-rail,[krnAppRail]` — Projects content matching krn-navigation-rail,[krnAppRail].
- `krn-sidebar,[krnAppSidebar]` — Projects content matching krn-sidebar,[krnAppSidebar].
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

## Interactive playground

Route: `preview/app-shell`

Scenarios: `default`.
Public API coverage: 6/11
directly controlled; 5 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument               | Control | Default    | Test value | Binding                             | Description                                               |
| ---------------------- | ------- | ---------- | ---------- | ----------------------------------- | --------------------------------------------------------- |
| `mobileNavigationOpen` | boolean | `false`    | `true`     | model `mobileNavigationOpen`        | Opens the shell navigation surface at mobile breakpoints. |
| `mainMaxWidth`         | text    | `"48rem"`  | `"20rem"`  | input `mainMaxWidth` (property)     | Constrains the primary content measure.                   |
| `sidebarWidth`         | text    | `"10rem"`  | `"20rem"`  | input `sidebarWidth` (property)     | Sets the shell sidebar width.                             |
| `mobileNavigation`     | select  | `"auto"`   | `"hidden"` | input `mobileNavigation` (property) | Configures the component mobileNavigation contract.       |
| `railWidth`            | text    | `"3.5rem"` | `"20rem"`  | input `railWidth` (property)        | Configures the component railWidth contract.              |
| `sidebarPosition`      | select  | `"start"`  | `"end"`    | input `sidebarPosition` (property)  | Configures the component sidebarPosition contract.        |

Exact API exclusions:

| Public API              | Category           | Evidence                                               | Reason                                                                                                                                                               |
| ----------------------- | ------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closeNavigationLabel`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#app-shell` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `mainId`                | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#app-shell` | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.                                                        |
| `mobileNavigationId`    | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#app-shell` | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.                                                        |
| `mobileNavigationLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#app-shell` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `openNavigationLabel`   | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#app-shell` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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

- `header`
- `sidebar`
- `navigation-rail`
- `container`

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
