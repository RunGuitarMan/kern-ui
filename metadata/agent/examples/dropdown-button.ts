/**
 * Controlled bulk-action menu
 *
 * Expose secondary actions while retaining owned open state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDropdownButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-dropdown-button-agent-example',
  standalone: true,
  imports: [KrnDropdownButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-dropdown-button [(open)]="open">
      <span krnLabel>Bulk actions</span>
      <div krnMenu>
        <button type="button">Assign owner</button>
        <button type="button">Archive</button>
      </div>
    </krn-dropdown-button>
  `,
})
export class KernDropdownButtonAgentExample {
  open = false;
}

void bootstrapApplication(KernDropdownButtonAgentExample);
