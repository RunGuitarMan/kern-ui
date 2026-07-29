/**
 * Controlled organization tree
 *
 * Use stable node ids and own expanded and selected state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTree, type KrnTreeNode } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tree-agent-example',
  standalone: true,
  imports: [KrnTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tree
      ariaLabel="Organization units"
      [nodes]="nodes"
      [(selected)]="selectedId"
      [(expanded)]="expandedIds"
    />
  `,
})
export class KernTreeAgentExample {
  readonly nodes: readonly KrnTreeNode[] = [
    {
      id: 'engineering',
      label: 'Engineering',
      children: [
        { id: 'platform', label: 'Platform' },
        { id: 'security', label: 'Security' },
      ],
    },
  ];

  selectedId = 'platform';

  expandedIds: ReadonlySet<string> = new Set(['engineering']);
}

void bootstrapApplication(KernTreeAgentExample);
