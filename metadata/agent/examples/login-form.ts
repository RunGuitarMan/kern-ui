/**
 * Typed enterprise sign-in form
 *
 * Handle typed submitted credentials and loading state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLoginForm, type KrnLoginCredentials } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-login-form-agent-example',
  standalone: true,
  imports: [KrnLoginForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-login-form
      recoveryHref="/recover-access"
      [loading]="submitting"
      (submitted)="submit($event)"
    />
  `,
})
export class KernLoginFormAgentExample {
  submitting = false;

  lastSubmission: KrnLoginCredentials | null = null;

  submit(credentials: KrnLoginCredentials): void {
    this.lastSubmission = credentials;
    this.submitting = true;
  }
}

void bootstrapApplication(KernLoginFormAgentExample);
