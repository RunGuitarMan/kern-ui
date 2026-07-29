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
