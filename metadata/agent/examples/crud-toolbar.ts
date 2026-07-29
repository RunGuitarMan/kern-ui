/**
 * Customer CRUD toolbar
 *
 * Compose a title and actions while exposing selection count.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCrudToolbar } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-crud-toolbar-agent-example',
  standalone: true,
  imports: [KrnCrudToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-crud-toolbar ariaLabel="Customer actions" [selectedCount]="selectedCount">
      <strong krnToolbarTitle>Customers</strong>
      <button type="button">Create customer</button>
      <button type="button" [disabled]="selectedCount === 0">Archive selected</button>
    </krn-crud-toolbar>
  `,
})
export class KernCrudToolbarAgentExample {
  selectedCount = 2;
}

void bootstrapApplication(KernCrudToolbarAgentExample);
