import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  KrnDataGrid,
  type KrnDataColumn,
  type KrnDataGridMode,
  type KrnDataRowKey,
} from '@kern-ui/angular/addon-grid';
import {
  KrnAvatar,
  KrnBadge,
  KrnCodeBlock,
  KrnCopyButton,
  KrnNumberInput,
} from '@kern-ui/angular/kit';

import { DocsI18n } from '../docs-i18n';

type OrderStatus = 'Paid' | 'Pending' | 'Refunded';
type TaskStatus = 'Completed' | 'In progress' | 'Pending';

interface OrderExample {
  readonly id: string;
  readonly customer: string;
  readonly date: string;
  readonly status: OrderStatus;
  readonly amount: number;
  readonly accent: 'rose' | 'sky' | 'amber' | 'violet' | 'mint';
}

interface CartLineExample {
  readonly id: string;
  readonly item: string;
  readonly quantity: number;
  readonly price: number;
}

interface TaskExample {
  readonly id: string;
  readonly task: string;
  readonly status: TaskStatus;
}

const ORDERS_EXAMPLE_CODE = `import { Component } from '@angular/core';
import { KrnDataGrid, type KrnDataColumn } from '@kern-ui/angular/addon-grid';
import { KrnAvatar, KrnBadge } from '@kern-ui/angular/kit';

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly date: string;
  readonly status: 'Paid' | 'Pending' | 'Refunded';
  readonly amount: number;
}

@Component({
  selector: 'app-orders-grid',
  imports: [KrnDataGrid, KrnAvatar, KrnBadge],
  template: \`
    <ng-template #cell let-value let-row="row" let-column="column">
      @switch (column.key) {
        @case ('customer') {
          <span class="customer">
            <krn-avatar size="sm" [name]="row.customer" />
            <span><strong>{{ row.customer }}</strong><small>{{ row.date }}</small></span>
          </span>
        }
        @case ('status') {
          <krn-badge status [tone]="tone(row.status)">
            {{ row.status }}
          </krn-badge>
        }
        @case ('amount') { {{ money(row.amount) }} }
        @default { {{ value }} }
      }
    </ng-template>

    <krn-data-grid
      ariaLabel="Recent customer orders"
      filterPlaceholder="Find an order or customer"
      [data]="orders"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [mode]="mode"
      [defaultCellTemplate]="cell"
      [columnChooser]="true"
    />
  \`,
  styles: [\`
    .customer { display: inline-flex; align-items: center; gap: .75rem; }
    .customer > span { display: grid; gap: .125rem; }
    .customer small { color: var(--krn-color-text-muted); font-size: .75rem; }
  \`],
})
export class OrdersGrid {
  readonly mode = { kind: 'client', pagination: false } as const;
  readonly orders: readonly Order[] = [
    { id: '#3210', customer: 'Olivia Martin', date: 'Feb 1, 2026', status: 'Paid', amount: 1999 },
    { id: '#3209', customer: 'Jackson Lee', date: 'Jan 28, 2026', status: 'Pending', amount: 39 },
    { id: '#3208', customer: 'Isabella Nguyen', date: 'Jan 25, 2026', status: 'Paid', amount: 299 },
  ];
  readonly columns: readonly KrnDataColumn<Order>[] = [
    { key: 'id', label: 'Order', sortable: true, width: 110 },
    { key: 'customer', label: 'Customer', sortable: true, width: 270,
      filterValue: (row) => \`\${row.customer} \${row.date}\` },
    { key: 'status', label: 'Status', sortable: true, width: 140 },
    { key: 'amount', label: 'Amount', sortable: true, align: 'end', width: 160 },
  ];
  readonly rowIdentity = (row: Order) => row.id;
  readonly currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  tone(status: Order['status']) {
    return status === 'Paid' ? 'success' : status === 'Pending' ? 'warning' : 'danger';
  }
  money(value: number) { return this.currency.format(value); }
}`;

