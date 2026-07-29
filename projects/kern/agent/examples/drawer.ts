/**
 * Controlled details drawer
 *
 * Show supporting record details without replacing list context.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDrawer } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-drawer-agent-example',
  standalone: true,
  imports: [KrnDrawer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Customer details</button>
    <krn-drawer
      [(open)]="open"
      title="Customer details"
      description="Review contacts, contracts and account ownership."
    >
      <p>Review contacts, contracts and account ownership.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-drawer>
  `,
})
export class KernDrawerAgentExample {
  open = false;
}

void bootstrapApplication(KernDrawerAgentExample);
