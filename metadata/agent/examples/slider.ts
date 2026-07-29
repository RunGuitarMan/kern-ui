/**
 * Typed risk threshold
 *
 * Bind a numeric threshold with explicit range and label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSlider } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-slider-agent-example',
  standalone: true,
  imports: [KrnSlider, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-slider label="Risk threshold" [min]="0" [max]="100" [step]="5" [formControl]="control" />
  `,
})
export class KernSliderAgentExample {
  readonly control = new FormControl<number>(65, { nonNullable: true });
}

void bootstrapApplication(KernSliderAgentExample);
