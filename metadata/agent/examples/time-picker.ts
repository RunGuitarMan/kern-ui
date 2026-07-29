/**
 * Typed maintenance time
 *
 * Bind a 24-hour time string within an allowed operating window.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTimePicker } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-time-picker-agent-example',
  standalone: true,
  imports: [KrnTimePicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-time-picker
      ariaLabel="Maintenance start"
      min="06:00"
      max="22:00"
      [formControl]="control"
    />
  `,
})
export class KernTimePickerAgentExample {
  readonly control = new FormControl<string>('18:30', { nonNullable: true });
}

void bootstrapApplication(KernTimePickerAgentExample);
