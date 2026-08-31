# Page Header

- ID: `page-header`
- Selector: `krn-page-header`
- Import: `import { KrnPageHeader } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnPageHeader`
- Lifecycle: **recipe**
- Category: Patterns

Page Header. Composes page context, heading, description, index, and actions into one heading region.

## Use

Use Page Header for this specific contract: Composes page context, heading, description, index, and actions into one heading region.

Avoid: Do not choose Page Header for visual similarity alone; its semantics and interaction model must match the product task.

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

| Name          | Kind  | Type     | Required | Default    | Description                                               |
| ------------- | ----- | -------- | -------- | ---------- | --------------------------------------------------------- |
| `index`       | input | `string` | no       | `'01'`     | Defines the component's index behavior or presentation.   |
| `eyebrow`     | input | `string` | no       | `''`       | Human-readable copy for the eyebrow state or control.     |
| `heading`     | input | `string` | yes      | `required` | Human-readable copy for the heading state or control.     |
| `description` | input | `string` | no       | `''`       | Visible supporting description for the component content. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnPageHeaderMeta]` — Projects content matching [krnPageHeaderMeta].
- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Keyboard behavior is provided by the native elements and Kern primitives in the recipe
- The recipe preserves the accessible names, roles, states, and focus behavior of its primitives.
- Loading, empty, error, and success states remain visible and programmatically perceivable.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.
- Uses the shared deterministic KERN id service.

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

## Interactive playground

Route: `preview/page-header`

Scenarios: `default`.
Public API coverage: 4/4
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                                                         | Test value                                                                  | Binding                        | Description                                               |
| ------------- | ------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| `heading`     | text    | `"Automation health"`                                           | `"Automation health · alternate"`                                           | input `heading` (property)     | Changes the page heading.                                 |
| `description` | text    | `"Monitor runs, failures, and throughput across environments."` | `"Monitor runs, failures, and throughput across environments. · alternate"` | input `description` (property) | Visible supporting description for the component content. |
| `eyebrow`     | text    | `"Workspace / Northstar"`                                       | `"Workspace / Northstar · alternate"`                                       | input `eyebrow` (property)     | Human-readable copy for the eyebrow state or control.     |
| `index`       | text    | `"07"`                                                          | `"07 · alternate"`                                                          | input `index` (property)       | Defines the component's index behavior or presentation.   |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `data/alternate` — overflow: The fixture data projection is changed for this acceptance state..
- `long-text` — long text; scenario `default`; fixture effect `data/alternate` — long text: The fixture data projection is changed for this acceptance state..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `loading` — loading; scenario `default`; fixture effect `data/loading` — loading: The fixture is waiting for enterprise data..
- `empty` — empty; scenario `default`; fixture effect `data/empty` — empty: The fixture data source returned no records..
- `error` — error; scenario `default`; fixture effect `data/error` — error: The fixture data request failed and can be retried..
- `success` — success; scenario `default`; fixture effect `data/success` — success: The fixture operation completed successfully..

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
