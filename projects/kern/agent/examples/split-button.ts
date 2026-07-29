/**
 * Primary export with alternatives
 *
 * Keep the default action prominent and expose related export formats.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSplitButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-split-button-agent-example',
  standalone: true,
  imports: [KrnSplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-split-button [(open)]="open">
      <span krnLabel>Export CSV</span>
      <div krnMenu>
        <button type="button">Export XLSX</button>
        <button type="button">Export JSON</button>
      </div>
    </krn-split-button>
  `,
})
export class KernSplitButtonAgentExample {
  open = false;
}

void bootstrapApplication(KernSplitButtonAgentExample);
