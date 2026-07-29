/**
 * Individual radio option
 *
 * Provide a stable submitted value and visible option label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRadio } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-radio-agent-example',
  standalone: true,
  imports: [KrnRadio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-radio name="plan" value="enterprise">Enterprise plan</krn-radio> `,
})
export class KernRadioAgentExample {}

void bootstrapApplication(KernRadioAgentExample);
