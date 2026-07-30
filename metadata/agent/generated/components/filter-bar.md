# Filter Bar

- ID: `filter-bar`
- Selector: `krn-filter-bar`
- Import: `import { KrnFilterBar } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnFilterBar`
- Lifecycle: **recipe**
- Category: Patterns

Filter Bar. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled typed customer filters
 *
 * Provide typed filter definitions and own the selected value map.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFilterBar, type KrnFilterDefinition } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-filter-bar-agent-example',
  standalone: true,
  imports: [KrnFilterBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-filter-bar ariaLabel="Customer filters" [filters]="filters" [(values)]="filterValues" />
  `,
})
export class KernFilterBarAgentExample {
  readonly filters: readonly KrnFilterDefinition[] = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'healthy', label: 'Healthy', count: 42 },
        { value: 'risk', label: 'At risk', count: 3 },
      ],
    },
    {
      id: 'segment',
      label: 'Segment',
      options: [
        { value: 'enterprise', label: 'Enterprise' },
        { value: 'commercial', label: 'Commercial' },
      ],
    },
  ];

  filterValues: Readonly<Partial<Record<string, string>>> = { status: 'healthy' };
}

void bootstrapApplication(KernFilterBarAgentExample);
```

## API

| Name            | Kind  | Type                                        | Required | Default                                    | Description                                                          |
| --------------- | ----- | ------------------------------------------- | -------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `ariaLabel`     | input | `string`                                    | no       | `this.translations.patterns.filters`       | Accessible name used when visible content is not sufficient.         |
| `allLabel`      | input | `string`                                    | no       | `this.translations.patterns.all`           | Human-readable copy for the all state or control.                    |
| `activeLabel`   | input | `(count: number) => string`                 | no       | `this.translations.patterns.activeFilters` | Human-readable copy for the active state or control.                 |
| `clearAllLabel` | input | `string`                                    | no       | `this.translations.patterns.clearAll`      | Human-readable copy for the clear all state or control.              |
| `filters`       | input | `ReadonlyArray<KrnFilterDefinition>`        | no       | `[]`                                       | Ordered domain values supplied to the filter collection.             |
| `values`        | model | `Readonly<Partial<Record<string, string>>>` | no       | `{}`                                       | Controlled values state with a matching Angular model-change output. |

## Content slots

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

## Interactive playground

Route: `preview/filter-bar`

Scenarios: `default`.
Public API coverage: 0/6
directly controlled; 6 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default  | Test value  | Binding             | Description                                     |
| -------------- | ------- | -------- | ----------- | ------------------- | ----------------------------------------------- |
| `activeFilter` | select  | `"none"` | `"healthy"` | fixture interaction | Changes the deterministic filter-value fixture. |

Exact API exclusions:

| Public API      | Category           | Evidence                                                         | Reason                                                                                                                                                              |
| --------------- | ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeLabel`   | callback           | `component-example:agent/components/filter-bar.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                  |
| `allLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#filter-bar`          | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `ariaLabel`     | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#filter-bar`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                             |
| `clearAllLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#filter-bar`          | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `filters`       | complex-data       | `specimen-fixture:preview/filter-bar?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `values`        | complex-data       | `specimen-fixture:preview/filter-bar?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |

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
- `page-header`

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
