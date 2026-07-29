/**
 * Typed password entry
 *
 * Bind password state without reading values from the component instance.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPasswordInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-password-input-agent-example',
  standalone: true,
  imports: [KrnPasswordInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-password-input
      id="password"
      ariaLabel="Password"
      autocomplete="current-password"
      [formControl]="control"
    />
  `,
})
export class KernPasswordInputAgentExample {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

void bootstrapApplication(KernPasswordInputAgentExample);
