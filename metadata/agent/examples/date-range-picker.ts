/**
 * Typed reporting period
 *
 * Bind an explicit ISO start and end date range.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDateRangePicker, type KrnDateRangeValue } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-date-range-picker-agent-example',
  standalone: true,
  imports: [KrnDateRangePicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-date-range-picker
      ariaLabel="Reporting period"
      locale="en-GB"
      today="2026-07-29"
      [formControl]="control"
    />
  `,
})
export class KernDateRangePickerAgentExample {
  readonly control = new FormControl<KrnDateRangeValue>(
    { start: '2026-07-01', end: '2026-09-30' },
    { nonNullable: true },
  );
}

void bootstrapApplication(KernDateRangePickerAgentExample);
