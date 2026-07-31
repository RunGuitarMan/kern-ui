# Responsive Show Hide

- ID: `responsive-show-hide`
- Selector: `krn-responsive-show-hide`
- Import: `import { KrnResponsiveShowHide } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnShow`
- Lifecycle: **stable**
- Category: Layout

Responsive Show Hide. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Responsive supporting guidance
 *
 * Show supplemental copy only when its target layout has enough room.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResponsiveShowHide } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-responsive-show-hide-agent-example',
  standalone: true,
  imports: [KrnResponsiveShowHide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-responsive-show-hide from="md" display="block">
      Keyboard shortcuts are available from the command palette.
    </krn-responsive-show-hide>
  `,
})
export class KernResponsiveShowHideAgentExample {}

void bootstrapApplication(KernResponsiveShowHideAgentExample);
```

## API

| Name      | Kind  | Type                      | Required | Default   | Description                                                    |
| --------- | ----- | ------------------------- | -------- | --------- | -------------------------------------------------------------- |
| `from`    | input | `KrnResponsiveBreakpoint` | no       | `'none'`  | Starting boundary of the represented range or interval.        |
| `until`   | input | `KrnResponsiveBreakpoint` | no       | `'none'`  | Ending boundary of the represented range or interval.          |
| `display` | input | `KrnResponsiveDisplay`    | no       | `'block'` | Named presentation strategy used to render the supplied value. |

## Deprecated selectors

_No deprecated selectors._

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
- dark
- high contrast
- compact
- RTL
- mobile

## Interactive playground

Route: `preview/responsive-show-hide`

Scenarios: `default`.
Public API coverage: 3/3
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument  | Control | Default   | Test value | Binding                    | Description                                                            |
| --------- | ------- | --------- | ---------- | -------------------------- | ---------------------------------------------------------------------- |
| `display` | select  | `"block"` | `"inline"` | input `display` (property) | Chooses the display mode used while the responsive content is visible. |
| `from`    | select  | `"md"`    | `"none"`   | input `from` (property)    | Shows the desktop specimen from the selected breakpoint.               |
| `until`   | select  | `"none"`  | `"sm"`     | input `until` (property)   | Optionally hides the desktop specimen at the selected breakpoint.      |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.

## Related

- `app-shell`
- `header`
- `sidebar`
- `navigation-rail`

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
