import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDataGrid, type KrnDataColumn } from '@kern-ui/angular';

interface WorkspaceRow {
  readonly id: number;
  readonly name: string;
  readonly members: number;
}

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnDataGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-data-grid [columns]="columns" [data]="rows" [rowIdentity]="rowIdentity" /> `,
})
class GridConsumer {
  protected readonly columns: readonly KrnDataColumn<WorkspaceRow>[] = [
    { key: 'name', label: 'Workspace' },
    { key: 'members', label: 'Members', align: 'end' },
  ];
  protected readonly rows: readonly WorkspaceRow[] = [
    { id: 1, name: 'Platform', members: 12 },
    { id: 2, name: 'Operations', members: 8 },
  ];
  protected readonly rowIdentity = (row: WorkspaceRow): number => row.id;
}

void bootstrapApplication(GridConsumer);
