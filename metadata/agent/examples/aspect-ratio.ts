/**
 * Stable media preview
 *
 * Reserve a 16:9 region before preview content is available.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAspectRatio } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-aspect-ratio-agent-example',
  standalone: true,
  imports: [KrnAspectRatio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-aspect-ratio ratio="16 / 9" fit="cover">
      <div role="img" aria-label="Quarterly report preview">Q3 report preview</div>
    </krn-aspect-ratio>
  `,
})
export class KernAspectRatioAgentExample {}

void bootstrapApplication(KernAspectRatioAgentExample);
