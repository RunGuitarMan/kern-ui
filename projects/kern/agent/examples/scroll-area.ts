/**
 * Keyboard-accessible activity log
 *
 * Constrain a long activity stream without hiding keyboard access.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnScrollArea } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-scroll-area-agent-example',
  standalone: true,
  imports: [KrnScrollArea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-scroll-area
      axis="vertical"
      maxBlockSize="16rem"
      ariaLabel="Recent account activity"
      [keyboardAccessible]="true"
    >
      <ol>
        <li>Contract approved</li>
        <li>Risk review completed</li>
        <li>Renewal owner assigned</li>
      </ol>
    </krn-scroll-area>
  `,
})
export class KernScrollAreaAgentExample {}

void bootstrapApplication(KernScrollAreaAgentExample);
