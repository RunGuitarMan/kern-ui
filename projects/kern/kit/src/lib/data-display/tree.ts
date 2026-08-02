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
import { KRN_ENGLISH_TRANSLATIONS, KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
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
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <ng-container
      [ngTemplateOutlet]="branch"
      [ngTemplateOutletContext]="{ $implicit: validatedNodes(), depth: 0 }"
    />
    <ng-template #branch let-branchNodes let-depth="depth">
      <ul role="group" class="branch" [attr.data-depth]="depth">
        @for (node of branchNodes; track node.id; let index = $index) {
          <li role="none">
            <button
              #treeItem
              type="button"
              role="treeitem"
              [disabled]="node.disabled"
              [attr.data-tree-item]="node.id"
              [attr.aria-level]="depth + 1"
              [attr.aria-posinset]="index + 1"
              [attr.aria-setsize]="branchNodes.length"
              [attr.aria-expanded]="isExpandable(node) ? expanded().has(node.id) : null"
              [attr.aria-selected]="selected() === node.id"
              [attr.aria-disabled]="node.disabled || null"
              [attr.aria-busy]="node.childrenState === 'loading' ? 'true' : null"
              [attr.aria-invalid]="node.childrenState === 'error' ? 'true' : null"
              [attr.aria-label]="nodeStateLabel(node)"
              [attr.tabindex]="isTabStop(node) ? 0 : -1"
              (click)="activate(node)"
              (keydown)="onKeydown($event, node)"
            >
              <span
                class="chevron"
                [class.has-children]="isExpandable(node)"
                [class.expanded]="expanded().has(node.id)"
                aria-hidden="true"
              ></span>
              <span>{{ node.label }}</span>
              @if (node.childrenState === 'loading') {
                <span class="node-state" aria-hidden="true">…</span>
              } @else if (node.childrenState === 'error') {
                <span class="node-state node-state--error" aria-hidden="true">!</span>
              }
            </button>
            @if (node.children?.length && expanded().has(node.id)) {
              <ng-container
                [ngTemplateOutlet]="branch"
                [ngTemplateOutletContext]="{ $implicit: node.children, depth: depth + 1 }"
              />
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  styles: `
    :host {
      display: block;
      color: var(--krn-color-text, #252932);
    }
    .branch {
      display: grid;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .branch:not([data-depth='0']) {
      position: relative;
      margin-block: 0.125rem 0.25rem;
      margin-inline-start: 1rem;
      padding-inline-start: 0.875rem;
      border-inline-start: 1px solid
        color-mix(in oklch, var(--krn-color-border, #cdd1d7) 72%, transparent);
    }
    li {
      position: relative;
      min-inline-size: 0;
    }
    .branch:not([data-depth='0']) > li::before {
      position: absolute;
      inset-block-start: 1rem;
      inset-inline-start: -0.875rem;
      inline-size: 0.625rem;
      border-block-start: 1px solid
        color-mix(in oklch, var(--krn-color-border, #cdd1d7) 72%, transparent);
      content: '';
    }
    button {
      display: flex;
      inline-size: 100%;
      min-block-size: 2rem;
      align-items: center;
      gap: 0.5rem;
      padding-inline: 0.5rem;
      border: 0;
      border-inline-start: 2px solid transparent;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    button[aria-selected='true'] {
      border-inline-start-color: var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
      font-weight: 620;
    }
    button:hover:not(:disabled) {
      background: color-mix(in oklch, var(--krn-color-surface-subtle, #f3f4f6) 74%, transparent);
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 1px;
    }
    .chevron {
      position: relative;
      display: grid;
      inline-size: 1rem;
      block-size: 1rem;
      color: var(--krn-color-text-muted, #626a76);
      place-items: center;
    }
    .chevron.has-children::before {
      inline-size: 0.4rem;
      block-size: 0.4rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: -45deg;
      transition: rotate var(--krn-motion-duration-selection);
      content: '';
    }
    .chevron.expanded::before {
      rotate: 45deg;
    }
    .node-state {
      margin-inline-start: auto;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .node-state--error {
      color: var(--krn-color-danger-text, #a1342f);
    }
    :host-context([dir='rtl']) .chevron.has-children:not(.expanded)::before {
      rotate: 135deg;
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .chevron.has-children::before {
        transition: none;
      }
    }
  `,
})
export class KrnTree {
  private readonly locale = inject(KRN_LOCALE);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('treeItem');
  private typeaheadQuery = '';
  private lastTypeaheadAt = 0;
  readonly nodes = input<readonly KrnTreeNode[]>([]);
  readonly ariaLabel = input(this.translations.navigation.tree);
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
    const key = event.key.toLocaleLowerCase(this.locale);
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
      node.label.toLocaleLowerCase(this.locale).startsWith(this.typeaheadQuery),
    );
    this.focusNode(match?.node);
  }
}