const QUANTITY_EXAMPLE_CODE = `import { Component, computed, signal } from '@angular/core';
import { KrnDataGrid, type KrnDataColumn } from '@kern-ui/angular/addon-grid';
import { KrnNumberInput } from '@kern-ui/angular/kit';

interface OrderLine {
  readonly id: string;
  readonly item: string;
  readonly quantity: number;
  readonly price: number;
}

@Component({
  selector: 'app-order-editor-grid',
  imports: [KrnDataGrid, KrnNumberInput],
  template: \`
    <ng-template #cell let-value let-row="row" let-column="column">
      @switch (column.key) {
        @case ('quantity') {
          <krn-number-input
            [ariaLabel]="'Quantity for ' + row.item"
            [value]="row.quantity"
            [min]="0"
            [max]="99"
            [showSteppers]="false"
            (valueChange)="updateQuantity(row.id, $event)"
          />
        }
        @case ('total') { {{ money(row.price * row.quantity) }} }
        @default { {{ value }} }
      }
    </ng-template>

    <krn-data-grid
      ariaLabel="Editable order quantities"
      [data]="lines()"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [mode]="mode"
      [defaultCellTemplate]="cell"
      [filterable]="false"
      [resizable]="false"
    />
    <p class="total"><span>Total</span><strong>{{ money(total()) }}</strong></p>
  \`,
})
export class OrderEditorGrid {
  readonly mode = { kind: 'client', pagination: false } as const;
  readonly lines = signal<readonly OrderLine[]>([
    { id: 'alpha', item: 'Item Alpha', quantity: 1, price: 10 },
    { id: 'beta', item: 'Item Beta', quantity: 2, price: 20 },
    { id: 'gamma', item: 'Item Gamma', quantity: 1, price: 30 },
  ]);
  readonly columns: readonly KrnDataColumn<OrderLine>[] = [
    { key: 'item', label: 'Item', width: 160 },
    { key: 'quantity', label: 'Quantity', width: 120 },
    { key: 'total', label: 'Price', accessor: (row) => row.price * row.quantity,
      align: 'end', width: 110 },
  ];
  readonly rowIdentity = (row: OrderLine) => row.id;
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.price * line.quantity, 0),
  );
  readonly currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  updateQuantity(id: string, quantity: number | null): void {
    if (quantity === null) return;
    this.lines.update((lines) =>
      lines.map((line) => line.id === id ? { ...line, quantity } : line),
    );
  }
  money(value: number) { return this.currency.format(value); }
}`;

const TASKS_EXAMPLE_CODE = `import { Component } from '@angular/core';
import { KrnDataGrid, type KrnDataColumn } from '@kern-ui/angular/addon-grid';
import { KrnBadge } from '@kern-ui/angular/kit';

interface Task {
  readonly id: string;
  readonly task: string;
  readonly status: 'Completed' | 'In progress' | 'Pending';
}

@Component({
  selector: 'app-task-status-grid',
  imports: [KrnDataGrid, KrnBadge],
  template: \`
    <ng-template #cell let-value let-row="row" let-column="column">
      @if (column.key === 'status') {
        <krn-badge status [tone]="tone(row.status)">{{ row.status }}</krn-badge>
      } @else { {{ value }} }
    </ng-template>

    <krn-data-grid
      ariaLabel="Delivery task status"
      [data]="tasks"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [mode]="mode"
      [defaultCellTemplate]="cell"
      [filterable]="false"
      [resizable]="false"
      [compact]="true"
    />
  \`,
})
export class TaskStatusGrid {
  readonly mode = { kind: 'client', pagination: false } as const;
  readonly tasks: readonly Task[] = [
    { id: 'design', task: 'Design homepage', status: 'Completed' },
    { id: 'api', task: 'Implement API', status: 'In progress' },
    { id: 'tests', task: 'Write tests', status: 'Pending' },
  ];
  readonly columns: readonly KrnDataColumn<Task>[] = [
    { key: 'task', label: 'Task', width: 240 },
    { key: 'status', label: 'Status', align: 'end', width: 150 },
  ];
  readonly rowIdentity = (row: Task) => row.id;

  tone(status: Task['status']) {
    return status === 'Completed' ? 'success' : status === 'In progress' ? 'warning' : 'neutral';
  }
}`;

@Component({
  selector: 'kdocs-data-grid-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnDataGrid, KrnAvatar, KrnBadge, KrnCodeBlock, KrnCopyButton, KrnNumberInput],
  templateUrl: './data-grid-examples.html',
  styleUrl: './data-grid-examples.css',
})
export class DataGridExamples {
  protected readonly i18n = inject(DocsI18n);
  protected readonly ordersCode = ORDERS_EXAMPLE_CODE;
  protected readonly quantityCode = QUANTITY_EXAMPLE_CODE;
  protected readonly tasksCode = TASKS_EXAMPLE_CODE;
  protected readonly staticMode: KrnDataGridMode = { kind: 'client', pagination: false };

  protected readonly orders: readonly OrderExample[] = [
    {
      id: '#3210',
      customer: 'Olivia Martin',
      date: 'Feb 1, 2026',
      status: 'Paid',
      amount: 1999,
      accent: 'rose',
    },
    {
      id: '#3209',
      customer: 'Jackson Lee',
      date: 'Jan 28, 2026',
      status: 'Pending',
      amount: 39,
      accent: 'sky',
    },
    {
      id: '#3208',
      customer: 'Isabella Nguyen',
      date: 'Jan 25, 2026',
      status: 'Paid',
      amount: 299,
      accent: 'amber',
    },
    {
      id: '#3207',
      customer: 'William Kim',
      date: 'Jan 22, 2026',
      status: 'Refunded',
      amount: 99,
      accent: 'violet',
    },
    {
      id: '#3206',
      customer: 'Sofia Davis',
      date: 'Jan 18, 2026',
      status: 'Paid',
      amount: 2500,
      accent: 'mint',
    },
  ];
  protected readonly orderColumns = computed<readonly KrnDataColumn<OrderExample>[]>(() => [
    { key: 'id', label: this.i18n.t('grid.order', 'Order'), sortable: true, width: 110 },
    {
      key: 'customer',
      label: this.i18n.t('grid.customer', 'Customer'),
      sortable: true,
      width: 270,
      filterValue: (row) => `${row.customer} ${row.date}`,
    },
    { key: 'status', label: this.i18n.t('grid.status', 'Status'), sortable: true, width: 140 },
    {
      key: 'amount',
      label: this.i18n.t('grid.amount', 'Amount'),
      sortable: true,
      align: 'end',
      width: 160,
    },
  ]);
  protected readonly orderIdentity = (row: OrderExample): KrnDataRowKey => row.id;

