/**
 * Labeled reactive form field
 *
 * Compose visible label, control and hint around one typed FormControl.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFormField, KrnHint, KrnLabel, KrnTextInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-form-field-agent-example',
  standalone: true,
  imports: [KrnFormField, ReactiveFormsModule, KrnHint, KrnLabel, KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field>
      <krn-label for="account-name">Account name</krn-label>
      <krn-text-input id="account-name" [formControl]="control" ariaLabel="Account name" />
      <krn-hint>Use the legal customer name.</krn-hint>
    </krn-form-field>
  `,
})
export class KernFormFieldAgentExample {
  readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });
}

void bootstrapApplication(KernFormFieldAgentExample);
