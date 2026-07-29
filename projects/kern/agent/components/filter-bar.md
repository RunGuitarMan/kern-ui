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
