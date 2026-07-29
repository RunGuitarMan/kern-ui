/**
 * Controlled settings tabs
 *
 * Use vertical orientation for a stable settings subsection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnVerticalTabs, type KrnTabItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-vertical-tabs-agent-example',
  standalone: true,
  imports: [KrnVerticalTabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-vertical-tabs ariaLabel="Settings sections" [items]="items" [(value)]="selectedTab">
      Selected settings section: {{ selectedTab }}
    </krn-vertical-tabs>
  `,
})
export class KernVerticalTabsAgentExample {
  readonly items: readonly KrnTabItem[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
  ];

  selectedTab: string | null = 'profile';
}

void bootstrapApplication(KernVerticalTabsAgentExample);
