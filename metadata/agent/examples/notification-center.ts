/**
 * Typed notification center
 *
 * Render immutable notification records with stable ids and read state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNotificationCenter, type KrnNotification } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-notification-center-agent-example',
  standalone: true,
  imports: [KrnNotificationCenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-notification-center
      heading="Account notifications"
      [notifications]="notifications"
      (markAllRead)="markAllRead()"
    />
  `,
})
export class KernNotificationCenterAgentExample {
  notifications: readonly KrnNotification[] = [
    {
      id: 'notification-renewal',
      title: 'Renewal review due',
      detail: 'Acme Europe requires review before 15 October.',
      timestamp: '10 minutes ago',
      read: false,
      tone: 'warning',
    },
  ];

  markAllRead(): void {
    this.notifications = this.notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
  }
}

void bootstrapApplication(KernNotificationCenterAgentExample);
