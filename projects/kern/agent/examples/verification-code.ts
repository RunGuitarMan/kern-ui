/**
 * Typed six-digit verification code
 *
 * Bind the complete code as one string while rendering segmented inputs.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnVerificationCode } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-verification-code-agent-example',
  standalone: true,
  imports: [KrnVerificationCode, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-verification-code label="Verification code" [length]="6" [formControl]="control" />
  `,
})
export class KernVerificationCodeAgentExample {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

void bootstrapApplication(KernVerificationCodeAgentExample);
