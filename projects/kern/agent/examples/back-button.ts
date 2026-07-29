/**
 * Explicit back navigation
 *
 * Provide a deterministic href when browser history is not sufficient.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBackButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-back-button-agent-example',
  standalone: true,
  imports: [KrnBackButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-back-button href="/customers" label="Back to customers" /> `,
})
export class KernBackButtonAgentExample {}

void bootstrapApplication(KernBackButtonAgentExample);
