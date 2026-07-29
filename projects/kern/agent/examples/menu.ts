/**
 * Controlled record action menu
 *
 * Render typed actions and own disclosure state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMenu, type KrnNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-menu-agent-example',
  standalone: true,
  imports: [KrnMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-menu triggerLabel="Record actions" [items]="items" [(open)]="open" /> `,
})
export class KernMenuAgentExample {
  readonly items: readonly (KrnNavigationItem & { readonly shortcut?: string })[] = [
    { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D' },
    { id: 'archive', label: 'Archive' },
  ];

  open = false;
}

void bootstrapApplication(KernMenuAgentExample);
