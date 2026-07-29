/**
 * Visible required field label
 *
 * Associate visible copy with its native control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLabel } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-label-agent-example',
  standalone: true,
  imports: [KrnLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-label for="department" [required]="true">Department</krn-label>
    <input id="department" name="department" required />
  `,
})
export class KernLabelAgentExample {}

void bootstrapApplication(KernLabelAgentExample);
