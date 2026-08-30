# Aspect Ratio

- ID: `aspect-ratio`
- Selector: `krn-aspect-ratio`
- Import: `import { KrnAspectRatio } from '@kern-ui/angular/layout';`
- Canonical symbol: `KrnAspectRatio`
- Lifecycle: **stable**
- Category: Layout

Aspect Ratio. Maintains a chosen width-to-height ratio while controlling how media fits its box.

## Use

Use Aspect Ratio for this specific contract: Maintains a chosen width-to-height ratio while controlling how media fits its box.

Avoid: Do not choose Aspect Ratio for visual similarity alone; its semantics and interaction model must match the product task.

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
import { KrnAspectRatio } from '@kern-ui/angular/layout';

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

| Name    | Kind  | Type                                       | Required | Default   | Description                                                                                |
| ------- | ----- | ------------------------------------------ | -------- | --------- | ------------------------------------------------------------------------------------------ |
| `ratio` | input | `number \| string`                         | no       | `16 / 9`  | Sets a positive width-to-height ratio as a number, `16 / 9`, or `16:9`.                    |
| `fit`   | input | `"contain" \| "cover" \| "fill" \| "none"` | no       | `'cover'` | Controls how direct projected media fills the ratio box. Invalid runtime values use cover. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Projected content retains its document order and native semantics as layout changes.
- Logical sizing and placement work in both LTR and RTL without duplicating content.

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

Route: `preview/aspect-ratio`

Scenarios: `default`.
Public API coverage: 1/2
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument | Control | Default   | Test value | Binding                | Description                                     |
| -------- | ------- | --------- | ---------- | ---------------------- | ----------------------------------------------- |
| `fit`    | select  | `"cover"` | `"none"`   | input `fit` (property) | Changes how projected media fits the ratio box. |

Exact API exclusions:

| Public API | Category          | Evidence                                              | Reason                                                                                                          |
| ---------- | ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ratio`    | polymorphic-value | `specimen-fixture:preview/aspect-ratio?state=default` | This polymorphic value cannot round-trip through one scalar control without changing its public type semantics. |

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
