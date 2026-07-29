/**
 * Customer activity timeline
 *
 * Compose chronologically ordered typed timeline items.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTimeline, KrnTimelineItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-timeline-agent-example',
  standalone: true,
  imports: [KrnTimeline, KrnTimelineItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-timeline ariaLabel="Recent customer activity">
      <krn-timeline-item heading="Contract approved" time="09:42">
        Legal review completed by Grace Hopper.
      </krn-timeline-item>
      <krn-timeline-item heading="Owner assigned" time="08:15">
        Ada Lovelace became the account owner.
      </krn-timeline-item>
    </krn-timeline>
  `,
})
export class KernTimelineAgentExample {}

void bootstrapApplication(KernTimelineAgentExample);
