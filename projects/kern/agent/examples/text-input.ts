/**
 * Typed account-name input
 *
 * Bind a non-nullable text control with an explicit accessible name.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTextInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-text-input-agent-example',
  standalone: true,
  imports: [KrnTextInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-text-input
      id="account-name"
      ariaLabel="Account name"
      autocomplete="organization"
      [formControl]="control"
    />
  `,
})
export class KernTextInputAgentExample {
  readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });
}

void bootstrapApplication(KernTextInputAgentExample);
