/**
 * Controlled typed onboarding form
 *
 * Supply required typed steps and own current and furthest progress.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMultiStepForm, type KrnFormStep } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-multi-step-form-agent-example',
  standalone: true,
  imports: [KrnMultiStepForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-multi-step-form
      ariaLabel="Customer onboarding"
      [steps]="steps"
      [(current)]="currentStep"
      [(furthestStep)]="furthestStep"
    >
      <p>Complete the current onboarding section.</p>
    </krn-multi-step-form>
  `,
})
export class KernMultiStepFormAgentExample {
  readonly steps: readonly KrnFormStep[] = [
    { id: 'company', label: 'Company', valid: true },
    { id: 'owners', label: 'Owners', valid: false },
    { id: 'review', label: 'Review', optional: true },
  ];

  currentStep = 1;

  furthestStep = 1;
}

void bootstrapApplication(KernMultiStepFormAgentExample);
