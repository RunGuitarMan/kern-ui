import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnDatePicker,
  KrnFormField,
  KrnHint,
  KrnLabel,
  KrnSelect,
  KrnTextInput,
  KrnValidationMessage,
  type KrnSelectOption,
} from '@kern-ui/angular/kit';

interface CustomerProfile {
  readonly name: string;
  readonly plan: string | null;
  readonly renewalDate: string;
}

@Component({
  selector: 'app-kern-typed-form-recipe',
  standalone: true,
  imports: [
    KrnDatePicker,
    KrnFormField,
    KrnHint,
    KrnLabel,
    KrnSelect,
    KrnTextInput,
    KrnValidationMessage,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="profile" (ngSubmit)="submit()">
      <krn-form-field>
        <krn-label for="customer-name">Customer name</krn-label>
        <krn-text-input
          id="customer-name"
          ariaLabel="Customer name"
          formControlName="name"
          [invalid]="showNameError"
        />
        <krn-hint>Use the legal entity name.</krn-hint>
        @if (showNameError) {
          <krn-validation-message>Customer name is required.</krn-validation-message>
        }
      </krn-form-field>

      <krn-form-field>
        <krn-label for="plan">Plan</krn-label>
        <krn-select
          id="plan"
          ariaLabel="Plan"
          formControlName="plan"
          [options]="plans"
          [invalid]="showPlanError"
        />
        @if (showPlanError) {
          <krn-validation-message>Select a plan.</krn-validation-message>
        }
      </krn-form-field>

      <krn-form-field>
        <krn-label for="renewal-date">Renewal date</krn-label>
        <krn-date-picker
          id="renewal-date"
          ariaLabel="Renewal date"
          today="2026-07-29"
          formControlName="renewalDate"
        />
      </krn-form-field>

      <button type="submit">Save profile</button>
    </form>
    @if (savedProfile; as saved) {
      <p role="status">Saved {{ saved.name }} on the {{ saved.plan }} plan.</p>
    }
  `,
})
export class KernTypedFormRecipe {
  readonly plans: readonly KrnSelectOption<string>[] = [
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' },
  ];
  readonly profile = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    plan: new FormControl<string | null>(null, Validators.required),
    renewalDate: new FormControl('2026-10-15', { nonNullable: true }),
  });
  savedProfile: CustomerProfile | null = null;

  get showNameError(): boolean {
    const control = this.profile.controls.name;
    return control.invalid && (control.dirty || control.touched);
  }

  get showPlanError(): boolean {
    const control = this.profile.controls.plan;
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.profile.markAllAsTouched();
    if (this.profile.invalid) return;
    this.savedProfile = this.profile.getRawValue();
  }
}

void bootstrapApplication(KernTypedFormRecipe);
