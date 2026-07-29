/**
 * Empty customer portfolio
 *
 * Explain the absence of records and provide a next action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnEmptyState } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-empty-state-agent-example',
  standalone: true,
  imports: [KrnEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-empty-state
      title="No customers yet"
      description="Create the first customer to start tracking renewals."
    >
      <button type="button">Create customer</button>
    </krn-empty-state>
  `,
})
export class KernEmptyStateAgentExample {}

void bootstrapApplication(KernEmptyStateAgentExample);
