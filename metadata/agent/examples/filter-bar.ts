/**
 * Controlled typed customer filters
 *
 * Provide typed filter definitions and own the selected value map.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFilterBar, type KrnFilterDefinition } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-filter-bar-agent-example',
  standalone: true,
  imports: [KrnFilterBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-filter-bar ariaLabel="Customer filters" [filters]="filters" [(values)]="filterValues" />
  `,
})
export class KernFilterBarAgentExample {
  readonly filters: readonly KrnFilterDefinition[] = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'healthy', label: 'Healthy', count: 42 },
        { value: 'risk', label: 'At risk', count: 3 },
      ],
    },
    {
      id: 'segment',
      label: 'Segment',
      options: [
        { value: 'enterprise', label: 'Enterprise' },
        { value: 'commercial', label: 'Commercial' },
      ],
    },
  ];

  filterValues: Readonly<Partial<Record<string, string>>> = { status: 'healthy' };
}

void bootstrapApplication(KernFilterBarAgentExample);
