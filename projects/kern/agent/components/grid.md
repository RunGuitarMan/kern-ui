# Grid

- ID: `grid`
- Selector: `krn-grid`
- Import: `import { KrnGrid } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnGrid`
- Lifecycle: **stable**
- Category: Layout

Grid. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Responsive summary grid
 *
 * Lay out metric cards with a minimum usable column width.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnGrid } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-grid-agent-example',
  standalone: true,
  imports: [KrnGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-grid columns="auto" minColumnWidth="14rem" gap="4">
      <article>Revenue: €1.8M</article>
      <article>Renewals: 42</article>
      <article>Risk accounts: 3</article>
    </krn-grid>
  `,
})
export class KernGridAgentExample {}

void bootstrapApplication(KernGridAgentExample);
```

## API

| Name             | Kind  | Type                 | Required | Default     | Description                                                           |
| ---------------- | ----- | -------------------- | -------- | ----------- | --------------------------------------------------------------------- |
| `columns`        | input | `number \| "auto"`   | no       | `'auto'`    | Typed column definitions with stable keys.                            |
| `minColumnWidth` | input | `KrnLayoutSpace`     | no       | `'16rem'`   | Upper or lower bound applied to the column width value.               |
| `gap`            | input | `KrnLayoutSpace`     | no       | `'4'`       | Logical spacing inserted between adjacent layout children.            |
| `align`          | input | `KrnLayoutAlignment` | no       | `'stretch'` | Logical cross-axis alignment applied to children by the layout.       |
| `responsive`     | input | `boolean`            | no       | `true`      | Enables the component’s documented container-responsive presentation. |

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
