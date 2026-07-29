/**
 * Typed account breadcrumbs
 *
 * Describe hierarchy with a typed immutable breadcrumb collection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBreadcrumbs, type KrnBreadcrumbItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-breadcrumbs-agent-example',
  standalone: true,
  imports: [KrnBreadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-breadcrumbs [items]="items" ariaLabel="Account location" /> `,
})
export class KernBreadcrumbsAgentExample {
  readonly items: readonly KrnBreadcrumbItem[] = [
    { label: 'Customers', href: '/customers' },
    { label: 'Acme Europe', current: true },
  ];
}

void bootstrapApplication(KernBreadcrumbsAgentExample);
