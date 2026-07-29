/**
 * Typed chart accent color
 *
 * Bind a normalized color value for user-configurable reporting.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnColorPicker } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-color-picker-agent-example',
  standalone: true,
  imports: [KrnColorPicker, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-color-picker pickerLabel="Chart accent" textLabel="Hex color" [formControl]="control" />
  `,
})
export class KernColorPickerAgentExample {
  readonly control = new FormControl<string>('#4666da', { nonNullable: true });
}

void bootstrapApplication(KernColorPickerAgentExample);
