/**
 * Typed audit-alert switch
 *
 * Bind a boolean preference with a visible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSwitch } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-switch-agent-example',
  standalone: true,
  imports: [KrnSwitch, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-switch [formControl]="control"> Send an alert when audit policy changes </krn-switch>
  `,
})
export class KernSwitchAgentExample {
  readonly control = new FormControl<boolean>(true, { nonNullable: true });
}

void bootstrapApplication(KernSwitchAgentExample);
