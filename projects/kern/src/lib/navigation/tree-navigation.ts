import type { ElementRef } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { KrnTreeNavigationItem } from './navigation.types';

@Component({
  selector: 'krn-tree-navigation',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="ariaLabel()">
      <ng-container
        [ngTemplateOutlet]="branch"
        [ngTemplateOutletContext]="{ $implicit: items(), root: true, level: 0 }"
      />
    </nav>
    <ng-template #branch let-nodes let-root="root" let-level="level">
      <ul
        [attr.role]="root ? 'tree' : 'group'"
        [attr.data-level]="level"
        [class.branch]="!root"
        [class.with-guides]="showGuides()"
      >
        @for (node of nodes; track node.id) {
          <li
            role="treeitem"
            [attr.aria-expanded]="node.children?.length ? isExpanded(node.id) : null"
            [attr.aria-selected]="selectedId() === node.id"
            [attr.aria-disabled]="node.disabled || null"
          >
            <div class="node-row" [class.selected]="selectedId() === node.id">
              @if (node.children?.length) {
                <button
                  type="button"
                  class="toggle"
                  [attr.aria-label]="(isExpanded(node.id) ? 'Collapse ' : 'Expand ') + node.label"
                  [attr.tabindex]="-1"
                  (click)="toggle(node.id)"
                >
                  <span
                    class="caret"
                    [class.expanded]="isExpanded(node.id)"
                    aria-hidden="true"
                  ></span>
                </button>
              } @else {
                <span class="spacer" aria-hidden="true"></span>
              }
              @if (node.href && !node.disabled) {
                <a
                  #treeItem
                  class="node"
                  [href]="node.href"
                  [attr.data-tree-item]="node.id"
                  [attr.tabindex]="isTabStop(node) ? 0 : -1"
                  (click)="activate(node)"
                  (keydown)="onKeydown($event, node)"
                  >{{ node.label }}</a
                >
              } @else {
                <button
                  #treeItem
                  type="button"
                  class="node"
                  [disabled]="node.disabled"
                  [attr.data-tree-item]="node.id"
                  [attr.tabindex]="isTabStop(node) ? 0 : -1"
                  (click)="activate(node)"
                  (keydown)="onKeydown($event, node)"
                >
                  {{ node.label }}
                </button>
              }
            </div>
            @if (node.children?.length && isExpanded(node.id)) {
              <ng-container
                [ngTemplateOutlet]="branch"
                [ngTemplateOutletContext]="{
                  $implicit: node.children,
                  root: false,
                  level: level + 1,
                }"
              />
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  host: {
    '[style.--krn-tree-indent]': 'indent()',
  },
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    nav,
    ul {
      min-inline-size: 0;
    }
    ul {
      display: grid;
      gap: var(--krn-space-0-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    ul.branch {
      position: relative;
      margin-block-start: var(--krn-space-1);
      margin-inline-start: calc(var(--krn-control-height-sm) / 2);
      padding-inline-start: var(--krn-tree-indent);
    }
    ul.branch.with-guides::before {
      position: absolute;
      inset-block: 0 var(--krn-space-2);
      inset-inline-start: 0;
      inline-size: var(--krn-border-width-1);
      background: color-mix(in oklch, var(--krn-color-border) 72%, transparent);
      content: '';
    }
    .node-row {
      position: relative;
      display: flex;
      inline-size: 100%;
      min-inline-size: 0;
      align-items: center;
      overflow: hidden;
      border-inline-start: calc(var(--krn-border-width-1) * 2) solid transparent;
      border-radius: var(--krn-radius-sm);
      transition:
        background var(--krn-motion-duration-fast) var(--krn-motion-ease-standard),
        border-color var(--krn-motion-duration-fast) var(--krn-motion-ease-standard);
    }
    .node-row:hover {
      background: color-mix(in oklch, var(--krn-color-surface-subtle) 72%, transparent);
    }
    .node-row.selected {
      border-inline-start-color: var(--krn-color-primary);
      background: var(--krn-color-surface-subtle);
    }
    .toggle,
    .spacer {
      display: grid;
      flex: 0 0 var(--krn-control-height-sm);
      block-size: var(--krn-control-height-sm);
      place-items: center;
    }
    .toggle {
      border: 0;
      border-radius: var(--krn-radius-xs);
      color: var(--krn-color-text-muted);
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    .toggle:hover {
      color: var(--krn-color-text);
      background: color-mix(in oklch, var(--krn-color-surface-subtle) 72%, transparent);
    }
    .caret {
      inline-size: 0.45rem;
      block-size: 0.45rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: -45deg;
      transition: rotate var(--krn-motion-duration-fast) var(--krn-motion-ease-standard);
    }
    .caret.expanded {
      rotate: 45deg;
    }
    .node {
      display: flex;
      min-inline-size: 0;
      min-block-size: var(--krn-control-height-sm);
      flex: 1;
      align-items: center;
      padding-inline: var(--krn-space-1) var(--krn-space-3);
      border: 0;
      color: var(--krn-color-text-muted);
      background: transparent;
      font: inherit;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
    }
    .selected .node {
      color: var(--krn-color-text);
      font-weight: var(--krn-font-weight-medium);
    }
    .node:focus-visible,
    .toggle:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: calc(var(--krn-focus-ring-offset) * -1);
    }
    .node:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
    @media (prefers-reduced-motion: reduce) {
      .node-row,
      .caret {
        transition: none;
      }
    }
  `,
})
export class KrnTreeNavigation {
  private readonly elements = viewChildren<ElementRef<HTMLElement>>('treeItem');
  readonly items = input<readonly KrnTreeNavigationItem[]>([]);
  readonly selectedId = model<string | null>(null);
  readonly expandedIds = model<readonly string[]>([]);
  readonly ariaLabel = input('Navigation tree');
  readonly indent = input('1rem');
  readonly showGuides = input(true, { transform: booleanAttribute });
  readonly itemSelected = output<KrnTreeNavigationItem>();

  protected isExpanded(id: string): boolean {
    return this.expandedIds().includes(id);
  }

  protected toggle(id: string): void {
    const collapsing = this.isExpanded(id);
    this.expandedIds.update((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
    if (collapsing) {
      const branch = this.findItem(id);
      if (branch && this.containsId(branch.children ?? [], this.selectedId())) {
        const replacement = branch.disabled
          ? (this.enabledParent(id) ?? this.visibleItems().find((item) => !item.disabled))
          : branch;
        this.selectedId.set(replacement?.id ?? null);
      }
    }
  }

  protected activate(item: KrnTreeNavigationItem): void {
    if (item.disabled) return;
    this.selectedId.set(item.id);
    this.itemSelected.emit(item);
  }

  protected onKeydown(event: KeyboardEvent, item: KrnTreeNavigationItem): void {
    if (item.disabled) return;

    if (event.key === 'ArrowRight' && item.children?.length) {
      event.preventDefault();
      if (!this.isExpanded(item.id)) this.toggle(item.id);
      else this.focusItem(this.firstFocusableVisibleDescendant(item)?.id);
      return;
    }
    if (event.key === 'ArrowLeft' && item.children?.length && this.isExpanded(item.id)) {
      event.preventDefault();
      this.toggle(item.id);
      return;
    }
    if (event.key === 'ArrowLeft') {
      const parent = this.enabledParent(item.id);
      if (parent) {
        event.preventDefault();
        this.focusItem(parent.id);
      }
      return;
    }
    const visible = this.focusableVisibleItems();
    const current = visible.findIndex((candidate) => candidate.id === item.id);
    if (current < 0) return;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? visible.length - 1
          : event.key === 'ArrowDown'
            ? current + 1
            : event.key === 'ArrowUp'
              ? current - 1
              : -1;
    if (!['Home', 'End', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    this.focusItem(visible[next]?.id);
  }

  private visibleItems(): readonly KrnTreeNavigationItem[] {
    const result: KrnTreeNavigationItem[] = [];
    const visit = (items: readonly KrnTreeNavigationItem[]): void => {
      for (const item of items) {
        result.push(item);
        if (item.children?.length && this.isExpanded(item.id)) visit(item.children);
      }
    };
    visit(this.items());
    return result;
  }

  protected isTabStop(item: KrnTreeNavigationItem): boolean {
    const visible = this.focusableVisibleItems();
    const selected = visible.find((candidate) => candidate.id === this.selectedId());
    return (selected ?? visible[0])?.id === item.id;
  }

  private focusableVisibleItems(): readonly KrnTreeNavigationItem[] {
    return this.visibleItems().filter((item) => !item.disabled);
  }

  private findItem(id: string): KrnTreeNavigationItem | null {
    const visit = (items: readonly KrnTreeNavigationItem[]): KrnTreeNavigationItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        const child = visit(item.children ?? []);
        if (child) return child;
      }
      return null;
    };
    return visit(this.items());
  }

  private findParent(id: string): KrnTreeNavigationItem | null {
    const visit = (
      items: readonly KrnTreeNavigationItem[],
      parent: KrnTreeNavigationItem | null,
    ): KrnTreeNavigationItem | null => {
      for (const item of items) {
        if (item.id === id) return parent;
        const found = visit(item.children ?? [], item);
        if (found) return found;
      }
      return null;
    };
    return visit(this.items(), null);
  }

  private containsId(items: readonly KrnTreeNavigationItem[], id: string | null): boolean {
    if (!id) return false;
    return items.some((item) => item.id === id || this.containsId(item.children ?? [], id));
  }

  private firstFocusableVisibleDescendant(
    item: KrnTreeNavigationItem,
  ): KrnTreeNavigationItem | null {
    for (const child of item.children ?? []) {
      if (!child.disabled) return child;
      if (child.children?.length && this.isExpanded(child.id)) {
        const descendant = this.firstFocusableVisibleDescendant(child);
        if (descendant) return descendant;
      }
    }
    return null;
  }

  private enabledParent(id: string): KrnTreeNavigationItem | null {
    let parent = this.findParent(id);
    while (parent?.disabled) {
      parent = this.findParent(parent.id);
    }
    return parent;
  }

  private focusItem(id?: string): void {
    if (!id) return;
    const item = this.visibleItems().find((candidate) => candidate.id === id);
    if (!item || item.disabled) return;
    this.selectedId.set(id);
    this.elements()
      .find(({ nativeElement }) => nativeElement.dataset['treeItem'] === id)
      ?.nativeElement.focus();
  }
}
