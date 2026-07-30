# Data Table

- ID: `data-table`
- Selector: `krn-data-table`
- Import: `import { KrnDataTable } from '@kern-ui/angular/addon-grid';`
- Canonical symbol: `KrnDataGrid`
- Lifecycle: **beta**
- Category: Data display

Data Table. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use Data Table as the Data Grid alias when product language prefers table while retaining the same interactive contract.

Avoid: Use a native table for read-only content that does not need grid navigation, selection, or virtualization.

## Compile-verified standalone Angular example

```ts
/**
 * Typed controlled customer table
 *
 * Provide typed rows, typed columns and stable domain identity.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDataTable, type KrnDataColumn, type KrnDataRowKey } from '@kern-ui/angular/addon-grid';

interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly arr: number;
}
@Component({
  selector: 'app-kern-data-table-agent-example',
  standalone: true,
  imports: [KrnDataTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-data-table
      ariaLabel="Customer portfolio"
      [data]="rows"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [(page)]="page"
      [(selected)]="selectedRows"
    />
  `,
})
export class KernDataTableAgentExample {
  readonly rows: readonly CustomerRow[] = [
    { id: 'cus-2048', name: 'Acme Europe', owner: 'Ada Lovelace', arr: 1800000 },
    { id: 'cus-4096', name: 'Globex', owner: 'Grace Hopper', arr: 920000 },
  ];

  readonly columns: readonly KrnDataColumn<CustomerRow>[] = [
    { key: 'name', label: 'Customer', sortable: true, priority: 'primary' },
    { key: 'owner', label: 'Owner', sortable: true },
    {
      key: 'arr',
      label: 'ARR',
      align: 'end',
      format: (value) =>
        new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(value),
    },
  ];

  readonly rowIdentity = (row: CustomerRow): KrnDataRowKey => row.id;

  page = 1;

  selectedRows: ReadonlySet<KrnDataRowKey> = new Set<KrnDataRowKey>();
}

