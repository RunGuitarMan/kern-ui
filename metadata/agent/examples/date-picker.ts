/**
 * Typed renewal date
 *
 * Bind an ISO date string with explicit locale and reference date.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDatePicker } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-date-picker-agent-example',
  standalone: true,
  imports: [KrnDatePicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-date-picker
      ariaLabel="Renewal date"
      locale="en-GB"
      today="2026-07-29"
      [formControl]="control"
    />
  `,
})
export class KernDatePickerAgentExample {
  readonly control = new FormControl<string>('2026-10-15', { nonNullable: true });
}

void bootstrapApplication(KernDatePickerAgentExample);
