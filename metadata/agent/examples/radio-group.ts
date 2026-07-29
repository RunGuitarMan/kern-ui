/**
 * Typed billing-cycle choice
 *
 * Bind one selected value while composing visible radio options.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRadio, KrnRadioGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-radio-group-agent-example',
  standalone: true,
  imports: [KrnRadioGroup, ReactiveFormsModule, KrnRadio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-radio-group label="Billing cycle" [formControl]="control">
      <krn-radio value="monthly">Monthly</krn-radio>
      <krn-radio value="annual">Annual</krn-radio>
    </krn-radio-group>
  `,
})
export class KernRadioGroupAgentExample {
  readonly control = new FormControl<string | null>('annual', { nonNullable: true });
}

void bootstrapApplication(KernRadioGroupAgentExample);
