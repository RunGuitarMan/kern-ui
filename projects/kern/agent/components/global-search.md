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
- closed
- open

## Interactive playground

Route: `preview/global-search`

Scenarios: `default`.
Public API coverage: 5/11
directly controlled; 6 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                                  | Test value                                           | Binding                        | Description                                    |
| ------------- | ------- | ---------------------------------------- | ---------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `query`       | text    | `""`                                     | `"Alternate value"`                                  | model `query`                  | Changes the active search query.               |
| `activeIndex` | number  | `0`                                      | `1`                                                  | model `activeIndex`            | Changes the active result index.               |
| `open`        | boolean | `false`                                  | `true`                                               | model `open`                   | Opens the search result surface.               |
| `maxResults`  | number  | `8`                                      | `9`                                                  | input `maxResults` (property)  | Configures the component maxResults contract.  |
| `placeholder` | text    | `"Search workspaces, projects, people…"` | `"Search workspaces, projects, people… · alternate"` | input `placeholder` (property) | Configures the component placeholder contract. |

Exact API exclusions:

| Public API          | Category           | Evidence                                                            | Reason                                                                                                                                                              |
| ------------------- | ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`         | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#global-search`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                             |
| `clearLabel`        | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#global-search`          | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `emptyResultsLabel` | callback           | `component-example:agent/components/global-search.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                  |
| `results`           | complex-data       | `specimen-fixture:preview/global-search?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `resultsId`         | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#global-search`          | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid.                                                       |
| `resultsLabel`      | callback           | `component-example:agent/components/global-search.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                  |

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
- `closed` — closed; scenario `default`; `open=false`; fixture effect `data/alternate` — closed: The fixture data projection is changed for this acceptance state..
- `open` — Open; scenario `default`; `open=true`.

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
