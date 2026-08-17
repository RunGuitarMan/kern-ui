import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { OverlayModule } from '@angular/cdk/overlay';
import { KRN_PLATFORM, KrnOverlayCoordinator, krnIsHtmlElement } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnContextMenuItem, KrnNavigationItem } from './navigation.types';

function validateContextMenuItems(
  items: readonly KrnContextMenuItem[],
): readonly KrnContextMenuItem[] {
  const ids = new Set<string>();
  const visit = (branch: readonly KrnContextMenuItem[]): void => {
    for (const item of branch) {
      if (ids.has(item.id)) {
        throw new Error(
          `KrnContextMenu requires globally unique item ids; duplicate: "${item.id}".`,
        );
      }
      ids.add(item.id);
      visit(item.children ?? []);
    }
  };
  visit(items);
  return items;
}

/** Identifies projected trigger content without a parallel boolean input. */
@Directive({
  selector: '[krnMenuTrigger]',
  standalone: true,
})
export class KrnMenuTrigger {}

@Component({
  selector: 'krn-menu',
  standalone: true,
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class KrnMenu {
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');
  private readonly menuItems = viewChildren<ElementRef<HTMLElement>>('menuItem');
  private readonly projectedTrigger = contentChild(KrnMenuTrigger);
  readonly items = input<readonly (KrnNavigationItem & { readonly shortcut?: string })[]>([]);
  readonly open = model(false);
  readonly triggerLabel = input<string | undefined>();
  readonly triggerAriaLabel = input<string | undefined>();
  readonly menuAriaLabel = input<string | undefined>();
  readonly emptyLabel = input<string | undefined>();
  readonly itemSelected = output<KrnNavigationItem>();
  readonly closed = output<'escape' | 'outside' | 'detach' | 'selection'>();
  protected readonly activeIndex = signal(0);
  protected readonly panelId = signal<string | null>(null);
  protected readonly hasEnabledItems = computed(() => this.items().some((item) => !item.disabled));
  protected readonly showDefaultTrigger = computed(() => !this.projectedTrigger());
  protected readonly resolvedTriggerLabel = computed(
    () => this.triggerLabel()?.trim() || this.translations.navigation.actions.trim(),
  );
  protected readonly resolvedTriggerAriaLabel = computed(
    () => this.triggerAriaLabel()?.trim() || this.translations.navigation.openMenu.trim() || null,
  );
  protected readonly resolvedMenuAriaLabel = computed(
    () => this.menuAriaLabel()?.trim() || this.translations.navigation.actions.trim() || null,
  );
  protected readonly resolvedEmptyLabel = computed(
    () => this.emptyLabel()?.trim() || this.translations.navigation.menuEmpty.trim(),
  );
  protected readonly positions = [
    {
      originX: 'start' as const,
      originY: 'bottom' as const,
      overlayX: 'start' as const,
      overlayY: 'top' as const,
      offsetY: 4,
    },
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'start' as const,
      overlayY: 'bottom' as const,
      offsetY: -4,
    },
  ];

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const active = this.activeIndex();
      if (this.items()[active] && !this.items()[active]?.disabled) {
        this.focusActive();
        return;
      }
      const next = this.findEnabledIndex(0, 1);
      this.activeIndex.set(next);
      this.focusActive();
    });
  }

  protected toggle(): void {
    this.open.update((value) => !value);
    if (this.open()) this.focusFirst();
  }

  protected onAttach(overlay: CdkConnectedOverlay, origin: HTMLElement): void {
    const overlayElement = overlay.overlayRef.overlayElement;
    this.panelId.set(overlayElement.id ? `${overlayElement.id}-menu` : null);
    this.overlayCoordinator.registerOverlayOwnership(
      origin,
      overlayElement,
      overlay.overlayRef.backdropElement,
    );
    this.focusActive();
  }

  protected onDetach(): void {
    this.close('detach');
    this.panelId.set(null);
  }

  protected close(reason: 'escape' | 'outside' | 'detach' | 'selection'): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit(reason);
    if (reason === 'escape') this.schedule(() => this.trigger()?.nativeElement.focus());
  }

  protected activate(item: KrnNavigationItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
    this.close('selection');
  }

  protected focusIndex(index: number): void {
    if (this.items()[index]?.disabled) return;
    this.activeIndex.set(index);
    this.menuItems()[index]?.nativeElement.focus({ preventScroll: true });
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open() && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      this.close('escape');
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.open.set(true);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const start = direction === 1 ? 0 : this.items().length - 1;
    const next = this.findEnabledIndex(start, direction);
    if (next < 0) return;
    this.activeIndex.set(next);
    this.focusActive();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      this.close('escape');
      return;
    }
    if (event.key === 'Tab') {
      this.close('selection');
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0 && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const items = this.items();
    if (items.length === 0) return;
    const direction = event.key === 'End' ? -1 : delta || 1;
    const start =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : this.activeIndex() + direction;
    const next = this.findEnabledIndex(start, direction);
    if (next < 0) return;
    this.activeIndex.set(next);
    this.focusActive();
  }

  private focusFirst(): void {
    const next = this.findEnabledIndex(0, 1);
    if (next < 0) return;
    this.activeIndex.set(next);
    this.focusActive();
  }

  private findEnabledIndex(start: number, direction: 1 | -1): number {
    const items = this.items();
    if (items.length === 0) return -1;
    let index = ((start % items.length) + items.length) % items.length;
    for (let visited = 0; visited < items.length; visited += 1) {
      if (!items[index]?.disabled) return index;
      index = (index + direction + items.length) % items.length;
    }
    return -1;
  }

  private focusActive(): void {
    this.schedule(() => {
      const item = this.menuItems()[this.activeIndex()]?.nativeElement;
      (item ?? this.menuPanel()?.nativeElement)?.focus();
    });
  }

  private schedule(callback: () => void): void {
    if (this.platform.schedule(callback) === null) {
      callback();
    }
  }
}

