# Global Search

- ID: `global-search`
- Selector: `krn-global-search`
- Import: `import { KrnGlobalSearch } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnGlobalSearch`
- Lifecycle: **recipe**
- Category: Patterns

Global Search. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled typed global search
 *
 * Own query, popup and active result state while supplying stable results.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnGlobalSearch, type KrnSearchResult } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-global-search-agent-example',
  standalone: true,
  imports: [KrnGlobalSearch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-global-search
      [results]="results"
      [(query)]="query"
      [(open)]="open"
      [(activeIndex)]="activeIndex"
    />
  `,
})
export class KernGlobalSearchAgentExample {
  readonly results: readonly KrnSearchResult[] = [
    {
      id: 'customer-acme',
      label: 'Acme Europe',
      description: 'Enterprise customer',
      group: 'Customers',
      keywords: ['renewal', 'ada'],
    },
    {
      id: 'report-risk',
      label: 'Risk report',
      description: 'Accounts requiring review',
      group: 'Reports',
    },
  ];

  query = '';

  open = false;

  activeIndex = 0;
}

void bootstrapApplication(KernGlobalSearchAgentExample);
```

## API

| Name                | Kind   | Type                             | Required | Default                                        | Description                                                            |
| ------------------- | ------ | -------------------------------- | -------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| `ariaLabel`         | input  | `string`                         | no       | `this.translations.patterns.globalSearch`      | Accessible name used when visible content is not sufficient.           |
| `placeholder`       | input  | `string`                         | no       | `this.translations.patterns.searchPlaceholder` | Short input hint shown only while no value is present.                 |
| `clearLabel`        | input  | `string`                         | no       | `this.translations.patterns.clearSearch`       | Human-readable copy for the clear state or control.                    |
| `resultsLabel`      | input  | `(label: string) => string`      | no       | `this.translations.patterns.resultLabel`       | Human-readable copy for the results state or control.                  |
| `emptyResultsLabel` | input  | `(query: string) => string`      | no       | `this.translations.patterns.noSearchResults`   | Accessible copy announced when a search has no matching results.       |
| `results`           | input  | `ReadonlyArray<KrnSearchResult>` | no       | `[]`                                           | Search result collection rendered in response to the current query.    |
| `maxResults`        | input  | `number`                         | no       | `8`                                            | Upper or lower bound applied to the results value.                     |
| `resultsId`         | input  | `string`                         | no       | `this.ids.next('global-search-results')`       | Stable identifier value used by the results contract.                  |
| `query`             | model  | `string`                         | no       | `''`                                           | Current controlled search text used to derive visible results.         |
| `open`              | model  | `boolean`                        | no       | `false`                                        | Controls whether the disclosure or overlay surface is visible.         |
| `activeIndex`       | model  | `number`                         | no       | `0`                                            | Zero-based index currently participating in managed keyboard focus.    |
| `resultSelected`    | output | `KrnSearchResult`                | no       | `undefined`                                    | Notifies the consumer after the result selected interaction completes. |

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

## Related

- `user-menu`
- `notification-center`
- `filter-bar`
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
