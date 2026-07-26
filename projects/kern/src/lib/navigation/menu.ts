import type {
  ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import type { KrnNavigationItem } from './navigation.types';

@Component({
  selector: 'krn-menu',
  standalone: true,
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #trigger
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="trigger"
      [attr.aria-label]="triggerAriaLabel()"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <ng-content select="[krnMenuTrigger]" />
      @if (!hasProjectedTrigger()) {
        <span>{{ triggerLabel() }}</span><span aria-hidden="true">⌄</span>
      }
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPositions]="positions"
      (backdropClick)="close('outside')"
      (detach)="close('detach')"
    >
      <div class="menu-panel" role="menu" [attr.aria-label]="menuAriaLabel()" (keydown)="onMenuKeydown($event)">
        @for (item of items(); track item.id; let index = $index) {
          @if (item.href && !item.disabled) {
            <a
              #menuItem
              role="menuitem"
              [href]="item.href"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (click)="activate(item)"
              (pointerenter)="activeIndex.set(index)"
            >
              <span>{{ item.label }}</span>
              @if (item.shortcut) {
                <kbd>{{ item.shortcut }}</kbd>
              }
            </a>
          } @else {
            <button
              #menuItem
              type="button"
              role="menuitem"
              [disabled]="item.disabled"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (click)="activate(item)"
              (pointerenter)="activeIndex.set(index)"
            >
              <span>{{ item.label }}</span>
              @if (item.shortcut) {
                <kbd>{{ item.shortcut }}</kbd>
              }
            </button>
          }
        } @empty {
          <p class="empty">No actions available</p>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host{display:inline-block}.trigger{display:inline-flex;align-items:center;justify-content:center;gap:var(--krn-space-2);min-block-size:var(--krn-control-height-md);padding-inline:var(--krn-control-padding-inline);border:var(--krn-border-width-1) solid var(--krn-color-border-interactive);border-radius:var(--krn-radius-sm);background:var(--krn-color-surface);color:var(--krn-color-text);font:inherit;font-weight:var(--krn-font-weight-medium);cursor:pointer}.trigger:hover{border-color:var(--krn-color-border-strong);background:var(--krn-color-surface-subtle)}.trigger:focus-visible,.menu-panel :is(a,button):focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}.menu-panel{display:grid;min-inline-size:12rem;max-inline-size:min(22rem,calc(100vw - var(--krn-space-8)));padding:var(--krn-space-1);border:var(--krn-border-width-1) solid var(--krn-color-border);border-radius:var(--krn-radius-md);box-shadow:var(--krn-shadow-overlay);background:var(--krn-color-surface-raised);color:var(--krn-color-text)}.menu-panel :is(a,button){display:flex;align-items:center;justify-content:space-between;gap:var(--krn-space-4);min-block-size:var(--krn-control-height-sm);padding-inline:var(--krn-space-3);border:0;border-radius:var(--krn-radius-sm);background:transparent;color:inherit;font:inherit;text-align:start;text-decoration:none;cursor:pointer}.menu-panel :is(a,button):hover,.menu-panel :is(a,button):focus{background:var(--krn-color-surface-subtle)}.menu-panel button:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}.menu-panel kbd{color:var(--krn-color-text-subtle);font:inherit;font-size:var(--krn-font-size-xs)}.empty{margin:0;padding:var(--krn-space-3);color:var(--krn-color-text-muted);font-size:var(--krn-font-size-sm)}
  `,
})
export class KrnMenu {
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuItems = viewChildren<ElementRef<HTMLElement>>('menuItem');
  readonly items = input<readonly (KrnNavigationItem & { readonly shortcut?: string })[]>([]);
  readonly open = model(false);
  readonly triggerLabel = input('Actions');
  readonly triggerAriaLabel = input('Open menu');
  readonly menuAriaLabel = input('Actions');
  readonly hasProjectedTrigger = input(false);
  readonly itemSelected = output<KrnNavigationItem>();
  readonly closed = output<'escape' | 'outside' | 'detach' | 'selection'>();
  protected readonly activeIndex = signal(0);
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

  protected toggle(): void {
    this.open.update((value) => !value);
    if (this.open()) this.focusFirst();
  }

  protected close(reason: 'escape' | 'outside' | 'detach' | 'selection'): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit(reason);
    if (reason === 'escape') setTimeout(() => this.trigger()?.nativeElement.focus());
  }

  protected activate(item: KrnNavigationItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
    this.close('selection');
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.open.set(true);
    this.activeIndex.set(event.key === 'ArrowDown' ? 0 : Math.max(0, this.items().length - 1));
    this.focusActive();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
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
    let next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (this.activeIndex() + delta + items.length) % items.length;
    while (items[next]?.disabled && next !== this.activeIndex()) {
      next = (next + (delta || 1) + items.length) % items.length;
    }
    this.activeIndex.set(next);
    this.focusActive();
  }

  private focusFirst(): void {
    this.activeIndex.set(this.items().findIndex((item) => !item.disabled));
    this.focusActive();
  }

  private focusActive(): void {
    setTimeout(() => this.menuItems()[this.activeIndex()]?.nativeElement.focus());
  }
}

@Component({
  selector: 'krn-menubar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="menubar" role="menubar" [attr.aria-label]="ariaLabel()" (keydown)="onKeydown($event)">
      @for (item of items(); track item.id; let index = $index) {
        @if (item.href && !item.disabled) {
          <a
            #barItem
            role="menuitem"
            [href]="item.href"
            [attr.tabindex]="index === activeIndex() ? 0 : -1"
            (click)="itemSelected.emit(item)"
            >{{ item.label }}</a
          >
        } @else {
          <button
            #barItem
            type="button"
            role="menuitem"
            [disabled]="item.disabled"
            [attr.tabindex]="index === activeIndex() ? 0 : -1"
            (click)="!item.disabled && itemSelected.emit(item)"
          >
            {{ item.label }}
          </button>
        }
      }
    </div>
  `,
  styles: `
    :host{display:block}.menubar{display:flex;align-items:center;gap:var(--krn-space-1);min-inline-size:0}.menubar :is(a,button){display:inline-flex;align-items:center;min-block-size:var(--krn-control-height-sm);padding-inline:var(--krn-space-3);border:0;border-radius:var(--krn-radius-sm);background:transparent;color:var(--krn-color-text-muted);font:inherit;text-decoration:none;white-space:nowrap;cursor:pointer}.menubar :is(a,button):hover,.menubar :is(a,button):focus{background:var(--krn-color-surface-subtle);color:var(--krn-color-text)}.menubar :is(a,button):focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset)}.menubar button:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}
  `,
})
export class KrnMenubar {
  private readonly elements = viewChildren<ElementRef<HTMLElement>>('barItem');
  readonly items = input<readonly KrnNavigationItem[]>([]);
  readonly ariaLabel = input('Application menu');
  readonly itemSelected = output<KrnNavigationItem>();
  protected readonly activeIndex = signal(0);

