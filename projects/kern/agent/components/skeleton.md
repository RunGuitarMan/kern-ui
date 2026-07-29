# Skeleton

- ID: `skeleton`
- Selector: `krn-skeleton`
- Import: `import { KrnSkeleton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSkeleton`
- Lifecycle: **stable**
- Category: Feedback

Skeleton. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Stable customer-card placeholder
 *
 * Reserve the final content geometry while data loads.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSkeleton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-skeleton-agent-example',
  standalone: true,
  imports: [KrnSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Loading customer summary">
      <krn-skeleton width="40%" height="1.25rem" shape="text" />
      <krn-skeleton width="100%" height="4rem" shape="rectangle" />
    </section>
  `,
})
export class KernSkeletonAgentExample {}

void bootstrapApplication(KernSkeletonAgentExample);
```

## API

| Name     | Kind  | Type                                | Required | Default                | Description                                                      |
| -------- | ----- | ----------------------------------- | -------- | ---------------------- | ---------------------------------------------------------------- |
| `width`  | input | `string`                            | no       | `'100%'`               | Explicit inline size of the rendered surface.                    |
| `height` | input | `string`                            | no       | `'var(--krn-space-4)'` | Explicit block size of the rendered surface or virtual viewport. |
| `shape`  | input | `"circle" \| "text" \| "rectangle"` | no       | `'text'`               | Named geometry applied to the avatar or media boundary.          |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Escape closes modal layers
- Focus returns to the trigger
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

## Related

- `alert`
- `banner`
- `toast`
- `tooltip`

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
