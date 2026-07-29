/**
 * Controlled mobile action sheet
 *
 * Present compact actions from the bottom edge on narrow screens.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBottomSheet } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-bottom-sheet-agent-example',
  standalone: true,
  imports: [KrnBottomSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open Customer actions</button>
    <krn-bottom-sheet
      [(open)]="open"
      title="Customer actions"
      description="Choose an action for the selected customer."
    >
      <p>Choose an action for the selected customer.</p>
      <button krnDialogAction type="button" (click)="open = false">Done</button>
    </krn-bottom-sheet>
  `,
})
export class KernBottomSheetAgentExample {
  open = false;
}

void bootstrapApplication(KernBottomSheetAgentExample);
