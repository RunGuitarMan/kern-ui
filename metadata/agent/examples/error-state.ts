/**
 * Recoverable report error
 *
 * Describe a failed load and expose a recovery action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnErrorState } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-error-state-agent-example',
  standalone: true,
  imports: [KrnErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-error-state
      title="Report unavailable"
      description="The latest report could not be loaded."
    >
      <button type="button">Try again</button>
    </krn-error-state>
  `,
})
export class KernErrorStateAgentExample {}

void bootstrapApplication(KernErrorStateAgentExample);
