/**
 * Responsive supporting guidance
 *
 * Show supplemental copy only when its target layout has enough room.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResponsiveShowHide } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-responsive-show-hide-agent-example',
  standalone: true,
  imports: [KrnResponsiveShowHide],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-responsive-show-hide from="md" display="block">
      Keyboard shortcuts are available from the command palette.
    </krn-responsive-show-hide>
  `,
})
export class KernResponsiveShowHideAgentExample {}

void bootstrapApplication(KernResponsiveShowHideAgentExample);
