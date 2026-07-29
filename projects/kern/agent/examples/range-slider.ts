/**
 * Typed contract-value range
 *
 * Bind start and end values through the public range value type.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRangeSlider, type KrnRangeValue } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-range-slider-agent-example',
  standalone: true,
  imports: [KrnRangeSlider, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-range-slider
      label="Contract value range"
      startLabel="Minimum value"
      endLabel="Maximum value"
      [min]="0"
      [max]="100"
      [formControl]="control"
    />
  `,
})
export class KernRangeSliderAgentExample {
  readonly control = new FormControl<KrnRangeValue>({ start: 20, end: 80 }, { nonNullable: true });
}

void bootstrapApplication(KernRangeSliderAgentExample);
