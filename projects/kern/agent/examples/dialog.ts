/**
 * Controlled edit dialog
 *
 * Open and close a modal dialog through application-owned state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnDialog } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-dialog-agent-example',
  standalone: true,
  imports: [KrnDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Edit customer</button>
    <krn-dialog
      [(open)]="open"
      title="Edit customer"
      description="Update customer ownership and renewal details."
    >
      <p>Update customer ownership and renewal details.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-dialog>
  `,
})
export class KernDialogAgentExample {
  open = false;
}

void bootstrapApplication(KernDialogAgentExample);
