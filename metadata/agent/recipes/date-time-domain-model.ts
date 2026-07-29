import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnDatePicker,
  KrnFormField,
  KrnLabel,
  KrnNativeSelect,
  KrnTimePicker,
  type KrnSelectOption,
} from '@kern-ui/angular/kit';

interface ScheduledLocalTime {
  readonly date: string;
  readonly time: string;
  readonly timeZone: string;
}

@Component({
  selector: 'app-kern-date-time-recipe',
  standalone: true,
  imports: [
    KrnDatePicker,
    KrnFormField,
    KrnLabel,
    KrnNativeSelect,
    KrnTimePicker,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="schedule" (ngSubmit)="save()">
      <krn-form-field>
        <krn-label for="maintenance-date">Maintenance date</krn-label>
        <krn-date-picker
          id="maintenance-date"
          ariaLabel="Maintenance date"
          today="2026-07-29"
          formControlName="date"
        />
      </krn-form-field>
      <krn-form-field>
        <krn-label for="maintenance-time">Maintenance time</krn-label>
        <krn-time-picker
          id="maintenance-time"
          ariaLabel="Maintenance time"
          formControlName="time"
        />
      </krn-form-field>
      <krn-form-field>
        <krn-label for="maintenance-zone">Time zone</krn-label>
        <krn-native-select
          id="maintenance-zone"
          ariaLabel="Time zone"
          [options]="timeZones"
          formControlName="timeZone"
        />
      </krn-form-field>
      <button type="submit">Save maintenance window</button>
    </form>
    @if (saved; as value) {
      <p role="status">{{ value.date }} at {{ value.time }} ({{ value.timeZone }})</p>
    }
  `,
})
export class KernDateTimeRecipe {
  readonly timeZones: readonly KrnSelectOption<string>[] = [
    { value: 'Europe/Moscow', label: 'Europe/Moscow' },
    { value: 'UTC', label: 'UTC' },
  ];
  readonly schedule = new FormGroup({
    date: new FormControl('2026-08-14', { nonNullable: true }),
    time: new FormControl('18:30', { nonNullable: true }),
    timeZone: new FormControl('Europe/Moscow', { nonNullable: true }),
  });

  saved: ScheduledLocalTime | null = null;

  save(): void {
    this.saved = this.schedule.getRawValue();
  }
}

void bootstrapApplication(KernDateTimeRecipe);
