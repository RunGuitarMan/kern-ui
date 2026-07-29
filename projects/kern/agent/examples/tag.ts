/**
 * Controlled tag alias
 *
 * Use the tag alias for removable classification metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTag } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tag-agent-example',
  standalone: true,
  imports: [KrnTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tag
      [interactive]="true"
      [removable]="true"
      accessibleLabel="Renewal Q3 tag"
      [(selected)]="selected"
    >
      Renewal Q3
    </krn-tag>
  `,
})
export class KernTagAgentExample {
  selected = true;
}

void bootstrapApplication(KernTagAgentExample);