void bootstrapApplication(KernDataTableAgentExample);
```

## API

| Name                    | Kind   | Type                                           | Required | Default                                        | Description                                                                            |
| ----------------------- | ------ | ---------------------------------------------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `data`                  | input  | `ReadonlyArray<T>`                             | yes      | `required`                                     | Immutable data supplied by the consumer.                                               |
| `columns`               | input  | `ReadonlyArray<KrnDataColumn<T>>`              | yes      | `required`                                     | Typed column definitions with stable keys.                                             |
| `rowIdentity`           | input  | `(row: T, index: number) => KrnDataRowKey`     | yes      | `required`                                     | Returns a stable unique key for every source row occurrence.                           |
| `mode`                  | input  | `KrnDataGridMode \| null`                      | no       | `null`                                         | Discriminated operating mode that selects the component data and interaction contract. |
| `labels`                | input  | `Partial<KrnDataGridTranslations>`             | no       | `{}`                                           | Localized copy overrides for the component-owned interface text.                       |
| `ariaLabel`             | input  | `string`                                       | no       | `this.translations.dataGrid.ariaLabel`         | Accessible name used when visible content is not sufficient.                           |
| `loading`               | input  | `boolean`                                      | no       | `false`                                        | Prevents duplicate actions and exposes accessible busy state.                          |
| `error`                 | input  | `string`                                       | no       | `''`                                           | Current failure message or error state exposed by asynchronous content.                |
| `emptyLabel`            | input  | `string`                                       | no       | `this.translations.dataGrid.empty`             | Accessible copy that explains the empty state.                                         |
| `filterable`            | input  | `boolean`                                      | no       | `true`                                         | Enables the grid-owned text filtering interface.                                       |
| `filterPlaceholder`     | input  | `string`                                       | no       | `this.translations.dataGrid.filterPlaceholder` | Short hint displayed in the grid filter input before a query is entered.               |
| `filterPredicate`       | input  | `KrnDataFilterPredicate<T> \| null`            | no       | `null`                                         | Determines whether a row matches the current filter query.                             |
| `selectable`            | input  | `boolean`                                      | no       | `false`                                        | Enables row selection and the corresponding selected-key contract.                     |
| `expandable`            | input  | `boolean`                                      | no       | `false`                                        | Controls whether the component applies the expandable behavior.                        |
| `expandedContent`       | input  | `(row: T) => string`                           | no       | `() => ''`                                     | Template or projected content used to render expanded.                                 |
| `expandedTemplate`      | input  | `TemplateRef<KrnDataRowContext<T>> \| null`    | no       | `null`                                         | Template or projected content used to render expanded.                                 |
| `defaultCellTemplate`   | input  | `TemplateRef<KrnDataCellContext<T>> \| null`   | no       | `null`                                         | Template or projected content used to render default cell.                             |
| `defaultHeaderTemplate` | input  | `TemplateRef<KrnDataHeaderContext<T>> \| null` | no       | `null`                                         | Template or projected content used to render default header.                           |
| `resizable`             | input  | `boolean`                                      | no       | `true`                                         | Enables pointer and keyboard resizing for supported columns or panels.                 |
| `pagination`            | input  | `boolean`                                      | no       | `true`                                         | Enables client pagination or supplies the controlled paging configuration.             |
| `compact`               | input  | `boolean`                                      | no       | `false`                                        | Uses the reduced-density presentation intended for constrained data views.             |
| `virtualize`            | input  | `boolean`                                      | no       | `false`                                        | Enables fixed-height row virtualization for large data collections.                    |
| `viewportHeight`        | input  | `number`                                       | no       | `360`                                          | Measured virtual viewport height used to determine visible rows.                       |
| `pageSize`              | input  | `number`                                       | no       | `10`                                           | Maximum number of records requested or displayed on one page.                          |
| `columnChooser`         | input  | `boolean`                                      | no       | `false`                                        | Enables the grid-owned control for changing visible columns.                           |
| `filter`                | model  | `string`                                       | no       | `''`                                           | Controlled filter state with a matching Angular model-change output.                   |
| `page`                  | model  | `number`                                       | no       | `1`                                            | One-based controlled page index.                                                       |
| `selected`              | model  | `ReadonlySet<KrnDataRowKey>`                   | no       | `new Set<KrnDataRowKey>()`                     | Controlled selected state, distinct from keyboard focus.                               |
| `expanded`              | model  | `ReadonlySet<KrnDataRowKey>`                   | no       | `new Set<KrnDataRowKey>()`                     | Controlled expanded state for a disclosure or hierarchical item.                       |
| `hiddenColumnKeys`      | model  | `ReadonlySet<string>`                          | no       | `new Set<string>()`                            | Stable column keys excluded from the current grid presentation.                        |
| `sortKey`               | model  | `string`                                       | no       | `''`                                           | Stable column key that owns the current sort operation.                                |
| `sortDirection`         | model  | `KrnDataSortDirection`                         | no       | `'asc'`                                        | Current ascending, descending, or unsorted direction.                                  |
| `queryChange`           | output | `KrnDataGridQuery`                             | no       | `undefined`                                    | Notifies the consumer after the query change interaction completes.                    |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys, Home, End, Page Up, and Page Down move the single roving grid focus.
- Enter or F2 enters a cell action; Escape restores grid navigation.
- Tab enters or leaves the table as one composite widget.
- Data Table deliberately exposes grid semantics because it is an alias of Data Grid.
- Stable row identity is mandatory across sorting, filtering, and paging.
- Interactive cell content participates in managed action mode rather than the page tab sequence.

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
- loading
- selected
- unselected
- closed
- open
- empty
- error
- sorted
- filtered
- selected rows
- virtualized
- pinned columns

## Interactive playground

Route: `preview/data-table`

Scenarios: `default`, `states`, `stress`.
Public API coverage: 17/32
directly controlled; 15 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument            | Control | Default          | Test value                   | Binding                              | Description                                                      |
| ------------------- | ------- | ---------------- | ---------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| `dataState`         | select  | `"ready"`        | `"empty"`                    | fixture data                         | Shows ready, empty, or large datasets.                           |
| `resizable`         | boolean | `false`          | `true`                       | input `resizable` (property)         | Allows pointer and keyboard column resizing.                     |
| `pagination`        | boolean | `false`          | `true`                       | input `pagination` (property)        | Paginates the table rows.                                        |
| `compact`           | boolean | `false`          | `true`                       | input `compact` (property)           | Uses the compact row treatment.                                  |
| `pageSize`          | number  | `4`              | `5`                          | input `pageSize` (property)          | Sets rows per page.                                              |
| `filter`            | text    | `""`             | `"Alternate value"`          | model `filter`                       | Changes the active row filter.                                   |
| `page`              | number  | `1`              | `2`                          | model `page`                         | Changes the active page.                                         |
| `sortDirection`     | select  | `"asc"`          | `"desc"`                     | model `sortDirection`                | Changes the active sort direction.                               |
| `sortKey`           | text    | `""`             | `"usage"`                    | model `sortKey`                      | Changes the active sort column.                                  |
| `filterPlaceholder` | text    | `"Filter rows…"` | `"Filter rows… · alternate"` | input `filterPlaceholder` (property) | Uses locale-aware filter copy until explicitly changed.          |
| `columnChooser`     | boolean | `false`          | `true`                       | input `columnChooser` (property)     | Configures the component columnChooser contract.                 |
| `error`             | text    | `""`             | `"Alternate value"`          | input `error` (property)             | Configures the component error contract.                         |
| `expandable`        | boolean | `false`          | `true`                       | input `expandable` (property)        | Configures the component expandable contract.                    |
| `filterable`        | boolean | `true`           | `false`                      | input `filterable` (property)        | Configures the component filterable contract.                    |
| `loading`           | boolean | `false`          | `true`                       | input `loading` (property)           | Prevents duplicate actions and exposes an accessible busy state. |
| `selectable`        | boolean | `false`          | `true`                       | input `selectable` (property)        | Configures the component selectable contract.                    |
| `viewportHeight`    | number  | `360`            | `361`                        | input `viewportHeight` (property)    | Configures the component viewportHeight contract.                |
| `virtualize`        | boolean | `false`          | `true`                       | input `virtualize` (property)        | Configures the component virtualize contract.                    |

Exact API exclusions:

| Public API              | Category           | Evidence                                                         | Reason                                                                                                                                                              |
| ----------------------- | ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`             | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#data-table`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                             |
| `columns`               | complex-data       | `specimen-fixture:preview/data-table?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `data`                  | complex-data       | `specimen-fixture:preview/data-table?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `defaultCellTemplate`   | template           | `component-example:agent/components/data-table.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                          |
| `defaultHeaderTemplate` | template           | `component-example:agent/components/data-table.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                          |
| `emptyLabel`            | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#data-table`          | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `expanded`              | complex-data       | `specimen-fixture:preview/data-table?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `expandedContent`       | callback           | `component-example:agent/components/data-table.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                  |
| `expandedTemplate`      | template           | `component-example:agent/components/data-table.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.                                                          |
| `filterPredicate`       | callback           | `component-example:agent/components/data-table.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                  |
| `hiddenColumnKeys`      | complex-data       | `specimen-fixture:preview/data-table?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `labels`                | translation-object | `locale-preview:preview/data-table?locale=ru-RU`                 | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                                                                 |
| `mode`                  | complex-data       | `specimen-fixture:preview/data-table?state=default`              | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                    |
| `rowIdentity`           | callback           | `component-example:agent/components/data-table.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                  |
| `selected`              | complex-data       | `specimen-fixture:preview/data-table?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `stress`; fixture effect `data/alternate` — overflow: The fixture data projection is changed for this acceptance state..
- `long-text` — long text; scenario `stress`; fixture effect `data/alternate` — long text: The fixture data projection is changed for this acceptance state..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — disabled; scenario `default`; fixture effect `data/alternate` — disabled: The fixture data projection is changed for this acceptance state..
- `loading` — Loading; scenario `default`; `loading=true`.
- `selected` — selected; scenario `default`; fixture effect `data/selected` — selected: The fixture data projection is changed for this acceptance state..
- `unselected` — unselected; scenario `default`; fixture effect `data/selected` — unselected: The fixture data projection is changed for this acceptance state..
- `closed` — closed; scenario `default`; fixture effect `data/alternate` — closed: The fixture data projection is changed for this acceptance state..
- `open` — open; scenario `default`; fixture effect `data/alternate` — open: The fixture data projection is changed for this acceptance state..
- `empty` — Empty; scenario `default`; `dataState="empty"`.
- `error` — error; scenario `default`; fixture effect `data/error` — error: The fixture data request failed and can be retried..
- `sorted` — sorted; scenario `default`; fixture effect `data/sorted` — sorted: The fixture data projection is changed for this acceptance state..
- `filtered` — filtered; scenario `default`; fixture effect `data/filtered` — filtered: The fixture data projection is changed for this acceptance state..
- `selected-rows` — selected rows; scenario `default`; fixture effect `data/selected` — selected rows: The fixture data projection is changed for this acceptance state..
- `virtualized` — virtualized; scenario `default`; fixture effect `data/virtualized` — virtualized: The fixture data projection is changed for this acceptance state..
- `pinned-columns` — Pinned columns; scenario `states`.
- `compact-rows` — Compact Rows; scenario `default`; `compact=true`.
- `stress` — Stress; scenario `stress`; `dataState="stress"`.

## Related

- `data-grid`
- `pagination`
- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `data`, `columns`, `rowIdentity`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Data Table is an alias of Data Grid; follow the same stable rowIdentity contract.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
