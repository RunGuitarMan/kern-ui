# Divider

- ID: `divider`
- Selector: `krn-divider`
- Import: `import { KrnDivider } from '@kern-ui/angular/layout';`
- Canonical symbol: `KrnDivider`
- Lifecycle: **stable**
- Category: Layout

Divider. Separates adjacent content horizontally or vertically, with optional inset and visible label.

## Use

Use Divider for this specific contract: Separates adjacent content horizontally or vertically, with optional inset and visible label.

Avoid: Do not choose Divider for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Labeled section divider
 *
 * Separate two form sections with visible context.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDivider } from '@kern-ui/angular/layout';

@Component({
  selector: 'app-kern-divider-agent-example',
  standalone: true,
  imports: [KrnDivider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-divider label="Advanced settings" /> `,
})
export class KernDividerAgentExample {}

void bootstrapApplication(KernDividerAgentExample);
```

## API

| Name          | Kind  | Type                         | Required | Default        | Description                                                                                     |
| ------------- | ----- | ---------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `orientation` | input | `"horizontal" \| "vertical"` | no       | `'horizontal'` | Sets the separator and visual line orientation. Invalid runtime values fall back to horizontal. |
| `inset`       | input | `KrnLayoutSpace`             | no       | `'0'`          | Insets both ends of the divider along its length using a spacing token, pixels, or CSS length.  |
| `label`       | input | `string \| null`             | no       | `null`         | Adds a visible label and uses its trimmed text as the separator's accessible name.              |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Exposes separator semantics and the configured orientation.
- A visible label supplements rather than replaces the surrounding section structure.

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

Route: `preview/divider`

Scenarios: `default`.
Public API coverage: 3/3
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default           | Test value                    | Binding                        | Description                                                                                    |
| ------------- | ------- | ----------------- | ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `orientation` | select  | `"horizontal"`    | `"vertical"`                  | input `orientation` (property) | Changes the separator axis and accessibility semantics.                                        |
| `label`       | text    | `"Access policy"` | `"Access policy · alternate"` | input `label` (property)       | Adds an accessible separator label.                                                            |
| `inset`       | text    | `"0"`             | `"20rem"`                     | input `inset` (property)       | Insets both ends of the divider along its length using a spacing token, pixels, or CSS length. |

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
