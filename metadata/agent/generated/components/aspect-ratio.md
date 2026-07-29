# Aspect Ratio

- ID: `aspect-ratio`
- Selector: `krn-aspect-ratio`
- Import: `import { KrnAspectRatio } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnAspectRatio`
- Lifecycle: **stable**
- Category: Layout

Aspect Ratio. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Stable media preview
 *
 * Reserve a 16:9 region before preview content is available.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAspectRatio } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-aspect-ratio-agent-example',
  standalone: true,
  imports: [KrnAspectRatio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-aspect-ratio ratio="16 / 9" fit="cover">
      <div role="img" aria-label="Quarterly report preview">Q3 report preview</div>
    </krn-aspect-ratio>
  `,
})
export class KernAspectRatioAgentExample {}

void bootstrapApplication(KernAspectRatioAgentExample);
```

## API

| Name    | Kind  | Type                                       | Required | Default   | Description                                                             |
| ------- | ----- | ------------------------------------------ | -------- | --------- | ----------------------------------------------------------------------- |
| `ratio` | input | `string \| number`                         | no       | `16 / 9`  | Required width-to-height ratio maintained by the layout.                |
| `fit`   | input | `"none" \| "fill" \| "cover" \| "contain"` | no       | `'cover'` | Media fitting strategy used when intrinsic and container ratios differ. |

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