  protected onKeydown(event: KeyboardEvent): void {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const items = this.items();
    let next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (this.activeIndex() + delta + items.length) % items.length;
    while (items[next]?.disabled && next !== this.activeIndex()) {
      next = (next + (delta || 1) + items.length) % items.length;
    }
    this.activeIndex.set(next);
    this.elements()[next]?.nativeElement.focus();
  }
}

@Component({
  selector: 'krn-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(contextmenu)': 'onContextMenu($event)',
  },
  template: `
    <ng-content />
    @if (open()) {
      <div
        class="context-panel"
        role="menu"
        [attr.aria-label]="ariaLabel()"
        [style.inset-inline-start.px]="x()"
        [style.inset-block-start.px]="y()"
        (keydown)="onKeydown($event)"
      >
        @for (item of items(); track item.id; let index = $index) {
          <button
            #contextItem
            type="button"
            role="menuitem"
            [disabled]="item.disabled"
            [attr.tabindex]="index === activeIndex() ? 0 : -1"
            (click)="activate(item)"
          >
            {{ item.label }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host{display:contents}.context-panel{position:fixed;z-index:var(--krn-z-dropdown);display:grid;min-inline-size:12rem;padding:var(--krn-space-1);border:var(--krn-border-width-1) solid var(--krn-color-border);border-radius:var(--krn-radius-md);box-shadow:var(--krn-shadow-overlay);background:var(--krn-color-surface-raised);color:var(--krn-color-text)}button{min-block-size:var(--krn-control-height-sm);padding-inline:var(--krn-space-3);border:0;border-radius:var(--krn-radius-sm);background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}button:hover,button:focus{background:var(--krn-color-surface-subtle)}button:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:calc(var(--krn-focus-ring-offset) * -1)}button:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}
  `,
})
export class KrnContextMenu {
  private readonly document = inject(DOCUMENT);
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('contextItem');
  readonly items = input<readonly KrnNavigationItem[]>([]);
  readonly ariaLabel = input('Context actions');
  readonly itemSelected = output<KrnNavigationItem>();
  readonly open = signal(false);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly activeIndex = signal(0);
  private previousFocus: HTMLElement | null = null;

  protected onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const view = this.document.defaultView;
    this.previousFocus =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.x.set(Math.min(event.clientX, Math.max(0, (view?.innerWidth ?? event.clientX + 240) - 240)));
    this.y.set(Math.min(event.clientY, Math.max(0, (view?.innerHeight ?? event.clientY + 240) - 240)));
    this.activeIndex.set(Math.max(0, this.items().findIndex((item) => !item.disabled)));
    this.open.set(true);
    setTimeout(() => this.elements()[this.activeIndex()]?.nativeElement.focus());
  }

  protected activate(item: KrnNavigationItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.open.set(false);
      this.previousFocus?.focus();
      return;
    }
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const items = this.items();
    let next = (this.activeIndex() + delta + items.length) % items.length;
    while (items[next]?.disabled && next !== this.activeIndex()) next = (next + delta + items.length) % items.length;
    this.activeIndex.set(next);
    this.elements()[next]?.nativeElement.focus();
  }

  @HostListener('document:click')
  @HostListener('window:blur')
  protected dismiss(): void {
    this.open.set(false);
  }
}
