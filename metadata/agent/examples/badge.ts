/**
 * Semantic account status badge
 *
 * Express status through text, marker and semantic tone.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBadge } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-badge-agent-example',
  standalone: true,
  imports: [KrnBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <krn-badge tone="success" [status]="true">Healthy</krn-badge> `,
})
export class KernBadgeAgentExample {}

void bootstrapApplication(KernBadgeAgentExample);
