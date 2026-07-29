/**
 * Indeterminate loading status
 *
 * Announce a short unknown-duration operation.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSpinner } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-spinner-agent-example',
  standalone: true,
  imports: [KrnSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-spinner label="Loading audit log" /> `,
})
export class KernSpinnerAgentExample {}

void bootstrapApplication(KernSpinnerAgentExample);
