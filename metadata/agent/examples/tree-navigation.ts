/**
 * Controlled product navigation tree
 *
 * Own selected and expanded ids for a typed nested navigation model.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTreeNavigation, type KrnTreeNavigationItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tree-navigation-agent-example',
  standalone: true,
  imports: [KrnTreeNavigation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tree-navigation
      ariaLabel="Product navigation"
      [items]="items"
      [(selectedId)]="selectedId"
      [(expandedIds)]="expandedIds"
    />
  `,
})
export class KernTreeNavigationAgentExample {
  readonly items: readonly KrnTreeNavigationItem[] = [
    {
      id: 'customers',
      label: 'Customers',
      children: [
        { id: 'active-customers', label: 'Active' },
        { id: 'risk-customers', label: 'At risk' },
      ],
    },
  ];

  selectedId: string | null = 'active-customers';

  expandedIds: readonly string[] = ['customers'];
}

void bootstrapApplication(KernTreeNavigationAgentExample);
