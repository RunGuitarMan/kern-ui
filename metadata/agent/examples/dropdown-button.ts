/**
 * Controlled bulk-action menu
 *
 * Expose keyboard-operable secondary actions with controlled state and scoped placement.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDropdownButton, provideKrnMenuButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-dropdown-button-agent-example',
  standalone: true,
  imports: [KrnDropdownButton],
  providers: [
    provideKrnMenuButtonOptions({
      menuAlign: 'start',
      matchTriggerWidth: true,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-dropdown-button [(open)]="open">
      <span krnLabel>Bulk actions</span>
      <button krnMenu type="button">Assign owner</button>
      <button krnMenu type="button">Archive</button>
    </krn-dropdown-button>
  `,
})
export class KernDropdownButtonAgentExample {
  open = false;
}

void bootstrapApplication(KernDropdownButtonAgentExample);
