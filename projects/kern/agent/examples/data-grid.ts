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
