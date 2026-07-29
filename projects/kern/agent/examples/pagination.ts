/**
 * Controlled customer pagination
 *
 * Keep the current one-based page in application state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPagination } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-pagination-agent-example',
  standalone: true,
  imports: [KrnPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-pagination [totalItems]="245" [pageSize]="25" [(page)]="page" ariaLabel="Customer pages" />
  `,
})
export class KernPaginationAgentExample {
  page = 1;
}

void bootstrapApplication(KernPaginationAgentExample);
