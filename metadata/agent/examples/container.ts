/**
 * Bounded content container
 *
 * Center page content with a stable readable width.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnContainer } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-container-agent-example',
  standalone: true,
  imports: [KrnContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-container size="lg">
      <h1>Customer portfolio</h1>
      <p>Review ownership, risk and renewal dates.</p>
    </krn-container>
  `,
})
export class KernContainerAgentExample {}

void bootstrapApplication(KernContainerAgentExample);
