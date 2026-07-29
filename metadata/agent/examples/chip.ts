/**
 * Controlled removable filter chip
 *
 * Keep selected filter state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnChip } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-chip-agent-example',
  standalone: true,
  imports: [KrnChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-chip
      [interactive]="true"
      [removable]="true"
      accessibleLabel="Enterprise filter"
      [(selected)]="selected"
    >
      Enterprise
    </krn-chip>
  `,
})
export class KernChipAgentExample {
  selected = true;
}

void bootstrapApplication(KernChipAgentExample);
