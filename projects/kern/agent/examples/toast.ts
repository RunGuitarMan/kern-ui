/**
 * Application toast viewport
 *
 * Place one viewport and create notifications through the root service.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToast, KrnToastService } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toast-agent-example',
  standalone: true,
  imports: [KrnToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="notify()">Save report</button>
    <krn-toast [(expanded)]="expanded" position="top-end" />
  `,
})
export class KernToastAgentExample {
  private readonly toasts = inject(KrnToastService);

  expanded = false;

  notify(): void {
    this.toasts.success('Report saved', { title: 'Saved' });
  }
}

void bootstrapApplication(KernToastAgentExample);
