# Container

- ID: `container`
- Selector: `krn-container`
- Import: `import { KrnContainer } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnContainer`
- Lifecycle: **stable**
- Category: Layout

Container. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Bounded content container
 *
 * Center page content with a stable readable width.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnContainer } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-container-agent-example',
  standalone: true,
  imports: [KrnContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-container size="lg">
      <h1>Customer portfolio</h1>
      <p>Review ownership, risk and renewal dates.</p>
    </krn-container>
  `,
})
export class KernContainerAgentExample {}

void bootstrapApplication(KernContainerAgentExample);
```

## API

| Name       | Kind  | Type                           | Required | Default    | Description                                                          |
| ---------- | ----- | ------------------------------ | -------- | ---------- | -------------------------------------------------------------------- |
| `size`     | input | `KrnContainerSize`             | no       | `'lg'`     | Named semantic size resolved through KERN density and sizing tokens. |
| `maxWidth` | input | `string \| null`               | no       | `null`     | Upper or lower bound applied to the width value.                     |
| `gutter`   | input | `KrnLayoutSpace`               | no       | `'4'`      | Outer or inter-column spacing applied by the layout.                 |
| `align`    | input | `"center" \| "start" \| "end"` | no       | `'center'` | Logical cross-axis alignment applied to children by the layout.      |

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
