# Navigation Rail

- ID: `navigation-rail`
- Selector: `krn-navigation-rail`
- Import: `import { KrnNavigationRail } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnNavigationRail`
- Lifecycle: **stable**
- Category: Layout

Navigation Rail. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Expandable navigation rail
 *
 * Expose compact navigation while preserving controlled expansion.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNavigationRail } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-navigation-rail-agent-example',
  standalone: true,
  imports: [KrnNavigationRail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-navigation-rail [(expanded)]="expanded" ariaLabel="Primary navigation">
      <strong krnRailHeader>AC</strong>
      <nav aria-label="Primary">Home · Tasks · Reports</nav>
      <button krnRailFooter type="button">Help</button>
    </krn-navigation-rail>
  `,
})
export class KernNavigationRailAgentExample {
  expanded = false;
}

void bootstrapApplication(KernNavigationRailAgentExample);
```

## API

| Name            | Kind  | Type               | Required | Default                                      | Description                                                         |
| --------------- | ----- | ------------------ | -------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `expanded`      | model | `boolean`          | no       | `false`                                      | Controlled expanded state for a disclosure or hierarchical item.    |
| `width`         | input | `KrnLayoutSpace`   | no       | `'var(--krn-shell-rail-width, 3.5rem)'`      | Explicit inline size of the rendered surface.                       |
| `expandedWidth` | input | `KrnLayoutSpace`   | no       | `'14rem'`                                    | Controls whether the component applies the expanded width behavior. |
| `ariaLabel`     | input | `string`           | no       | `this.translations.layout.primaryNavigation` | Accessible name used when visible content is not sufficient.        |
| `side`          | input | `"start" \| "end"` | no       | `'start'`                                    | Logical side on which the anchored or modal surface is placed.      |

## Content slots

- `[krnRailHeader]` — Projects content matching [krnRailHeader].
- `*` — Projects default component content.
- `[krnRailFooter]` — Projects content matching [krnRailFooter].

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

## Related

- `app-shell`
- `header`
- `sidebar`
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
