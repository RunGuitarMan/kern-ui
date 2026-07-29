/**
 * Typed report period
 *
 * Select one typed period from stable segment options.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSegmentedControl, type KrnSegmentOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-segmented-control-agent-example',
  standalone: true,
  imports: [KrnSegmentedControl, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-segmented-control
      ariaLabel="Report period"
      [options]="periodOptions"
      [formControl]="control"
    />
  `,
})
export class KernSegmentedControlAgentExample {
  readonly control = new FormControl<string | null>('quarter', { nonNullable: true });

  readonly periodOptions: readonly KrnSegmentOption<string>[] = [
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];
}

void bootstrapApplication(KernSegmentedControlAgentExample);
