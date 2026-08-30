# Status Badge

- ID: `status-badge`
- Selector: `krn-status-badge`
- Import: `import { KrnStatusBadge } from '@kern-ui/angular/data-display';`
- Canonical symbol: `KrnBadge`
- Lifecycle: **stable**
- Category: Data display

Status Badge. Displays a named domain status with coordinated text and non-color-only styling.

## Use

Use Status Badge for this specific contract: Displays a named domain status with coordinated text and non-color-only styling.

Avoid: Do not choose Status Badge for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Alias status badge
 *
 * Use the status-focused alias with visible state text.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnStatusBadge } from '@kern-ui/angular/data-display';

@Component({
  selector: 'app-kern-status-badge-agent-example',
  standalone: true,
  imports: [KrnStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-status-badge tone="warning" [status]="true">Review needed</krn-status-badge> `,
})
export class KernStatusBadgeAgentExample {}

void bootstrapApplication(KernStatusBadgeAgentExample);
```

## API

| Name      | Kind  | Type              | Required | Default     | Description                                                                        |
| --------- | ----- | ----------------- | -------- | ----------- | ---------------------------------------------------------------------------------- |
| `tone`    | input | `KrnDisplayTone`  | no       | `'neutral'` | Semantic intent that selects coordinated text, icon, border, and surface tokens.   |
| `status`  | input | `boolean`         | no       | `false`     | Uses the shared, subtle status recipe and renders a semantic color marker.         |
| `variant` | input | `KrnBadgeVariant` | no       | `'subtle'`  | Controls non-status badges. Status badges always use the shared subtle appearance. |
| `size`    | input | `KrnBadgeSize`    | no       | `'md'`      | Controls the badge height, horizontal padding, and text density.                   |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnBadgeIcon]` — Projects content matching [krnBadgeIcon].
- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Visible labels and semantic structure preserve the meaning and relationships in the data.
- Interactive descendants retain native names and a predictable focus order.

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

Route: `preview/status-badge`

Scenarios: `default`.
Public API coverage: 2/4
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default     | Test value  | Binding                   | Description                                                                |
| -------- | ------- | ----------- | ----------- | ------------------------- | -------------------------------------------------------------------------- |
| `tone`   | select  | `"success"` | `"neutral"` | input `tone` (property)   | Changes the semantic status color.                                         |
| `status` | boolean | `true`      | `false`     | input `status` (property) | Uses the shared, subtle status recipe and renders a semantic color marker. |

Exact API exclusions:

| Public API | Category     | Evidence                                              | Reason                                                                                           |
| ---------- | ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `size`     | complex-data | `specimen-fixture:preview/status-badge?state=default` | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture. |
| `variant`  | complex-data | `specimen-fixture:preview/status-badge?state=default` | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `plain` — Plain; scenario `default`; `status=false`.

## Related

- `badge`
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
