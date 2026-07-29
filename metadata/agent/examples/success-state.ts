/**
 * Completed import state
 *
 * Confirm completion and identify the next useful destination.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSuccessState } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-success-state-agent-example',
  standalone: true,
  imports: [KrnSuccessState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-success-state
      title="Import complete"
      description="100 customers were added without errors."
    >
      <a href="/customers">Review customers</a>
    </krn-success-state>
  `,
})
export class KernSuccessStateAgentExample {}

void bootstrapApplication(KernSuccessStateAgentExample);
