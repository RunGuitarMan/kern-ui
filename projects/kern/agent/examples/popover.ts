/**
 * Controlled contextual popover
 *
 * Compose trigger and content while keeping disclosure state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnPopover } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-popover-agent-example',
  standalone: true,
  imports: [KrnPopover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-popover [(open)]="open" ariaLabel="Account health details">
      <span krnPopoverTrigger>Health details</span>
      <p>Three checks passed and one requires attention.</p>
    </krn-popover>
  `,
})
export class KernPopoverAgentExample {
  open = false;
}

void bootstrapApplication(KernPopoverAgentExample);
