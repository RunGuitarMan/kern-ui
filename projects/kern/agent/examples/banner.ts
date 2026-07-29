/**
 * Dismissible system banner
 *
 * Present a page-wide operational message with explicit tone.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBanner } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-banner-agent-example',
  standalone: true,
  imports: [KrnBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-banner tone="info" title="Scheduled maintenance" [dismissible]="true">
      Reporting will be read-only from 22:00 to 23:00 UTC.
    </krn-banner>
  `,
})
export class KernBannerAgentExample {}

void bootstrapApplication(KernBannerAgentExample);
