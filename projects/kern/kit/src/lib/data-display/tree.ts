import { NgTemplateOutlet } from '@angular/common';
import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { KRN_ENGLISH_TRANSLATIONS, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import { krnInheritedLocale } from '../reactive-locale';
import type { KrnTreeChildrenState } from '../navigation/tree.types';

export interface KrnTreeNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly KrnTreeNode[];
  /** Describes an expandable node whose children are loaded by the consumer. */
  readonly childrenState?: KrnTreeChildrenState;
  readonly disabled?: boolean;
}

interface KrnVisibleTreeNode {
  readonly node: KrnTreeNode;
  readonly parent: KrnTreeNode | null;
}

function assertValidTreeNodeIds(nodes: readonly KrnTreeNode[]): void {
  const ids = new Set<string>();
  const visit = (branch: readonly KrnTreeNode[]): void => {
    for (const node of branch) {
      if (typeof node.id !== 'string' || node.id.trim().length === 0) {
        throw new Error('KrnTree requires every node id to be a non-empty string.');
      }
      if (ids.has(node.id)) {
        throw new Error(`KrnTree requires unique node ids; duplicate id "${node.id}".`);
      }
      ids.add(node.id);
      if (node.children?.length) visit(node.children);
    }
  };
  visit(nodes);
}

