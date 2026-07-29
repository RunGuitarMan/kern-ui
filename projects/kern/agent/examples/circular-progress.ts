/**
 * Compact sync progress
 *
 * Show known progress where horizontal space is constrained.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCircularProgress } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-circular-progress-agent-example',
  standalone: true,
  imports: [KrnCircularProgress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-circular-progress
      ariaLabel="Account sync progress"
      [value]="72"
      [max]="100"
      [showValue]="true"
    />
  `,
})
export class KernCircularProgressAgentExample {}

void bootstrapApplication(KernCircularProgressAgentExample);
