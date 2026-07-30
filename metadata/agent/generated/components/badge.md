# Badge

- ID: `badge`
- Selector: `krn-badge`
- Import: `import { KrnBadge } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnBadge`
- Lifecycle: **stable**
- Category: Data display

Badge. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Semantic account status badge
 *
 * Express status through text, marker and semantic tone.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBadge } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-badge-agent-example',
  standalone: true,
  imports: [KrnBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-badge tone="success" [status]="true">Healthy</krn-badge> `,
})
export class KernBadgeAgentExample {}

void bootstrapApplication(KernBadgeAgentExample);
```

## API

| Name     | Kind  | Type             | Required | Default     | Description                                                                      |
| -------- | ----- | ---------------- | -------- | ----------- | -------------------------------------------------------------------------------- |
| `tone`   | input | `KrnDisplayTone` | no       | `'neutral'` | Semantic intent that selects coordinated text, icon, border, and surface tokens. |
| `status` | input | `boolean`        | no       | `false`     | Current domain status rendered as visible text and a non-color-only treatment.   |

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

Route: `preview/badge`

Scenarios: `default`.
Public API coverage: 2/2
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default     | Test value | Binding                   | Description                           |
| -------- | ------- | ----------- | ---------- | ------------------------- | ------------------------------------- |
| `tone`   | select  | `"neutral"` | `"brand"`  | input `tone` (property)   | Changes the semantic color treatment. |
| `status` | boolean | `false`     | `true`     | input `status` (property) | Shows a status dot.                   |

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
- `status-marker` — Status Marker; scenario `default`; `status=true`.

## Related

- `status-badge`
- `chip`
- `tag`
- `avatar`

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
