# Spacer

- ID: `spacer`
- Selector: `krn-spacer`
- Import: `import { KrnSpacer } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSpacer`
- Lifecycle: **stable**
- Category: Layout

Spacer. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Semantic layout spacer
 *
 * Reserve tokenized vertical space between independent regions.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSpacer } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-spacer-agent-example',
  standalone: true,
  imports: [KrnSpacer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Summary</p>
    <krn-spacer size="6" axis="vertical" />
    <p>Detailed report</p>
  `,
})
export class KernSpacerAgentExample {}

void bootstrapApplication(KernSpacerAgentExample);
```

## API

| Name   | Kind  | Type             | Required | Default      | Description                                                                 |
| ------ | ----- | ---------------- | -------- | ------------ | --------------------------------------------------------------------------- |
| `size` | input | `KrnLayoutSpace` | no       | `'4'`        | Fixed logical length reserved by the spacer.                                |
| `axis` | input | `KrnLayoutAxis`  | no       | `'vertical'` | Axis receiving space: horizontal maps to inline and vertical maps to block. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

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

## Interactive playground

Route: `preview/spacer`

Scenarios: `default`.
Public API coverage: 2/2
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default        | Test value   | Binding                 | Description                             |
| -------- | ------- | -------------- | ------------ | ----------------------- | --------------------------------------- |
| `axis`   | select  | `"horizontal"` | `"vertical"` | input `axis` (property) | Chooses the axis that receives spacing. |
| `size`   | text    | `"12"`         | `"20rem"`    | input `size` (property) | Sets the spacer length.                 |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.

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
