/**
 * Controlled document contents
 *
 * Track the active heading against stable document ids.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTableOfContents, type KrnTocItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-table-of-contents-agent-example',
  standalone: true,
  imports: [KrnTableOfContents],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-table-of-contents
      title="Onboarding guide"
      [items]="items"
      [observe]="false"
      [(activeId)]="activeId"
    />
  `,
})
export class KernTableOfContentsAgentExample {
  readonly items: readonly KrnTocItem[] = [
    { id: 'company', label: 'Company', level: 2 },
    { id: 'owners', label: 'Owners', level: 2 },
    { id: 'permissions', label: 'Permissions', level: 3 },
  ];

  activeId: string | null = 'company';
}

void bootstrapApplication(KernTableOfContentsAgentExample);
