/**
 * Nullable seat limit
 *
 * Represent an optional numeric value without coercing empty input to zero.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNumberInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-number-input-agent-example',
  standalone: true,
  imports: [KrnNumberInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-number-input
      id="seat-limit"
      ariaLabel="Seat limit"
      [min]="1"
      [max]="10000"
      [formControl]="control"
    />
  `,
})
export class KernNumberInputAgentExample {
  readonly control = new FormControl<number | null>(250, { nonNullable: true });
}

void bootstrapApplication(KernNumberInputAgentExample);
