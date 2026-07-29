import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnDataGrid,
  KrnDataGridDataSource,
  type KrnDataColumn,
  type KrnDataGridControlledMode,
  type KrnDataGridPage,
  type KrnDataGridQuery,
  type KrnDataRowKey,
  type KrnDataSortDirection,
} from '@kern-ui/angular/addon-grid';

interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly risk: number;
}

const initialQuery: KrnDataGridQuery = {
  filter: '',
  page: 1,
  pageSize: 25,
  sortKey: 'name',
  sortDirection: 'asc',
};

@Component({
  selector: 'app-kern-controlled-grid-recipe',
  standalone: true,
  imports: [KrnDataGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-data-grid
      ariaLabel="Customer portfolio"
      [data]="source.data()"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [mode]="mode()"
      [loading]="source.loading()"
      [error]="source.error() ?? ''"
      [pageSize]="pageSize"
      [(filter)]="filter"
      [(page)]="page"
      [(sortKey)]="sortKey"
      [(sortDirection)]="sortDirection"
      (queryChange)="load($event)"
    />
    @if (source.error()) {
      <button type="button" (click)="retry()">Retry customer query</button>
    }
  `,
})
export class KernControlledGridRecipe implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly columns: readonly KrnDataColumn<CustomerRow>[] = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      pinned: 'start',
      minWidth: 220,
    },
    { key: 'owner', label: 'Owner', sortable: true, minWidth: 180 },
    { key: 'risk', label: 'Risk', sortable: true, align: 'end', pinned: 'end' },
  ];
  readonly rowIdentity = (row: CustomerRow): KrnDataRowKey => row.id;
  readonly source = new KrnDataGridDataSource<CustomerRow>(
    (query, { signal }) => this.loadPage(query, signal),
    {
      initialPage: {
        data: [{ id: 'cus-2048', name: 'Acme Europe', owner: 'Ada Lovelace', risk: 18 }],
        totalRows: 1,
      },
      errorMessage: () => 'Customers could not be loaded.',
    },
  );
  readonly mode = computed<KrnDataGridControlledMode>(() => ({
    kind: 'controlled',
    totalRows: this.source.totalRows(),
  }));

  filter = initialQuery.filter;
  page = initialQuery.page;
  pageSize = initialQuery.pageSize;
  sortKey = initialQuery.sortKey;
  sortDirection: KrnDataSortDirection = initialQuery.sortDirection;

  constructor() {
    this.destroyRef.onDestroy(() => this.source.disconnect());
  }

  ngOnInit(): void {
    void this.source.load(initialQuery);
  }

  load(query: KrnDataGridQuery): void {
    this.filter = query.filter;
    this.page = query.page;
    this.pageSize = query.pageSize;
    this.sortKey = query.sortKey;
    this.sortDirection = query.sortDirection;
    void this.source.load(query);
  }

  retry(): void {
    void this.source.reload();
  }

  private async loadPage(
    query: Readonly<KrnDataGridQuery>,
    signal: AbortSignal,
  ): Promise<KrnDataGridPage<CustomerRow>> {
    const response = await fetch('/api/customers/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(query),
      signal,
    });
    if (!response.ok) throw new Error(`Customer query failed with ${response.status}.`);
    const payload: unknown = await response.json();
    if (!isCustomerPage(payload)) throw new TypeError('Customer query returned an invalid page.');
    return payload;
  }
}

function isCustomerPage(value: unknown): value is KrnDataGridPage<CustomerRow> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { data?: unknown; totalRows?: unknown };
  return (
    Array.isArray(candidate.data) &&
    candidate.data.every(isCustomerRow) &&
    typeof candidate.totalRows === 'number' &&
    Number.isSafeInteger(candidate.totalRows) &&
    candidate.totalRows >= 0
  );
}

function isCustomerRow(value: unknown): value is CustomerRow {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Record<keyof CustomerRow, unknown>>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.owner === 'string' &&
    candidate.owner.trim().length > 0 &&
    typeof candidate.risk === 'number' &&
    Number.isFinite(candidate.risk)
  );
}

void bootstrapApplication(KernControlledGridRecipe);
