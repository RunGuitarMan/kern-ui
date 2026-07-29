/**
 * Typed application menubar
 *
 * Expose a compact keyboard-oriented application menu.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMenubar, type KrnNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-menubar-agent-example',
  standalone: true,
  imports: [KrnMenubar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-menubar ariaLabel="Application menu" [items]="items" /> `,
})
export class KernMenubarAgentExample {
  readonly items: readonly KrnNavigationItem[] = [
    { id: 'customers', label: 'Customers', href: '/customers' },
    { id: 'reports', label: 'Reports', href: '/reports' },
  ];
}

void bootstrapApplication(KernMenubarAgentExample);
