# Data Grid

- ID: `data-grid`
- Selector: `krn-data-grid`
- Import: `import { KrnDataGrid } from '@kern-ui/angular/addon-grid';`
- Canonical symbol: `KrnDataGrid`
- Lifecycle: **beta**
- Category: Data display

Data Grid. Provides a typed interactive grid with stable row identity, controlled or client data flow, virtualization, and managed cell actions.

## Use

Use Data Grid for interactive tabular data that needs stable row identity, sorting, selection, controlled loading, or fixed-height row virtualization.

Avoid: Use a semantic table for static content, and do not enable virtual mode for variable-height or expandable detail rows.

## Compile-verified standalone Angular example

```ts
/**
 * Typed controlled enterprise data grid
 *
 * Use typed columns, immutable rows, stable identity, sorting and selection state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnDataGrid,
  type KrnDataColumn,
  type KrnDataRowKey,
  type KrnDataSortDirection,
} from '@kern-ui/angular/addon-grid';

interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly risk: number;
}
@Component({
  selector: 'app-kern-data-grid-agent-example',
  standalone: true,
  imports: [KrnDataGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-data-grid
      ariaLabel="Customer portfolio"
      [data]="rows"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [filterable]="true"
      [selectable]="true"
      [(filter)]="filter"
      [(sortKey)]="sortKey"
      [(sortDirection)]="sortDirection"
      [(selected)]="selectedRows"
    />
  `,
})
export class KernDataGridAgentExample {
  readonly rows: readonly CustomerRow[] = [
    { id: 'cus-2048', name: 'Acme Europe', owner: 'Ada Lovelace', risk: 18 },
    { id: 'cus-4096', name: 'Globex', owner: 'Grace Hopper', risk: 72 },
  ];

  readonly columns: readonly KrnDataColumn<CustomerRow>[] = [
    { key: 'name', label: 'Customer', sortable: true, priority: 'primary' },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'risk', label: 'Risk', sortable: true, align: 'end' },
  ];

  readonly rowIdentity = (row: CustomerRow): KrnDataRowKey => row.id;

  filter = '';

  sortKey = 'name';

  sortDirection: KrnDataSortDirection = 'asc';

  selectedRows: ReadonlySet<KrnDataRowKey> = new Set<KrnDataRowKey>();
}

void bootstrapApplication(KernDataGridAgentExample);
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
- Enter or F2 enters the focused cell action; Escape returns to grid navigation.
- Tab enters or leaves the grid without tabbing through every cell.
- Rows, columns, sort direction, selection, and virtual positions are exposed through grid semantics.
- Every source occurrence requires a stable unique rowIdentity result.
- Pinned columns preserve logical reading and focus order in LTR and RTL.

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

- `data-table`
- `pagination`
- `tree`
- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `data`, `columns`, `rowIdentity`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- rowIdentity must return a unique stable key for every source occurrence.
- Do not combine virtual mode with expandable detail rows.
- Use controlled mode for server-owned sorting, filtering and pagination.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
