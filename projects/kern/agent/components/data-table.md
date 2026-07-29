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
- empty
- error
- sorted
- filtered
- selected rows
- virtualized
- pinned columns

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