@Component({
  selector: 'krn-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tree',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  templateUrl: './tree.html',
  imports: [NgTemplateOutlet],
  styleUrl: './tree.css',
})
export class KrnTree {
  private readonly locale = krnInheritedLocale();
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('treeItem');
  private typeaheadQuery = '';
  private lastTypeaheadAt = 0;
  readonly nodes = input<readonly KrnTreeNode[]>([]);
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.navigation.tree,
  );
  readonly selected = model('');
  readonly expanded = model<ReadonlySet<string>>(new Set<string>());
  /** Requests children when an unloaded node is expanded or its failed request is retried. */
  readonly loadChildren = output<KrnTreeNode>();
  protected readonly validatedNodes = computed(() => {
    const nodes = this.nodes();
    assertValidTreeNodeIds(nodes);
    return nodes;
  });
  private readonly visibleNodes = computed<readonly KrnVisibleTreeNode[]>(() => {
    const result: KrnVisibleTreeNode[] = [];
    const visit = (nodes: readonly KrnTreeNode[], parent: KrnTreeNode | null): void => {
      for (const node of nodes) {
        result.push({ node, parent });
        if (node.children?.length && this.expanded().has(node.id)) {
          visit(node.children, node);
        }
      }
    };
    visit(this.validatedNodes(), null);
    return result;
  });
  private readonly focusableNodes = computed(() =>
    this.visibleNodes().filter(({ node }) => !node.disabled),
  );

  protected activate(node: KrnTreeNode): void {
    if (node.disabled) return;
    this.selected.set(node.id);
    if (this.isExpandable(node)) this.toggle(node);
  }

  protected isExpandable(node: KrnTreeNode): boolean {
    return Boolean(node.children?.length || node.childrenState);
  }

  protected nodeStateLabel(node: KrnTreeNode): string | null {
    return node.childrenState === 'loading'
      ? (
          this.translations.navigation.loadingChildren ??
          KRN_ENGLISH_TRANSLATIONS.navigation.loadingChildren ??
          ((label: string) => `Loading children for ${label}`)
        )(node.label)
      : node.childrenState === 'error'
        ? (
            this.translations.navigation.childrenLoadFailed ??
            KRN_ENGLISH_TRANSLATIONS.navigation.childrenLoadFailed ??
            ((label: string) => `Could not load children for ${label}`)
          )(node.label)
        : null;
  }

  protected isTabStop(node: KrnTreeNode): boolean {
    const focusable = this.focusableNodes();
    const selected = focusable.find(({ node: candidate }) => candidate.id === this.selected());
    return (selected ?? focusable[0])?.node.id === node.id;
  }

  protected onKeydown(event: KeyboardEvent, node: KrnTreeNode): void {
    if (node.disabled) return;

    if (
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      this.focusTypeaheadMatch(event, node);
      return;
    }

    if (event.key === 'ArrowRight' && this.isExpandable(node)) {
      event.preventDefault();
      if (!this.expanded().has(node.id)) {
        this.toggle(node);
      } else if (!node.children?.length) {
        this.requestChildren(node);
      } else {
        this.focusNode(this.firstFocusableVisibleDescendant(node));
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      const expanded = Boolean(this.isExpandable(node) && this.expanded().has(node.id));
      const parent = expanded ? null : this.enabledParent(node.id);
      if (!expanded && !parent) return;
      event.preventDefault();
      if (expanded) {
        this.toggle(node);
      } else {
        this.focusNode(parent);
      }
      return;
    }

    const focusable = this.focusableNodes();
    const current = focusable.findIndex(({ node: candidate }) => candidate.id === node.id);
    if (current < 0) return;
    const target =
      event.key === 'Home'
        ? focusable[0]
        : event.key === 'End'
          ? focusable.at(-1)
          : event.key === 'ArrowDown'
            ? focusable[current + 1]
            : event.key === 'ArrowUp'
              ? focusable[current - 1]
              : undefined;
    if (!['Home', 'End', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    this.focusNode(target?.node);
  }

  private toggle(node: KrnTreeNode): void {
    const next = new Set(this.expanded());
    const expanding = !next.has(node.id);
    if (expanding) next.add(node.id);
    else next.delete(node.id);
    this.expanded.set(next);
    if (expanding) {
      this.requestChildren(node);
    }
  }

  private requestChildren(node: KrnTreeNode): void {
    if (!node.children?.length && node.childrenState && node.childrenState !== 'loading') {
      this.loadChildren.emit(node);
    }
  }

  private firstFocusableVisibleDescendant(node: KrnTreeNode): KrnTreeNode | null {
    for (const child of node.children ?? []) {
      if (!child.disabled) return child;
      if (child.children?.length && this.expanded().has(child.id)) {
        const descendant = this.firstFocusableVisibleDescendant(child);
        if (descendant) return descendant;
      }
    }
    return null;
  }

  private enabledParent(id: string): KrnTreeNode | null {
    let parent = this.visibleNodes().find(({ node }) => node.id === id)?.parent ?? null;
    while (parent?.disabled) {
      parent = this.visibleNodes().find(({ node }) => node.id === parent?.id)?.parent ?? null;
    }
    return parent;
  }

  private focusNode(node?: KrnTreeNode | null): void {
    if (!node || node.disabled) return;
    this.selected.set(node.id);
    this.elements()
      .find(({ nativeElement }) => nativeElement.dataset['treeItem'] === node.id)
      ?.nativeElement.focus();
  }

  private focusTypeaheadMatch(event: KeyboardEvent, currentNode: KrnTreeNode): void {
    const now = event.timeStamp;
    const key = event.key.toLocaleLowerCase(this.locale());
    this.typeaheadQuery = now - this.lastTypeaheadAt > 700 ? key : `${this.typeaheadQuery}${key}`;
    this.lastTypeaheadAt = now;

    if (
      this.typeaheadQuery.length > 1 &&
      [...this.typeaheadQuery].every((character) => character === key)
    ) {
      this.typeaheadQuery = key;
    }

    const nodes = this.focusableNodes();
    const currentIndex = nodes.findIndex(({ node }) => node.id === currentNode.id);
    const candidates = [...nodes.slice(currentIndex + 1), ...nodes.slice(0, currentIndex + 1)];
    const match = candidates.find(({ node }) =>
      node.label.toLocaleLowerCase(this.locale()).startsWith(this.typeaheadQuery),
    );
    this.focusNode(match?.node);
  }
}
