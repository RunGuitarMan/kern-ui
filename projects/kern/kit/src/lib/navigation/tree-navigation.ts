import type { ElementRef } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { KRN_PLATFORM, KrnIdService, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import { KRN_ENGLISH_TRANSLATIONS, KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnTreeNavigationItem } from './navigation.types';

@Component({
  selector: 'krn-tree-navigation',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="resolvedAriaLabel()">
      <ng-container
        [ngTemplateOutlet]="branch"
        [ngTemplateOutletContext]="{ $implicit: treeItems(), root: true, level: 0, groupId: null }"
      />
    </nav>
    <ng-template #branch let-nodes let-root="root" let-level="level" let-groupId="groupId">
      <ul
        [attr.id]="groupId"
        [attr.role]="root ? 'tree' : 'group'"
        [attr.aria-label]="root ? resolvedAriaLabel() : null"
        [attr.data-level]="level"
        [class.branch]="!root"
        [class.with-guides]="showGuides()"
      >
        @for (node of nodes; track node.id; let nodeIndex = $index; let nodeCount = $count) {
          <li role="none">
            <div class="node-row" role="none" [class.selected]="selectedId() === node.id">
              @if (isExpandable(node)) {
                <span
                  class="toggle"
                  aria-hidden="true"
                  [attr.title]="
                    isExpanded(node.id)
                      ? translations.navigation.collapseNode(node.label)
                      : translations.navigation.expandNode(node.label)
                  "
                  (click)="toggleFromPointer(node.id)"
                >
                  <span
                    class="caret"
                    [class.expanded]="isExpanded(node.id)"
                    aria-hidden="true"
                  ></span>
                </span>
              } @else {
                <span class="spacer" aria-hidden="true"></span>
              }
              @if (node.href && !node.disabled) {
                <a
                  #treeItem
                  class="node"
                  role="treeitem"
                  [href]="node.href"
                  [attr.data-tree-item]="node.id"
                  [attr.aria-level]="level + 1"
                  [attr.aria-posinset]="nodeIndex + 1"
                  [attr.aria-setsize]="nodeCount"
                  [attr.aria-expanded]="isExpandable(node) ? isExpanded(node.id) : null"
                  [attr.aria-selected]="selectedId() === node.id"
                  [attr.aria-busy]="node.childrenState === 'loading' ? 'true' : null"
                  [attr.aria-invalid]="node.childrenState === 'error' ? 'true' : null"
                  [attr.aria-label]="nodeStateLabel(node)"
                  [attr.aria-owns]="
                    node.children?.length && isExpanded(node.id) ? treeGroupId(node.id) : null
                  "
                  [attr.aria-controls]="node.children?.length ? treeGroupId(node.id) : null"
                  [attr.tabindex]="isTabStop(node) ? 0 : -1"
                  (click)="activate(node)"
                  (keydown)="onKeydown($event, node)"
                >
                  <span>{{ node.label }}</span>
                  @if (node.childrenState === 'loading') {
                    <span class="node-state" aria-hidden="true">…</span>
                  } @else if (node.childrenState === 'error') {
                    <span class="node-state node-state--error" aria-hidden="true">!</span>
                  }
                </a>
              } @else {
                <button
                  #treeItem
                  type="button"
                  class="node"
                  role="treeitem"
                  [disabled]="node.disabled"
                  [attr.data-tree-item]="node.id"
                  [attr.aria-level]="level + 1"
                  [attr.aria-posinset]="nodeIndex + 1"
                  [attr.aria-setsize]="nodeCount"
                  [attr.aria-expanded]="isExpandable(node) ? isExpanded(node.id) : null"
                  [attr.aria-selected]="selectedId() === node.id"
                  [attr.aria-disabled]="node.disabled || null"
                  [attr.aria-busy]="node.childrenState === 'loading' ? 'true' : null"
                  [attr.aria-invalid]="node.childrenState === 'error' ? 'true' : null"
                  [attr.aria-label]="nodeStateLabel(node)"
                  [attr.aria-owns]="
                    node.children?.length && isExpanded(node.id) ? treeGroupId(node.id) : null
                  "
                  [attr.aria-controls]="node.children?.length ? treeGroupId(node.id) : null"
                  [attr.tabindex]="isTabStop(node) ? 0 : -1"
                  (click)="activate(node)"
                  (keydown)="onKeydown($event, node)"
                >
                  <span>{{ node.label }}</span>
                  @if (node.childrenState === 'loading') {
                    <span class="node-state" aria-hidden="true">…</span>
                  } @else if (node.childrenState === 'error') {
                    <span class="node-state node-state--error" aria-hidden="true">!</span>
                  }
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
                  groupId: treeGroupId(node.id),
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
    :host([hidden]) {
      display: none;
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
        background var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard),
        border-color var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard);
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
      transition: rotate var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard);
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
    .node > span:first-child {
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .node-state {
      flex: 0 0 auto;
      margin-inline-start: auto;
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-xs);
      font-weight: var(--krn-font-weight-semibold);
    }
    .node-state--error {
      color: var(--krn-color-danger-text);
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .node-row,
      :host-context(html:not([data-krn-motion='full'])) .caret {
        transition: none;
      }
    }
    @media (forced-colors: active) {
      .node-row.selected {
        border-inline-start-color: Highlight;
      }
      .node:focus-visible {
        outline-color: Highlight;
      }
      ul.branch.with-guides::before {
        background: CanvasText;
      }
    }
  `,
})
export class KrnTreeNavigation {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ids = inject(KrnIdService);
  private readonly locale = inject(KRN_LOCALE);
  private readonly platform = inject(KRN_PLATFORM);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  private readonly elements = viewChildren<ElementRef<HTMLElement>>('treeItem');
  private readonly treeId = this.ids.next('tree-navigation');
  private typeaheadBuffer = '';
  private typeaheadTimer: KrnScheduledHandle | null = null;
  private focusToken = 0;
  readonly items = input<readonly KrnTreeNavigationItem[]>([]);
  readonly selectedId = model<string | null>(null);
  readonly expandedIds = model<readonly string[]>([]);
  readonly ariaLabel = input(this.translations.navigation.navigationTree);
  readonly indent = input('1rem');
  readonly showGuides = input(true, { transform: booleanAttribute });
  readonly itemSelected = output<KrnTreeNavigationItem>();
  /** Requests children when an unloaded item is expanded or its failed request is retried. */
  readonly loadChildren = output<KrnTreeNavigationItem>();
  protected readonly resolvedAriaLabel = computed(
    () =>
      this.ariaLabel()?.trim() ||
      this.translations.navigation.navigationTree.trim() ||
      KRN_ENGLISH_TRANSLATIONS.navigation.navigationTree,
  );
  protected readonly treeItems = computed(() => {
    const ids = new Set<string>();
    const visit = (items: readonly KrnTreeNavigationItem[]): void => {
      for (const item of items) {
        if (typeof item.id !== 'string' || item.id.trim().length === 0 || ids.has(item.id)) {
          throw new Error(
            `KrnTreeNavigation requires non-empty unique item ids; received "${item.id}".`,
          );
        }
        ids.add(item.id);
        visit(item.children ?? []);
      }
    };
    const items = this.items();
    visit(items);
    return items;
  });
  private readonly visibleTreeItems = computed(() => {
    const result: KrnTreeNavigationItem[] = [];
    const visit = (items: readonly KrnTreeNavigationItem[]): void => {
      for (const item of items) {
        result.push(item);
        if (item.children?.length && this.isExpanded(item.id)) visit(item.children);
      }
    };
    visit(this.treeItems());
    return result;
  });
  private readonly focusableTreeItems = computed(() =>
    this.visibleTreeItems().filter((item) => !item.disabled),
  );
  private readonly tabStopId = computed(
    () =>
      (
        this.focusableTreeItems().find((candidate) => candidate.id === this.selectedId()) ??
        this.focusableTreeItems()[0]
      )?.id ?? null,
  );

  constructor() {
    effect(() => {
      const expandableIds = new Set<string>();
      const collectExpandableIds = (items: readonly KrnTreeNavigationItem[]): void => {
        for (const item of items) {
          if (this.isExpandable(item)) expandableIds.add(item.id);
          collectExpandableIds(item.children ?? []);
        }
      };
      collectExpandableIds(this.treeItems());
      const current = this.expandedIds();
      const normalized = [...new Set(current)].filter((id) => expandableIds.has(id));
      if (
        normalized.length !== current.length ||
        normalized.some((id, index) => id !== current[index])
      ) {
        this.expandedIds.set(normalized);
      }
    });

    effect(() => {
      const selectedId = this.selectedId();
      if (!selectedId || this.focusableTreeItems().some((item) => item.id === selectedId)) return;

      const token = ++this.focusToken;
      const document = this.platform.document;
      const focusWasInTree = this.hostContains(document.activeElement);
      const visibleIds = new Set(this.focusableTreeItems().map((item) => item.id));
      let replacement = this.enabledParent(selectedId);
      while (replacement && !visibleIds.has(replacement.id)) {
        replacement = this.enabledParent(replacement.id);
      }
      replacement ??= this.focusableTreeItems()[0] ?? null;
      this.selectedId.set(replacement?.id ?? null);
      if (focusWasInTree && replacement) {
        const replacementId = replacement.id;
        this.platform.queueMicrotask(() => {
          const currentFocus = document.activeElement;
          const focusMovedOutside =
            currentFocus !== document.body &&
            !!currentFocus?.isConnected &&
            !this.hostContains(currentFocus);
          if (
            token !== this.focusToken ||
            this.selectedId() !== replacementId ||
            focusMovedOutside
          ) {
            return;
          }
          this.focusItem(replacementId, false);
        });
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.typeaheadTimer !== null) {
        this.platform.cancelScheduled(this.typeaheadTimer);
      }
    });
  }

  protected isExpanded(id: string): boolean {
    return this.expandedIds().includes(id);
  }

  protected isExpandable(item: KrnTreeNavigationItem): boolean {
    return Boolean(item.children?.length || item.childrenState);
  }

  protected nodeStateLabel(item: KrnTreeNavigationItem): string | null {
    return item.childrenState === 'loading'
      ? (
          this.translations.navigation.loadingChildren ??
          KRN_ENGLISH_TRANSLATIONS.navigation.loadingChildren ??
          ((label: string) => `Loading children for ${label}`)
        )(item.label)
      : item.childrenState === 'error'
        ? (
            this.translations.navigation.childrenLoadFailed ??
            KRN_ENGLISH_TRANSLATIONS.navigation.childrenLoadFailed ??
            ((label: string) => `Could not load children for ${label}`)
          )(item.label)
        : null;
  }

  protected toggle(id: string): void {
    const item = this.findItem(id);
    const collapsing = this.isExpanded(id);
    this.expandedIds.update((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
    if (collapsing) {
      const branch = item;
      if (branch && this.containsId(branch.children ?? [], this.selectedId())) {
        const replacement = branch.disabled
          ? (this.enabledParent(id) ?? this.visibleItems().find((item) => !item.disabled))
          : branch;
        this.selectedId.set(replacement?.id ?? null);
      }
    } else if (item) {
      this.requestChildren(item);
    }
  }

  protected toggleFromPointer(id: string): void {
    this.toggle(id);
    const focus = (): void => this.focusItem(id);
    this.platform.queueMicrotask(focus);
  }

  protected treeGroupId(id: string): string {
    return this.ids.fromKey('tree-group', `${this.treeId}:${id}`);
  }

  protected activate(item: KrnTreeNavigationItem): void {
    if (item.disabled) return;
    this.selectedId.set(item.id);
    this.itemSelected.emit(item);
  }

  protected onKeydown(event: KeyboardEvent, item: KrnTreeNavigationItem): void {
    if (item.disabled) return;

    if (this.handleTypeahead(event, item)) return;

    if (event.key === 'ArrowRight' && this.isExpandable(item)) {
      event.preventDefault();
      if (!this.isExpanded(item.id)) this.toggle(item.id);
      else if (!item.children?.length) this.requestChildren(item);
      else this.focusItem(this.firstFocusableVisibleDescendant(item)?.id);
      return;
    }
    if (event.key === 'ArrowLeft' && this.isExpandable(item) && this.isExpanded(item.id)) {
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

  private handleTypeahead(event: KeyboardEvent, item: KrnTreeNavigationItem): boolean {
    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.key.length !== 1 ||
      !event.key.trim()
    ) {
      return false;
    }

    event.preventDefault();
    if (this.typeaheadTimer !== null) this.platform.cancelScheduled(this.typeaheadTimer);
    this.typeaheadBuffer += event.key.toLocaleLowerCase(this.locale);
    const clearTypeahead = (): void => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    };
    this.typeaheadTimer = this.platform.schedule(clearTypeahead, 500);

    const visible = this.focusableVisibleItems();
    const current = visible.findIndex((candidate) => candidate.id === item.id);
    const repeatedCharacter = [...this.typeaheadBuffer].every(
      (character) => character === this.typeaheadBuffer[0],
    );
    const query = repeatedCharacter ? this.typeaheadBuffer[0] : this.typeaheadBuffer;
    const ordered = [...visible.slice(current + 1), ...visible.slice(0, current + 1)];
    const match = ordered.find((candidate) =>
      candidate.label
        .trim()
        .toLocaleLowerCase(this.locale)
        .startsWith(query ?? ''),
    );
    if (match) this.focusItem(match.id);
    return true;
  }

  private visibleItems(): readonly KrnTreeNavigationItem[] {
    return this.visibleTreeItems();
  }

  protected isTabStop(item: KrnTreeNavigationItem): boolean {
    return this.tabStopId() === item.id;
  }

  private focusableVisibleItems(): readonly KrnTreeNavigationItem[] {
    return this.focusableTreeItems();
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
    return visit(this.treeItems());
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
    return visit(this.treeItems(), null);
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

  private requestChildren(item: KrnTreeNavigationItem): void {
    if (!item.children?.length && item.childrenState && item.childrenState !== 'loading') {
      this.loadChildren.emit(item);
    }
  }

  private enabledParent(id: string): KrnTreeNavigationItem | null {
    let parent = this.findParent(id);
    while (parent?.disabled) {
      parent = this.findParent(parent.id);
    }
    return parent;
  }

  private focusItem(id?: string, select = true): void {
    if (!id) return;
    const item = this.visibleItems().find((candidate) => candidate.id === id);
    if (!item || item.disabled) return;
    if (select) this.selectedId.set(id);
    this.elements()
      .find(({ nativeElement }) => nativeElement.dataset['treeItem'] === id)
      ?.nativeElement.focus();
  }

  private hostContains(element: Element | null): boolean {
    return this.elements().some(({ nativeElement }) =>
      element ? nativeElement === element || nativeElement.contains(element) : false,
    );
  }
}
