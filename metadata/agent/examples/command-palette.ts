/**
 * Controlled command palette
 *
 * Own query and open state while supplying typed commands.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCommandPalette, type KrnCommandItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-command-palette-agent-example',
  standalone: true,
  imports: [KrnCommandPalette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open commands</button>
    <krn-command-palette [items]="commands" [(query)]="query" [(open)]="open" />
  `,
})
export class KernCommandPaletteAgentExample {
  readonly commands: readonly KrnCommandItem[] = [
    {
      id: 'create-customer',
      label: 'Create customer',
      group: 'Customers',
      shortcut: 'C',
      keywords: ['new', 'account'],
    },
    {
      id: 'open-audit-log',
      label: 'Open audit log',
      group: 'Security',
      shortcut: 'A',
    },
  ];

  query = '';

  open = false;
}

void bootstrapApplication(KernCommandPaletteAgentExample);
