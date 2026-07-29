import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTree, type KrnTreeNode } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-lazy-tree-recipe',
  standalone: true,
  imports: [KrnTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tree
      ariaLabel="Account hierarchy"
      [nodes]="nodes()"
      [(selected)]="selectedId"
      [(expanded)]="expandedIds"
      (loadChildren)="loadChildren($event)"
    />
  `,
})
export class KernLazyTreeRecipe implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly controllers = new Map<string, AbortController>();

  readonly nodes = signal<readonly KrnTreeNode[]>([
    { id: 'accounts', label: 'Accounts', childrenState: 'idle' },
    { id: 'reports', label: 'Reports', childrenState: 'idle' },
  ]);
  selectedId = 'accounts';
  expandedIds: ReadonlySet<string> = new Set(['accounts']);

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const controller of this.controllers.values()) controller.abort();
      this.controllers.clear();
    });
  }

  ngOnInit(): void {
    const root = this.nodes()[0];
    if (root) this.loadChildren(root);
  }

  loadChildren(node: KrnTreeNode): void {
    this.controllers.get(node.id)?.abort();
    const controller = new AbortController();
    this.controllers.set(node.id, controller);
    this.updateNode(node.id, (current) => ({
      ...current,
      children: undefined,
      childrenState: 'loading',
    }));

    void this.requestChildren(node.id, controller.signal)
      .then((children) => {
        if (controller.signal.aborted) return;
        this.updateNode(node.id, (current) => ({
          ...current,
          children,
          childrenState: undefined,
        }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        this.updateNode(node.id, (current) => ({
          ...current,
          children: undefined,
          childrenState: 'error',
        }));
      })
      .finally(() => {
        if (this.controllers.get(node.id) === controller) this.controllers.delete(node.id);
      });
  }

  private async requestChildren(
    parentId: string,
    signal: AbortSignal,
  ): Promise<readonly KrnTreeNode[]> {
    const response = await fetch(`/api/navigation/${encodeURIComponent(parentId)}/children`, {
      signal,
    });
    if (!response.ok) throw new Error(`Tree request failed with ${response.status}.`);
    const payload: unknown = await response.json();
    if (!isTreeNodeArray(payload, collectTreeNodeIds(this.nodes()))) {
      throw new TypeError('Tree request returned invalid or duplicate nodes.');
    }
    return payload;
  }

  private updateNode(id: string, update: (node: KrnTreeNode) => KrnTreeNode): void {
    const visit = (nodes: readonly KrnTreeNode[]): readonly KrnTreeNode[] =>
      nodes.map((node) =>
        node.id === id
          ? update(node)
          : node.children
            ? { ...node, children: visit(node.children) }
            : node,
      );
    this.nodes.update(visit);
  }
}

function collectTreeNodeIds(nodes: readonly KrnTreeNode[]): Set<string> {
  const ids = new Set<string>();
  const visit = (branch: readonly KrnTreeNode[]): void => {
    for (const node of branch) {
      ids.add(node.id);
      if (node.children) visit(node.children);
    }
  };
  visit(nodes);
  return ids;
}

function isTreeNodeArray(
  value: unknown,
  ids: Set<string> = new Set(),
): value is readonly KrnTreeNode[] {
  return Array.isArray(value) && value.every((node) => isTreeNode(node, ids));
}

function isTreeNode(value: unknown, ids: Set<string>): value is KrnTreeNode {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as {
    id?: unknown;
    label?: unknown;
    disabled?: unknown;
    childrenState?: unknown;
    children?: unknown;
  };
  if (
    typeof candidate.id !== 'string' ||
    candidate.id.trim().length === 0 ||
    ids.has(candidate.id) ||
    typeof candidate.label !== 'string' ||
    candidate.label.trim().length === 0 ||
    (candidate.disabled !== undefined && typeof candidate.disabled !== 'boolean') ||
    (candidate.childrenState !== undefined &&
      (typeof candidate.childrenState !== 'string' ||
        !['idle', 'loading', 'error'].includes(candidate.childrenState)))
  ) {
    return false;
  }
  ids.add(candidate.id);
  return candidate.children === undefined || isTreeNodeArray(candidate.children, ids);
}

void bootstrapApplication(KernLazyTreeRecipe);
