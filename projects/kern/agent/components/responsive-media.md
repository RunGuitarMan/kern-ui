# Responsive Media

- ID: `responsive-media`
- Selector: `krn-responsive-media`
- Import: `import { KrnResponsiveMedia } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnResponsiveMedia`
- Lifecycle: **stable**
- Category: Data display

Responsive Media. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Responsive report preview
 *
 * Contain responsive media within a stable aspect ratio.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResponsiveMedia } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-responsive-media-agent-example',
  standalone: true,
  imports: [KrnResponsiveMedia],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-responsive-media aspectRatio="16 / 9">
      <div role="img" aria-label="Revenue dashboard preview">Revenue dashboard preview</div>
    </krn-responsive-media>
  `,
})
export class KernResponsiveMediaAgentExample {}

void bootstrapApplication(KernResponsiveMediaAgentExample);
```

## API

| Name          | Kind  | Type     | Required | Default    | Description                                                     |
| ------------- | ----- | -------- | -------- | ---------- | --------------------------------------------------------------- |
| `aspectRatio` | input | `string` | no       | `'16 / 9'` | Required width-to-height ratio maintained by the media surface. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
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

Route: `preview/responsive-media`

Scenarios: `default`.
Public API coverage: 1/1
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default    | Test value | Binding                        | Description                         |
| ------------- | ------- | ---------- | ---------- | ------------------------------ | ----------------------------------- |
| `aspectRatio` | text    | `"16 / 9"` | `"4 / 3"`  | input `aspectRatio` (property) | Changes the responsive media ratio. |

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

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

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
