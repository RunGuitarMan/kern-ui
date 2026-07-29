/**
 * Typed notification channels
 *
 * Bind a stable array of selected string values.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCheckbox, KrnCheckboxGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-checkbox-group-agent-example',
  standalone: true,
  imports: [KrnCheckboxGroup, ReactiveFormsModule, KrnCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-checkbox-group label="Notification channels" [formControl]="control">
      <krn-checkbox value="email">Email</krn-checkbox>
      <krn-checkbox value="slack">Slack</krn-checkbox>
    </krn-checkbox-group>
  `,
})
export class KernCheckboxGroupAgentExample {
  readonly control = new FormControl<readonly string[]>(['email'], { nonNullable: true });
}

void bootstrapApplication(KernCheckboxGroupAgentExample);
