/**
 * Centered empty-state copy
 *
 * Constrain and center a short content block.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCenter } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-center-agent-example',
  standalone: true,
  imports: [KrnCenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-center maxWidth="32rem" [intrinsic]="true">
      <h2>No incidents</h2>
      <p>All monitored services are currently healthy.</p>
    </krn-center>
  `,
})
export class KernCenterAgentExample {}

void bootstrapApplication(KernCenterAgentExample);
