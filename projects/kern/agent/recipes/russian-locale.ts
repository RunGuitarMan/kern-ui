import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KRN_RU_RU_LOCALE, krnLocaleConfig, provideKrn } from '@kern-ui/angular/core';
import { KrnDatePicker, KrnSelect, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-russian-locale-recipe',
  standalone: true,
  imports: [KrnDatePicker, KrnSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-select ariaLabel="Тариф" [options]="plans" [formControl]="plan" [(open)]="selectOpen" />
    <krn-date-picker ariaLabel="Дата продления" today="2026-07-29" [formControl]="renewalDate" />
  `,
})
export class KernRussianLocaleRecipe {
  readonly plans: readonly KrnSelectOption<string>[] = [
    { value: 'team', label: 'Команда' },
    { value: 'enterprise', label: 'Корпоративный' },
  ];
  readonly plan = new FormControl<string | null>('enterprise');
  readonly renewalDate = new FormControl('2026-10-15', { nonNullable: true });
  selectOpen = false;
}

void bootstrapApplication(KernRussianLocaleRecipe, {
  providers: [provideKrn(krnLocaleConfig(KRN_RU_RU_LOCALE))],
});
