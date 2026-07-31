# Header

- ID: `header`
- Selector: `krn-header`
- Import: `import { KrnHeader } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnHeader`
- Lifecycle: **stable**
- Category: Layout

Header. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Application header
 *
 * Arrange product identity, page context and account actions.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnHeader } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-header-agent-example',
  standalone: true,
  imports: [KrnHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-header sticky>
      <strong krnHeaderStart>KERN Console</strong>
      <span>Production</span>
      <button krnHeaderEnd type="button">Account</button>
    </krn-header>
  `,
})
export class KernHeaderAgentExample {}

void bootstrapApplication(KernHeaderAgentExample);
```

## API

| Name             | Kind  | Type             | Required | Default  | Description                                                                   |
| ---------------- | ----- | ---------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `height`         | input | `KrnLayoutSpace` | no       | `'4rem'` | Explicit block size of the rendered surface or virtual viewport.              |
| `stickyOffset`   | input | `KrnLayoutSpace` | no       | `0`      | Logical inset between a sticky header and its scrolling boundary.             |
| `sticky`         | input | `boolean`        | no       | `true`   | Keeps the surface attached to its scrolling boundary while content moves.     |
| `elevated`       | input | `boolean`        | no       | `false`  | Adds semantic surface elevation for content that sits above its surroundings. |
| `ariaLabel`      | input | `string`         | no       | `''`     | Accessible name used when visible content is not sufficient.                  |
| `ariaLabelledBy` | input | `string`         | no       | `''`     | Space-separated element ids that name the native header landmark.             |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnHeaderStart]` — Projects content matching [krnHeaderStart].
- `*` — Projects default component content.
- `[krnHeaderEnd]` — Projects content matching [krnHeaderEnd].

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

## Interactive playground

Route: `preview/header`

Scenarios: `default`.
Public API coverage: 4/6
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default  | Test value | Binding                         | Description                                     |
| -------------- | ------- | -------- | ---------- | ------------------------------- | ----------------------------------------------- |
| `elevated`     | boolean | `true`   | `false`    | input `elevated` (property)     | Adds the elevated header treatment.             |
| `height`       | text    | `"4rem"` | `"20rem"`  | input `height` (property)       | Configures the component height contract.       |
| `sticky`       | boolean | `true`   | `false`    | input `sticky` (property)       | Configures the component sticky contract.       |
| `stickyOffset` | text    | `"0"`    | `"1rem"`   | input `stickyOffset` (property) | Configures the component stickyOffset contract. |

Exact API exclusions:

| Public API       | Category           | Evidence                                            | Reason                                                                                                                  |
| ---------------- | ------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#header` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#header` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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

- `app-shell`
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
