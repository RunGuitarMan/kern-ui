/**
 * Responsive report preview
 *
 * Contain responsive media within a stable aspect ratio.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResponsiveMedia } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-responsive-media-agent-example',
  standalone: true,
  imports: [KrnResponsiveMedia],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-responsive-media aspectRatio="16 / 9">
      <div role="img" aria-label="Revenue dashboard preview">Revenue dashboard preview</div>
    </krn-responsive-media>
  `,
})
export class KernResponsiveMediaAgentExample {}

void bootstrapApplication(KernResponsiveMediaAgentExample);
