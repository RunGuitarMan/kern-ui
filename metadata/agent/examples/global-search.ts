/**
 * Controlled typed global search
 *
 * Own query, popup and active result state while supplying stable results.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnGlobalSearch, type KrnSearchResult } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-global-search-agent-example',
  standalone: true,
  imports: [KrnGlobalSearch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-global-search
      [results]="results"
      [(query)]="query"
      [(open)]="open"
      [(activeIndex)]="activeIndex"
    />
  `,
})
export class KernGlobalSearchAgentExample {
  readonly results: readonly KrnSearchResult[] = [
    {
      id: 'customer-acme',
      label: 'Acme Europe',
      description: 'Enterprise customer',
      group: 'Customers',
      keywords: ['renewal', 'ada'],
    },
    {
      id: 'report-risk',
      label: 'Risk report',
      description: 'Accounts requiring review',
      group: 'Reports',
    },
  ];

  query = '';

  open = false;

  activeIndex = 0;
}

void bootstrapApplication(KernGlobalSearchAgentExample);
