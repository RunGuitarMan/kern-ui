# Page Header

- ID: `page-header`
- Selector: `krn-page-header`
- Import: `import { KrnPageHeader } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnPageHeader`
- Lifecycle: **recipe**
- Category: Patterns

Page Header. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Customer portfolio page header
 *
 * Pair required heading with page context and projected metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-page-header-agent-example',
  standalone: true,
  imports: [KrnPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-page-header
      index="02"
      eyebrow="Customers"
      heading="Portfolio health"
      description="Review renewal risk and account ownership."
    >
      <span krnPageHeaderMeta>Updated 12 minutes ago</span>
    </krn-page-header>
  `,
})
export class KernPageHeaderAgentExample {}

void bootstrapApplication(KernPageHeaderAgentExample);
```

## API

| Name          | Kind  | Type     | Required | Default    | Description                                                            |
| ------------- | ----- | -------- | -------- | ---------- | ---------------------------------------------------------------------- |
| `index`       | input | `string` | no       | `'01'`     | Zero-based position of the represented item in its ordered collection. |
| `eyebrow`     | input | `string` | no       | `''`       | Human-readable copy for the eyebrow state or control.                  |
| `heading`     | input | `string` | yes      | `required` | Human-readable copy for the heading state or control.                  |
| `description` | input | `string` | no       | `''`       | Visible supporting description for the component content.              |

## Content slots

- `[krnPageHeaderMeta]` — Projects content matching [krnPageHeaderMeta].
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

## Related

- `user-menu`
- `notification-center`
- `global-search`
- `filter-bar`

## Common mistakes

- Do not omit required inputs: `heading`.
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
