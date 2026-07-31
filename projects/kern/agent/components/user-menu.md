# User Menu

- ID: `user-menu`
- Selector: `krn-user-menu`
- Import: `import { KrnUserMenu } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnUserMenu`
- Lifecycle: **recipe**
- Category: Patterns

User Menu. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled user action menu
 *
 * Own menu disclosure state and provide a visible signed-in identity.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnUserMenu } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-user-menu-agent-example',
  standalone: true,
  imports: [KrnUserMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-user-menu name="Ada Lovelace" detail="Platform administrator" [(open)]="open">
      <span krnUserAvatar aria-hidden="true">AL</span>
      <button role="menuitem" type="button">Profile</button>
      <button role="menuitem" type="button">Sign out</button>
    </krn-user-menu>
  `,
})
export class KernUserMenuAgentExample {
  open = false;
}

void bootstrapApplication(KernUserMenuAgentExample);
```

## API

| Name            | Kind  | Type      | Required | Default                                  | Description                                                               |
| --------------- | ----- | --------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `name`          | input | `string`  | yes      | `required`                               | Required human-readable name for the represented person, item, or action. |
| `detail`        | input | `string`  | no       | `''`                                     | Supporting detail text displayed with the primary content.                |
| `menuAriaLabel` | input | `string`  | no       | `this.translations.patterns.userActions` | Human-readable copy for the menu aria state or control.                   |
| `open`          | model | `boolean` | no       | `false`                                  | Controls whether the disclosure or overlay surface is visible.            |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnUserAvatar]` — Projects content matching [krnUserAvatar].
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
- closed
- open

## Interactive playground

Route: `preview/user-menu`

Scenarios: `default`.
Public API coverage: 3/4
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default             | Test value                      | Binding                   | Description                               |
| -------- | ------- | ------------------- | ------------------------------- | ------------------------- | ----------------------------------------- |
| `open`   | boolean | `false`             | `true`                          | model `open`              | Opens the user menu.                      |
| `detail` | text    | `"avery@north.ops"` | `"avery@north.ops · alternate"` | input `detail` (property) | Configures the component detail contract. |
| `name`   | text    | `"Avery Cole"`      | `"Avery Cole · alternate"`      | input `name` (property)   | Configures the component name contract.   |

Exact API exclusions:

| Public API      | Category           | Evidence                                               | Reason                                                                                                                  |
| --------------- | ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `menuAriaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#user-menu` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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
- `closed` — closed; scenario `default`; `open=false`; fixture effect `data/alternate` — closed: The fixture data projection is changed for this acceptance state..
- `open` — Open; scenario `default`; `open=true`.

## Related

- `notification-center`
- `global-search`
- `filter-bar`
- `page-header`

## Common mistakes

- Do not omit required inputs: `name`.
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
