/**
 * Selected-customer bulk actions
 *
 * Use the bulk-action alias with explicit selected record count.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBulkActions } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-bulk-actions-agent-example',
  standalone: true,
  imports: [KrnBulkActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-bulk-actions ariaLabel="Selected customer actions" [selectedCount]="selectedCount">
      <strong krnToolbarTitle>{{ selectedCount }} customers selected</strong>
      <button type="button">Assign owner</button>
      <button type="button">Archive</button>
    </krn-bulk-actions>
  `,
})
export class KernBulkActionsAgentExample {
  selectedCount = 3;
}

void bootstrapApplication(KernBulkActionsAgentExample);
