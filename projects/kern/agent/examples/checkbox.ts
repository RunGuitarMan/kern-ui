/**
 * Typed policy acknowledgement
 *
 * Bind a boolean consent value through Angular Forms.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCheckbox } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-checkbox-agent-example',
  standalone: true,
  imports: [KrnCheckbox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-checkbox [formControl]="control">
      I confirm the account owner has approved this change.
    </krn-checkbox>
  `,
})
export class KernCheckboxAgentExample {
  readonly control = new FormControl<boolean>(false, { nonNullable: true });
}

void bootstrapApplication(KernCheckboxAgentExample);
