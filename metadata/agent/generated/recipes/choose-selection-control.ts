import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnAutocomplete,
  KrnCombobox,
  KrnMultiSelect,
  KrnNativeSelect,
  KrnSelect,
  KrnTagsInput,
  type KrnSelectOption,
} from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-selection-recipe',
  standalone: true,
  imports: [
    KrnAutocomplete,
    KrnCombobox,
    KrnMultiSelect,
    KrnNativeSelect,
    KrnSelect,
    KrnTagsInput,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-native-select ariaLabel="Region" [options]="regions" [formControl]="region" />
    <krn-select ariaLabel="Plan" [options]="plans" [formControl]="plan" />
    <krn-multi-select ariaLabel="Reviewers" [options]="teams" [formControl]="reviewers" />
    <krn-combobox ariaLabel="Owning team" [options]="teams" [formControl]="owner" />
    <krn-autocomplete ariaLabel="Customer name" [options]="customers" [formControl]="customer" />
    <krn-tags-input label="Tags" [formControl]="tags" />
  `,
})
export class KernSelectionRecipe {
  readonly regions: readonly KrnSelectOption<string>[] = [
    { value: 'eu-central', label: 'EU Central' },
    { value: 'us-east', label: 'US East' },
  ];
  readonly plans: readonly KrnSelectOption<string>[] = [
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' },
  ];
  readonly teams: readonly KrnSelectOption<string>[] = [
    { value: 'platform', label: 'Platform' },
    { value: 'security', label: 'Security' },
  ];
  readonly customers: readonly KrnSelectOption<string>[] = [
    { value: 'Acme Europe', label: 'Acme Europe' },
    { value: 'Acme Americas', label: 'Acme Americas' },
  ];

  readonly region = new FormControl<string | null>('eu-central');
  readonly plan = new FormControl<string | null>('enterprise');
  readonly reviewers = new FormControl<readonly string[]>(['security'], { nonNullable: true });
  readonly owner = new FormControl('platform', { nonNullable: true });
  readonly customer = new FormControl('Acme Europe', { nonNullable: true });
  readonly tags = new FormControl<readonly string[]>(['renewal'], { nonNullable: true });
}

void bootstrapApplication(KernSelectionRecipe);