  protected readonly cartLines = signal<readonly CartLineExample[]>([
    { id: 'alpha', item: 'Item Alpha', quantity: 1, price: 10 },
    { id: 'beta', item: 'Item Beta', quantity: 2, price: 20 },
    { id: 'gamma', item: 'Item Gamma', quantity: 1, price: 30 },
  ]);
  protected readonly cartColumns = computed<readonly KrnDataColumn<CartLineExample>[]>(() => [
    { key: 'item', label: this.i18n.t('grid.item', 'Item'), width: 160 },
    { key: 'quantity', label: this.i18n.t('grid.quantity', 'Quantity'), width: 120 },
    {
      key: 'total',
      label: this.i18n.t('grid.price', 'Price'),
      accessor: (row) => row.price * row.quantity,
      align: 'end',
      width: 110,
    },
  ]);
  protected readonly cartIdentity = (row: CartLineExample): KrnDataRowKey => row.id;
  protected readonly cartTotal = computed(() =>
    this.cartLines().reduce((sum, line) => sum + line.quantity * line.price, 0),
  );

  protected readonly tasks: readonly TaskExample[] = [
    { id: 'design', task: 'Design homepage', status: 'Completed' },
    { id: 'api', task: 'Implement API', status: 'In progress' },
    { id: 'tests', task: 'Write tests', status: 'Pending' },
  ];
  protected readonly taskColumns = computed<readonly KrnDataColumn<TaskExample>[]>(() => [
    { key: 'task', label: this.i18n.t('grid.task', 'Task'), width: 240 },
    { key: 'status', label: this.i18n.t('grid.status', 'Status'), align: 'end', width: 150 },
  ]);
  protected readonly taskIdentity = (row: TaskExample): KrnDataRowKey => row.id;

  private readonly currency = computed(
    () =>
      new Intl.NumberFormat(this.i18n.russian() ? 'ru-RU' : 'en-US', {
        style: 'currency',
        currency: 'USD',
      }),
  );

  protected orderTone(status: OrderStatus): 'success' | 'warning' | 'danger' {
    if (status === 'Paid') return 'success';
    if (status === 'Pending') return 'warning';
    return 'danger';
  }

  protected taskTone(status: TaskStatus): 'success' | 'warning' | 'neutral' {
    if (status === 'Completed') return 'success';
    if (status === 'In progress') return 'warning';
    return 'neutral';
  }

  protected updateQuantity(id: string, quantity: number | null): void {
    if (quantity === null) return;
    this.cartLines.update((lines) =>
      lines.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  }

  protected money(value: number): string {
    return this.currency().format(value);
  }

  protected orderStatusLabel(status: OrderStatus): string {
    return {
      Paid: this.i18n.t('grid.paid', 'Paid'),
      Pending: this.i18n.t('grid.pending', 'Pending'),
      Refunded: this.i18n.t('grid.refunded', 'Refunded'),
    }[status];
  }

  protected taskStatusLabel(status: TaskStatus): string {
    return {
      Completed: this.i18n.t('grid.completed', 'Completed'),
      'In progress': this.i18n.t('grid.inProgress', 'In progress'),
      Pending: this.i18n.t('grid.pending', 'Pending'),
    }[status];
  }

  protected taskLabel(task: string): string {
    return (
      {
        'Design homepage': this.i18n.t('grid.designHomepage', 'Design homepage'),
        'Implement API': this.i18n.t('grid.implementApi', 'Implement API'),
        'Write tests': this.i18n.t('grid.writeTests', 'Write tests'),
      }[task] ?? task
    );
  }

  protected itemLabel(item: string): string {
    return (
      {
        'Item Alpha': this.i18n.t('grid.itemAlpha', 'Item Alpha'),
        'Item Beta': this.i18n.t('grid.itemBeta', 'Item Beta'),
        'Item Gamma': this.i18n.t('grid.itemGamma', 'Item Gamma'),
      }[item] ?? item
    );
  }

  protected orderDate(date: string): string {
    if (!this.i18n.russian()) return date;
    return (
      {
        'Feb 1, 2026': '1 февр. 2026 г.',
        'Jan 28, 2026': '28 янв. 2026 г.',
        'Jan 25, 2026': '25 янв. 2026 г.',
        'Jan 22, 2026': '22 янв. 2026 г.',
        'Jan 18, 2026': '18 янв. 2026 г.',
      }[date] ?? date
    );
  }
}
