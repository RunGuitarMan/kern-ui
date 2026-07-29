/**
 * Actionable validation message
 *
 * Explain how to correct an invalid form value.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnValidationMessage } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-validation-message-agent-example',
  standalone: true,
  imports: [KrnValidationMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-validation-message id="email-error">
      Enter a complete business email address.
    </krn-validation-message>
  `,
})
export class KernValidationMessageAgentExample {}

void bootstrapApplication(KernValidationMessageAgentExample);
