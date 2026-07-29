/**
 * Vertical form stack
 *
 * Apply consistent vertical rhythm to related content.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnStack } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-stack-agent-example',
  standalone: true,
  imports: [KrnStack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-stack gap="4">
      <h2>Billing profile</h2>
      <p>Invoices are sent to the finance owner.</p>
      <button type="button">Edit profile</button>
    </krn-stack>
  `,
})
export class KernStackAgentExample {}

void bootstrapApplication(KernStackAgentExample);
