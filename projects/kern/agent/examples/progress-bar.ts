/**
 * Deterministic import progress
 *
 * Communicate known progress with a stable accessible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnProgressBar } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-progress-bar-agent-example',
  standalone: true,
  imports: [KrnProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-progress-bar
      ariaLabel="Customer import progress"
      [value]="processed"
      [max]="total"
      valueText="68 of 100 customers"
    />
  `,
})
export class KernProgressBarAgentExample {
  processed = 68;

  readonly total = 100;
}

void bootstrapApplication(KernProgressBarAgentExample);
