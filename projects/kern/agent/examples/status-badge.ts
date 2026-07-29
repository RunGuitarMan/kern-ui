/**
 * Alias status badge
 *
 * Use the status-focused alias with visible state text.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnStatusBadge } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-status-badge-agent-example',
  standalone: true,
  imports: [KrnStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-status-badge tone="warning" [status]="true">Review needed</krn-status-badge> `,
})
export class KernStatusBadgeAgentExample {}

void bootstrapApplication(KernStatusBadgeAgentExample);
