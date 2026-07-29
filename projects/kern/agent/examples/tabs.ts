/**
 * Controlled account tabs
 *
 * Use stable ids and application-owned selected tab state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTabs, type KrnTabItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tabs-agent-example',
  standalone: true,
  imports: [KrnTabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tabs ariaLabel="Account sections" [items]="items" [(value)]="selectedTab">
      Selected section: {{ selectedTab }}
    </krn-tabs>
  `,
})
export class KernTabsAgentExample {
  readonly items: readonly KrnTabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity', badge: 4 },
    { id: 'settings', label: 'Settings' },
  ];

  selectedTab: string | null = 'overview';
}

void bootstrapApplication(KernTabsAgentExample);
