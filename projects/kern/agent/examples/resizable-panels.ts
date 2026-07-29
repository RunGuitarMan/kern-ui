/**
 * Controlled resizable workspace
 *
 * Compose panels and a keyboard-operable resize handle with owned sizes.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResizablePanel, KrnResizablePanels, KrnResizeHandle } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-resizable-panels-agent-example',
  standalone: true,
  imports: [KrnResizablePanels, KrnResizablePanel, KrnResizeHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-resizable-panels [(sizes)]="panelSizes" orientation="horizontal">
      <krn-resizable-panel id="customer-list" ariaLabel="Customer list">
        Customer list
      </krn-resizable-panel>
      <krn-resize-handle ariaLabel="Resize customer list and details" />
      <krn-resizable-panel id="customer-detail" ariaLabel="Customer details">
        Customer details
      </krn-resizable-panel>
    </krn-resizable-panels>
  `,
})
export class KernResizablePanelsAgentExample {
  panelSizes: readonly number[] = [38, 62];
}

void bootstrapApplication(KernResizablePanelsAgentExample);
