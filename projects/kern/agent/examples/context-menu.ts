/**
 * Typed row context actions
 *
 * Provide nested context actions with stable ids.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnContextMenu, type KrnContextMenuItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-context-menu-agent-example',
  standalone: true,
  imports: [KrnContextMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-context-menu ariaLabel="Customer row actions" [items]="items">
      <button type="button">Open row actions</button>
    </krn-context-menu>
  `,
})
export class KernContextMenuAgentExample {
  readonly items: readonly KrnContextMenuItem[] = [
    { id: 'open', label: 'Open customer' },
    {
      id: 'export',
      label: 'Export',
      children: [
        { id: 'export-csv', label: 'CSV' },
        { id: 'export-json', label: 'JSON' },
      ],
    },
  ];
}

void bootstrapApplication(KernContextMenuAgentExample);
