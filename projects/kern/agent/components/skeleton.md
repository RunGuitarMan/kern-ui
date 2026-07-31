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
| `shape`  | input | `"circle" \| "rectangle" \| "text"` | no       | `'text'`               | Named geometry applied to the avatar or media boundary.          |

## Deprecated selectors

_No deprecated selectors._

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

## Interactive playground

Route: `preview/skeleton`

Scenarios: `default`.
Public API coverage: 3/3
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default       | Test value | Binding                   | Description                                      |
| -------- | ------- | ------------- | ---------- | ------------------------- | ------------------------------------------------ |
| `width`  | text    | `"100%"`      | `"20rem"`  | input `width` (property)  | Sets the placeholder inline size.                |
| `height` | text    | `"5rem"`      | `"20rem"`  | input `height` (property) | Sets the placeholder block size.                 |
| `shape`  | select  | `"rectangle"` | `"text"`   | input `shape` (property)  | Chooses a text, rectangle, or circle silhouette. |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `loading` — loading; scenario `default`; fixture effect `status/info` — loading: The fixture exposes the loading status without claiming a public component input..

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
