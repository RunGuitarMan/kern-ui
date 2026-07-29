/**
 * Controlled destructive confirmation
 *
 * Require an explicit decision for a destructive action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAlertDialog } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-alert-dialog-agent-example',
  standalone: true,
  imports: [KrnAlertDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Archive customer</button>
    <krn-alert-dialog
      [(open)]="open"
      title="Archive customer"
      description="Archived customers are removed from active reporting."
      [closeOnOutside]="false"
    >
      <p>Archived customers are removed from active reporting.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-alert-dialog>
  `,
})
export class KernAlertDialogAgentExample {
  open = false;
}

void bootstrapApplication(KernAlertDialogAgentExample);
