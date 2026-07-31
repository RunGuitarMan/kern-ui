# Pagination

- ID: `pagination`
- Selector: `krn-pagination`
- Import: `import { KrnPagination } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnPagination`
- Lifecycle: **stable**
- Category: Navigation

Pagination. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled customer pagination
 *
 * Keep the current one-based page in application state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPagination } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-pagination-agent-example',
  standalone: true,
  imports: [KrnPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-pagination [totalItems]="245" [pageSize]="25" [(page)]="page" ariaLabel="Customer pages" />
  `,
})
export class KernPaginationAgentExample {
  page = 1;
}

void bootstrapApplication(KernPaginationAgentExample);
```

## API

| Name                  | Kind  | Type                                                                   | Required | Default                                         | Description                                                      |
| --------------------- | ----- | ---------------------------------------------------------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `totalItems`          | input | `number`                                                               | no       | `0`                                             | Total result count used to calculate the available page range.   |
| `pageSize`            | input | `number`                                                               | no       | `20`                                            | Maximum number of records requested or displayed on one page.    |
| `siblingCount`        | input | `number`                                                               | no       | `1`                                             | Total number of peer items used to expose hierarchical position. |
| `page`                | model | `number`                                                               | no       | `1`                                             | One-based controlled page index.                                 |
| `ariaLabel`           | input | `string`                                                               | no       | `this.translations.navigation.pagination`       | Accessible name used when visible content is not sufficient.     |
| `previousLabel`       | input | `string`                                                               | no       | `this.translations.navigation.previous`         | Human-readable copy for the previous state or control.           |
| `nextLabel`           | input | `string`                                                               | no       | `this.translations.navigation.next`             | Human-readable copy for the next state or control.               |
| `pageLabel`           | input | `string`                                                               | no       | `this.translations.navigation.pageLabel`        | Backward-compatible `{page}` template.                           |
| `pageLabelFormatter`  | input | `((page: number) => string) \| undefined`                              | no       | `undefined`                                     | Typed alternative to `pageLabel` for locale-specific grammar.    |
| `emptyLabel`          | input | `string`                                                               | no       | `this.translations.navigation.noResults`        | Accessible copy that explains the empty state.                   |
| `rangeLabel`          | input | `string`                                                               | no       | `this.translations.navigation.resultRangeLabel` | Backward-compatible `{start}`, `{end}`, and `{total}` template.  |
| `rangeLabelFormatter` | input | `((start: number, end: number, total: number) => string) \| undefined` | no       | `undefined`                                     | Typed alternative to `rangeLabel` for locale-specific grammar.   |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys move within composites
- Home / End jump
- Enter activates
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
- hover
- focus-visible
- active
- disabled
- current

## Interactive playground

Route: `preview/pagination`

Scenarios: `default`.
Public API coverage: 4/12
directly controlled; 8 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default | Test value | Binding                         | Description                               |
| -------------- | ------- | ------- | ---------- | ------------------------------- | ----------------------------------------- |
| `totalItems`   | number  | `248`   | `249`      | input `totalItems` (property)   | Sets the result count.                    |
| `pageSize`     | number  | `20`    | `21`       | input `pageSize` (property)     | Sets results per page.                    |
| `siblingCount` | number  | `1`     | `2`        | input `siblingCount` (property) | Sets pages shown beside the current page. |
| `page`         | number  | `1`     | `2`        | model `page`                    | Controls the active page.                 |

Exact API exclusions:

| Public API            | Category           | Evidence                                                         | Reason                                                                                                                                                               |
| --------------------- | ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`           | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#pagination`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `emptyLabel`          | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#pagination`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `nextLabel`           | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#pagination`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `pageLabel`           | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#pagination`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `pageLabelFormatter`  | callback           | `component-example:agent/components/pagination.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                   |
| `previousLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#pagination`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `rangeLabel`          | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#pagination`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `rangeLabelFormatter` | callback           | `component-example:agent/components/pagination.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                   |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `current` — current; scenario `default`; fixture effect `status/neutral` — current: The fixture exposes the current status without claiming a public component input..

## Related

- `breadcrumbs`
- `tabs`
- `vertical-tabs`
- `stepper`

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
