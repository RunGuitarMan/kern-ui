/**
 * Persistent warning alert
 *
 * Communicate a recoverable issue with title and supporting action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAlert } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-alert-agent-example',
  standalone: true,
  imports: [KrnAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-alert tone="warning" title="Verification required">
      Confirm the billing owner before the next renewal.
      <button type="button">Review owner</button>
    </krn-alert>
  `,
})
export class KernAlertAgentExample {}

void bootstrapApplication(KernAlertAgentExample);