@Component({
  selector: 'krn-menubar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menubar.html',
  styleUrl: './menubar.css',
})
export class KrnMenubar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly elements = viewChildren<ElementRef<HTMLElement>>('barItem');
  private readonly translations = inject(KRN_TRANSLATIONS);
  private focusRepairToken = 0;
  readonly items = input<readonly KrnNavigationItem[]>([]);
  readonly ariaLabel = input<string | undefined>();
  readonly itemSelected = output<KrnNavigationItem>();
  protected readonly activeIndex = signal(0);
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.applicationMenu.trim() || null,
  );

  constructor() {
    effect(() => {
      const items = this.items();
      const active = this.activeIndex();
      const hadFocus = this.host.nativeElement.contains(
        this.host.nativeElement.ownerDocument.activeElement,
      );
      if (items[active] && !items[active]?.disabled) {
        if (hadFocus) this.scheduleFocus(active);
        return;
      }
      const next = items.findIndex((item) => !item.disabled);
      if (next !== active) this.activeIndex.set(next);
      if (hadFocus && next >= 0) this.scheduleFocus(next);
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const rightToLeft =
      this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const forward = rightToLeft ? -1 : 1;
    const delta = event.key === 'ArrowRight' ? forward : event.key === 'ArrowLeft' ? -forward : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    const selectable = this.items()
      .map((_, index) => index)
      .filter((index) => !this.items()[index]?.disabled);
    if (selectable.length === 0) return;
    event.preventDefault();
    const current = selectable.indexOf(this.activeIndex());
    const next =
      event.key === 'Home'
        ? selectable[0]
        : event.key === 'End'
          ? selectable.at(-1)
          : current < 0
            ? selectable[delta > 0 ? 0 : selectable.length - 1]
            : selectable[(current + delta + selectable.length) % selectable.length];
    if (next === undefined) return;
    this.activeIndex.set(next);
    this.elements()[next]?.nativeElement.focus();
  }

  private scheduleFocus(index: number): void {
    const token = ++this.focusRepairToken;
    const host = this.host.nativeElement;
    const document = host.ownerDocument;
    const previousFocus = document.activeElement;
    const focus = (): void => {
      const currentFocus = document.activeElement;
      const movedOutside =
        currentFocus !== previousFocus &&
        currentFocus !== document.body &&
        !!currentFocus?.isConnected &&
        !host.contains(currentFocus);
      if (token !== this.focusRepairToken || this.activeIndex() !== index || movedOutside) return;
      this.elements()[index]?.nativeElement.focus();
    };
    if (this.platform.schedule(focus) === null) focus();
  }
}

@Component({
  selector: 'krn-context-menu',
  standalone: true,
  imports: [NgTemplateOutlet, OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(contextmenu)': 'onContextMenu($event)',
  },
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.css',
})
export class KrnContextMenu {
  private readonly overlayCoordinator = inject(KrnOverlayCoordinator);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('contextItem');
  private readonly panels = viewChildren<ElementRef<HTMLElement>>('contextPanel');
  readonly items = input<readonly KrnContextMenuItem[], readonly KrnContextMenuItem[]>([], {
    transform: validateContextMenuItems,
  });
  readonly ariaLabel = input<string | undefined>();
  readonly itemSelected = output<KrnContextMenuItem>();
  protected readonly open = signal(false);
  protected readonly origin = signal({ x: 0, y: 0 });
  protected readonly activeId = signal('');
  protected readonly openPath = signal<readonly string[]>([]);
  private readonly submenusTowardsStart = signal<ReadonlySet<string>>(new Set());
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.contextActions.trim() || null,
  );
  protected readonly resolvedEmptyLabel = computed(() =>
    this.translations.navigation.menuEmpty.trim(),
  );
  protected readonly positions = [
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'start' as const,
      overlayY: 'top' as const,
    },
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'end' as const,
      overlayY: 'top' as const,
    },
    {
      originX: 'start' as const,
      originY: 'top' as const,
      overlayX: 'start' as const,
      overlayY: 'bottom' as const,
    },
  ];
  private previousFocus: HTMLElement | null = null;
  private focusToken = 0;

  constructor() {
    if (this.platform.isBrowser) {
      const document = this.platform.document;
      const window = this.platform.window;
      const onEscape = (event: KeyboardEvent): void => this.onDocumentEscape(event);
      const onContextMenu = (event: MouseEvent): void => this.onDocumentContextMenu(event);
      const onBlur = (): void => this.onWindowBlur();

      document.addEventListener('keydown', onEscape);
      document.addEventListener('contextmenu', onContextMenu);
      window?.addEventListener('blur', onBlur);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('keydown', onEscape);
        document.removeEventListener('contextmenu', onContextMenu);
        window?.removeEventListener('blur', onBlur);
      });
    }

    effect(() => {
      if (!this.open()) return;
      const activePath = this.pathTo(this.activeId());
      const current = activePath.at(-1);
      const activeItemIsVisible = activePath
        .slice(0, -1)
        .every((ancestor) => !ancestor.disabled && this.openPath().includes(ancestor.id));
      if (current && !current.disabled && activeItemIsVisible) return;
      const document = this.platform.document;
      const currentFocus = document.activeElement;
      const focusWasInMenu = this.panels().some((panel) =>
        currentFocus ? panel.nativeElement.contains(currentFocus) : false,
      );
      const focusWasLost = currentFocus === document.body || !currentFocus?.isConnected;
      const next = this.items().find((item) => !item.disabled)?.id ?? '';
      this.activeId.set(next);
      this.openPath.set([]);
      if (focusWasInMenu || focusWasLost) this.focusById(next);
    });
  }

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.previousFocus = krnIsHtmlElement(this.platform, this.platform.document.activeElement)
      ? this.platform.document.activeElement
      : null;
    this.origin.set({ x: event.clientX, y: event.clientY });
    this.activeId.set(this.items().find((item) => !item.disabled)?.id ?? '');
    this.openPath.set([]);
    this.submenusTowardsStart.set(new Set());
    this.open.set(true);
    this.focusById(this.activeId());
  }

  protected onAttach(overlay: CdkConnectedOverlay): void {
    this.overlayCoordinator.registerOverlayOwnership(
      this.host.nativeElement,
      overlay.overlayRef.overlayElement,
      overlay.overlayRef.backdropElement,
    );
    this.focusById(this.activeId());
  }

  protected onOverlayDetach(): void {
    if (this.open()) this.dismiss(true);
  }

  protected branchHasEnabledItem(items: readonly KrnContextMenuItem[]): boolean {
    return items.some((item) => !item.disabled);
  }

  protected rightToLeft(): boolean {
    return this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }

  protected submenuOpensTowardsStart(id: string): boolean {
    return this.submenusTowardsStart().has(id);
  }

  protected submenuOpen(id: string): boolean {
    return this.openPath().includes(id);
  }

  protected onPointerEnter(item: KrnContextMenuItem): void {
    if (item.disabled) return;
    this.activeId.set(item.id);
    if (item.children?.some((child) => !child.disabled)) this.updateSubmenuDirection(item.id);
    const path = this.pathTo(item.id);
    this.openPath.set(
      path
        .filter(
          (candidate) =>
            candidate.id !== item.id || candidate.children?.some((child) => !child.disabled),
        )
        .map((candidate) => candidate.id),
    );
    this.focusById(item.id);
  }

  protected onItemClick(event: MouseEvent, item: KrnContextMenuItem): void {
    event.stopPropagation();
    if (item.children?.length) {
      this.openBranch(item, true);
      return;
    }
    this.activate(item);
  }

  protected activate(item: KrnContextMenuItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
    this.dismiss(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      const parent = this.findParent(this.activeId());
      if (parent) {
        this.openPath.set(
          this.pathTo(parent.id)
            .slice(0, -1)
            .map((item) => item.id),
        );
        this.activeId.set(parent.id);
        this.focusById(parent.id);
        return;
      }
      this.dismiss(true);
      return;
    }
    const current = this.findItem(this.activeId());
    if (!current) return;
    const rightToLeft = this.rightToLeft();
    const openKey = rightToLeft ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rightToLeft ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === openKey && current.children?.length) {
      event.preventDefault();
      this.openBranch(current, true);
      return;
    }
    if (event.key === closeKey) {
      const parent = this.findParent(current.id);
      if (!parent) return;
      event.preventDefault();
      this.openPath.set(
        this.pathTo(parent.id)
          .slice(0, -1)
          .map((item) => item.id),
      );
      this.activeId.set(parent.id);
      this.focusById(parent.id);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (current.children?.length) this.openBranch(current, true);
      else this.activate(current);
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const siblings = this.findSiblings(current.id).filter((item) => !item.disabled);
    if (siblings.length === 0) return;
    const currentIndex = siblings.findIndex((item) => item.id === current.id);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? siblings.length - 1
          : (currentIndex + delta + siblings.length) % siblings.length;
    const nextItem = siblings[next];
    if (!nextItem) return;
    this.activeId.set(nextItem.id);
    this.focusById(nextItem.id);
  }

  private openBranch(item: KrnContextMenuItem, focusChild: boolean): void {
    const child = item.children?.find((candidate) => !candidate.disabled);
    if (focusChild && !child) return;
    if (child) this.updateSubmenuDirection(item.id);
    const path = this.pathTo(item.id).filter((candidate) => candidate.children?.length);
    this.openPath.set(path.map((candidate) => candidate.id));
    if (!focusChild || !child) return;
    this.activeId.set(child.id);
    this.focusById(child.id);
  }

  private updateSubmenuDirection(id: string): void {
    const trigger = this.elements().find(
      (element) => element.nativeElement.dataset['contextItem'] === id,
    )?.nativeElement;
    const root = this.panels().find((panel) =>
      panel.nativeElement.classList.contains('context-panel--root'),
    )?.nativeElement;
    const view = this.platform.window;
    if (!trigger || !root || !view) return;
    const triggerRect = trigger.getBoundingClientRect();
    const rootFontSize = Number.parseFloat(
      view.getComputedStyle(this.platform.document.documentElement).fontSize,
    );
    // A nested branch can be wider than its root. Use the CSS maximum instead of the
    // currently rendered root width so the first frame never chooses an overflowing side.
    const submenuWidth = 18 * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
    const rightToLeft = this.rightToLeft();
    const spaceAtEnd = rightToLeft ? triggerRect.left : view.innerWidth - triggerRect.right;
    const spaceAtStart = rightToLeft ? view.innerWidth - triggerRect.right : triggerRect.left;
    const towardsStart = spaceAtEnd < submenuWidth + 8 && spaceAtStart > spaceAtEnd;
    const directions = new Set(this.submenusTowardsStart());
    if (towardsStart) directions.add(id);
    else directions.delete(id);
    this.submenusTowardsStart.set(directions);
  }

  private findItem(id: string): KrnContextMenuItem | null {
    return this.pathTo(id).at(-1) ?? null;
  }

  private findParent(id: string): KrnContextMenuItem | null {
    return this.pathTo(id).at(-2) ?? null;
  }

  private findSiblings(id: string): readonly KrnContextMenuItem[] {
    const parent = this.findParent(id);
    return parent?.children ?? this.items();
  }

  private pathTo(id: string): readonly KrnContextMenuItem[] {
    const visit = (
      items: readonly KrnContextMenuItem[],
      path: readonly KrnContextMenuItem[],
    ): readonly KrnContextMenuItem[] => {
      for (const item of items) {
        const nextPath = [...path, item];
        if (item.id === id) return nextPath;
        const found = visit(item.children ?? [], nextPath);
        if (found.length) return found;
      }
      return [];
    };
    return visit(this.items(), []);
  }

  private focusById(id: string): void {
    const token = ++this.focusToken;
    const document = this.platform.document;
    const previousFocus = document.activeElement;
    const focus = (): void => {
      const panels = this.panels().map((panel) => panel.nativeElement);
      const currentFocus = document.activeElement;
      const movedOutside =
        currentFocus !== previousFocus &&
        currentFocus !== document.body &&
        !!currentFocus?.isConnected &&
        !panels.some((panel) => panel.contains(currentFocus));
      if (token !== this.focusToken || !this.open() || movedOutside) return;
      const item = id
        ? this.elements().find((element) => element.nativeElement.dataset['contextItem'] === id)
            ?.nativeElement
        : null;
      (item ?? panels.find((panel) => panel.classList.contains('context-panel--root')))?.focus();
    };
    if (this.platform.schedule(focus) === null) {
      focus();
    }
  }

  protected dismiss(restoreFocus: boolean): void {
    if (!this.open()) return;
    this.focusToken += 1;
    const document = this.platform.document;
    const currentFocus = document.activeElement;
    const focusWasInMenu = this.panels().some((panel) =>
      currentFocus ? panel.nativeElement.contains(currentFocus) : false,
    );
    this.open.set(false);
    this.openPath.set([]);
    if (
      restoreFocus &&
      this.previousFocus?.isConnected &&
      (focusWasInMenu || currentFocus === document.body || !currentFocus?.isConnected)
    ) {
      this.previousFocus.focus({ preventScroll: true });
    }
  }

  protected onDocumentEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open() || event.defaultPrevented) return;
    event.preventDefault();
    this.dismiss(true);
  }

  protected onDocumentContextMenu(event: MouseEvent): void {
    if (!this.open() || this.host.nativeElement.contains(event.target as Node)) return;
    event.preventDefault();
    this.dismiss(false);
  }

  protected onWindowBlur(): void {
    this.dismiss(false);
  }
}
