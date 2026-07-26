import type {
  ElementRef} from '@angular/core';
import {
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
      <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: items(), root: true }" />
    </nav>
    <ng-template #branch let-nodes let-root="root">
      <ul [attr.role]="root ? 'tree' : 'group'">
        @for (node of nodes; track node.id) {
          <li
            role="treeitem"
            [attr.aria-expanded]="node.children?.length ? isExpanded(node.id) : null"
            [attr.aria-selected]="selectedId() === node.id"
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
                  <span aria-hidden="true">{{ isExpanded(node.id) ? '−' : '+' }}</span>
                </button>
              } @else {
                <span class="spacer" aria-hidden="true"></span>
              }
              @if (node.href && !node.disabled) {
                <a
                  #treeItem
                  class="node"
                  [href]="node.href"
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
                  [attr.tabindex]="isTabStop(node) ? 0 : -1"
                  (click)="activate(node)"
                  (keydown)="onKeydown($event, node)"
                >
                  {{ node.label }}
                </button>
              }
            </div>
            @if (node.children?.length && isExpanded(node.id)) {
              <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: node.children, root: false }" />
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  styles: `
    :host{display:block;min-inline-size:0}nav,ul{min-inline-size:0}ul{display:grid;gap:var(--krn-space-0-5);margin:0;padding:0;list-style:none}ul ul{position:relative;margin-block-start:var(--krn-space-1);padding-inline-start:var(--krn-space-5)}ul ul::before{position:absolute;inset-block:0;inset-inline-start:calc(var(--krn-space-3) - var(--krn-border-width-1));inline-size:var(--krn-border-width-1);background:var(--krn-color-border);content:""}.node-row{display:flex;align-items:center;min-inline-size:0;border-radius:var(--krn-radius-sm)}.node-row:hover,.node-row.selected{background:var(--krn-color-surface-subtle)}.node-row.selected{box-shadow:inset calc(var(--krn-border-width-1) * 2) 0 0 var(--krn-color-primary)}.toggle,.spacer{display:grid;flex:0 0 var(--krn-control-height-sm);block-size:var(--krn-control-height-sm);place-items:center}.toggle{border:0;border-radius:var(--krn-radius-xs);background:transparent;color:var(--krn-color-text-muted);font:inherit;cursor:pointer}.toggle:hover{color:var(--krn-color-text)}.node{display:flex;align-items:center;min-inline-size:0;min-block-size:var(--krn-control-height-sm);flex:1;padding-inline:var(--krn-space-1) var(--krn-space-3);border:0;background:transparent;color:var(--krn-color-text-muted);font:inherit;text-align:start;text-decoration:none;cursor:pointer}.selected .node{color:var(--krn-color-text);font-weight:var(--krn-font-weight-medium)}.node:focus-visible,.toggle:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:calc(var(--krn-focus-ring-offset) * -1)}.node:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}
  `,
})
export class KrnTreeNavigation {
  private readonly elements = viewChildren<ElementRef<HTMLElement>>('treeItem');
  readonly items = input<readonly KrnTreeNavigationItem[]>([]);
  readonly selectedId = model<string | null>(null);
  readonly expandedIds = model<readonly string[]>([]);
  readonly ariaLabel = input('Navigation tree');
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
        this.selectedId.set(id);
      }
    }
  }

  protected activate(item: KrnTreeNavigationItem): void {
    if (item.disabled) return;
    this.selectedId.set(item.id);
    this.itemSelected.emit(item);
  }

  protected onKeydown(event: KeyboardEvent, item: KrnTreeNavigationItem): void {
    const visible = this.visibleItems();
    const current = visible.findIndex((candidate) => candidate.id === item.id);
    if (event.key === 'ArrowRight' && item.children?.length) {
      event.preventDefault();
      if (!this.isExpanded(item.id)) this.toggle(item.id);
      else this.focusItem(visible[current + 1]?.id);
      return;
    }
    if (event.key === 'ArrowLeft' && item.children?.length && this.isExpanded(item.id)) {
      event.preventDefault();
      this.toggle(item.id);
      return;
    }
    if (event.key === 'ArrowLeft') {
      const parent = this.findParent(item.id);
      if (parent) {
        event.preventDefault();
        this.focusItem(parent.id);
      }
      return;
    }
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
    if (next < 0 || next >= visible.length) return;
    event.preventDefault();
    this.selectedId.set(visible[next].id);
    this.elements()[next]?.nativeElement.focus();
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
    if (this.selectedId()) return this.selectedId() === item.id;
    return this.visibleItems().find((candidate) => !candidate.disabled)?.id === item.id;
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

  private focusItem(id?: string): void {
    if (!id) return;
    const index = this.visibleItems().findIndex((item) => item.id === id);
    if (index >= 0) {
      this.selectedId.set(id);
      setTimeout(() => this.elements()[index]?.nativeElement.focus());
    }
  }
}
