/**
 * Controlled onboarding progress
 *
 * Drive a linear multi-step flow with typed immutable steps.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnStepper, type KrnStepItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-stepper-agent-example',
  standalone: true,
  imports: [KrnStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-stepper
      ariaLabel="Customer onboarding progress"
      [steps]="steps"
      [linear]="true"
      [completedSteps]="completedSteps"
      [(activeStep)]="activeStep"
    />
  `,
})
export class KernStepperAgentExample {
  readonly steps: readonly KrnStepItem[] = [
    { id: 'company', label: 'Company' },
    { id: 'owners', label: 'Owners' },
    { id: 'review', label: 'Review' },
  ];

  completedSteps: readonly number[] = [0];

  activeStep = 1;
}

void bootstrapApplication(KernStepperAgentExample);
