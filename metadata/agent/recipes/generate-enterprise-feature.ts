import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDataGrid, type KrnDataColumn, type KrnDataRowKey } from '@kern-ui/angular/addon-grid';
import { KrnFormField, KrnLabel, KrnTextInput } from '@kern-ui/angular/kit';
import { KrnCrudToolbar, KrnMasterDetailLayout } from '@kern-ui/angular/patterns';

interface Customer {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
}

@Component({
  selector: 'app-kern-generated-enterprise-feature',
  standalone: true,
  imports: [
    KrnCrudToolbar,
    KrnDataGrid,
    KrnFormField,
    KrnLabel,
    KrnMasterDetailLayout,
    KrnTextInput,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-crud-toolbar ariaLabel="Customer actions" [selectedCount]="selected.size">
      <strong krnToolbarTitle>Customers</strong>
      <button type="button" (click)="createCustomer()">Create customer</button>
      <button type="button" [disabled]="selected.size === 0" (click)="archiveSelected()">
        Archive selected
      </button>
    </krn-crud-toolbar>

    <krn-master-detail-layout
      masterLabel="Customers"
      detailLabel="Customer details"
      [(detailOpen)]="detailOpen"
    >
      <section krnMaster>
        <krn-data-grid
          ariaLabel="Customers"
          [data]="rows()"
          [columns]="columns"
          [rowIdentity]="rowIdentity"
          [selectable]="true"
          [(selected)]="selected"
        />
        <button type="button" (click)="openSelected()">Open selected customer</button>
      </section>
      <section krnDetail>
        <krn-form-field>
          <krn-label for="customer-name">Customer name</krn-label>
          <krn-text-input id="customer-name" ariaLabel="Customer name" [formControl]="name" />
        </krn-form-field>
        <button type="button" (click)="detailOpen = false">Back to customers</button>
      </section>
    </krn-master-detail-layout>
  `,
})
export class KernGeneratedEnterpriseFeature {
  readonly rows = signal<readonly Customer[]>([
    { id: 'cus-2048', name: 'Acme Europe', owner: 'Ada Lovelace' },
    { id: 'cus-4096', name: 'Globex', owner: 'Grace Hopper' },
  ]);
  readonly columns: readonly KrnDataColumn<Customer>[] = [
    { key: 'name', label: 'Customer', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
  ];
  readonly rowIdentity = (row: Customer): KrnDataRowKey => row.id;
  readonly name = new FormControl('', { nonNullable: true });

  selected: ReadonlySet<KrnDataRowKey> = new Set();
  detailOpen = false;

  createCustomer(): void {
    this.name.setValue('');
    this.detailOpen = true;
  }

  openSelected(): void {
    const id = this.selected.values().next().value;
    const customer = this.rows().find((row) => row.id === id);
    if (!customer) return;
    this.name.setValue(customer.name);
    this.detailOpen = true;
  }

  archiveSelected(): void {
    const selected = this.selected;
    this.rows.update((rows) => rows.filter((row) => !selected.has(row.id)));
    this.selected = new Set();
  }
}

void bootstrapApplication(KernGeneratedEnterpriseFeature);
