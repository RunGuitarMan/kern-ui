/**
 * Controlled policy disclosure
 *
 * Keep an expandable policy section synchronized with application state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDisclosure } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-disclosure-agent-example',
  standalone: true,
  imports: [KrnDisclosure],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-disclosure heading="Data residency" [(open)]="open">
      Customer data is stored in the EU Central region.
    </krn-disclosure>
  `,
})
export class KernDisclosureAgentExample {
  open = true;
}

void bootstrapApplication(KernDisclosureAgentExample);
