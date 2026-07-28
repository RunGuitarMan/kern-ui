import { A11yModule } from '@angular/cdk/a11y';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';

import { KRN_PLATFORM, KrnIdService, KrnOverlayCoordinator } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnLayoutSpace } from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-app-shell',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #mobileTrigger
      type="button"
      class="krn-shell__mobile-trigger"
      [attr.aria-controls]="mobileNavigationId()"
      [attr.aria-expanded]="isMobileNavigationOpen()"
      [attr.aria-label]="isMobileNavigationOpen() ? closeNavigationLabel() : openNavigationLabel()"
      (click)="mobileNavigationOpen.update(toggle)"
    >
      <span aria-hidden="true">☰</span>
    </button>
    <div class="krn-shell">
      <div class="krn-shell__header">
        <ng-content select="krn-header,[krnAppHeader]" />
      </div>
      <div
        #mobilePanel
        class="krn-shell__navigation"
        [id]="mobileNavigationId()"
        [attr.role]="isMobileNavigationOpen() ? 'dialog' : null"
        [attr.aria-label]="isMobileNavigationOpen() ? mobileNavigationLabel() : null"
        [attr.aria-modal]="isMobileNavigationOpen() ? 'true' : null"
        [attr.tabindex]="isMobileNavigationOpen() ? '-1' : null"
        [cdkTrapFocus]="isMobileNavigationOpen()"
        [cdkTrapFocusAutoCapture]="false"
        (pointerdown)="closeFromBackdrop($event)"
      >
        <div class="krn-shell__navigation-surface" (pointerdown)="$event.stopPropagation()">
          <button
            type="button"
            class="krn-shell__mobile-close"
            [attr.aria-label]="closeNavigationLabel()"
            (click)="mobileNavigationOpen.set(false)"
          >
            <span aria-hidden="true">×</span>
          </button>
          <div class="krn-shell__rail">
            <ng-content select="krn-navigation-rail,[krnAppRail]" />
          </div>
          <div class="krn-shell__sidebar">
            <ng-content select="krn-sidebar,[krnAppSidebar]" />
          </div>
        </div>
      </div>
      <main class="krn-shell__main" [id]="mainId()" tabindex="-1">
        <ng-content />
      </main>
    </div>
  `,
  host: {
    '[style.--krn-shell-sidebar-width]': 'resolvedSidebarWidth()',
    '[style.--krn-shell-rail-width]': 'resolvedRailWidth()',
    '[style.--krn-shell-main-max]': 'resolvedMainMaxWidth()',
    '[attr.data-sidebar-position]': 'sidebarPosition()',
    '[attr.data-mobile-navigation]': 'mobileNavigation()',
    '[attr.data-mobile-navigation-open]': 'isMobileNavigationOpen() ? "" : null',
  },
  styles: `
    :host {
      position: relative;
      display: block;
      min-block-size: 100dvb;
      min-inline-size: 0;
      overflow: clip;
      border-radius: inherit;
      background: var(--krn-color-canvas);
      color: var(--krn-color-text);
    }

    .krn-shell__mobile-trigger,
    .krn-shell__mobile-close {
      display: none;
      inline-size: var(--krn-touch-target-min);
      block-size: var(--krn-touch-target-min);
      padding: 0;
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-md);
      place-items: center;
      background: var(--krn-color-surface-raised);
      color: var(--krn-color-text);
      font: inherit;
      font-size: var(--krn-font-size-lg);
      cursor: pointer;
    }

    :is(.krn-shell__mobile-trigger, .krn-shell__mobile-close):focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }

    .krn-shell {
      display: grid;
      min-block-size: inherit;
      overflow: clip;
      border-radius: inherit;
      grid-template:
        'header header header' auto
        'rail sidebar main' minmax(0, 1fr) /
        auto auto minmax(0, 1fr);
    }

    .krn-shell__header {
      z-index: var(--krn-z-sticky);
      grid-area: header;
      min-inline-size: 0;
      overflow: clip;
      border-start-start-radius: inherit;
      border-start-end-radius: inherit;
    }

    .krn-shell__navigation,
    .krn-shell__navigation-surface {
      display: contents;
    }

    .krn-shell__rail {
      grid-area: rail;
      inline-size: fit-content;
      min-inline-size: 0;
      justify-self: start;
    }

    .krn-shell__sidebar {
      grid-area: sidebar;
      inline-size: fit-content;
      min-inline-size: 0;
      justify-self: start;
    }

    .krn-shell__main {
      grid-area: main;
      inline-size: min(100%, var(--krn-shell-main-max));
      min-inline-size: 0;
      min-block-size: 0;
      margin-inline: auto;
      outline: none;
    }

    .krn-shell__header:empty,
    .krn-shell__rail:empty,
    .krn-shell__sidebar:empty {
      display: none;
    }

    :host([data-sidebar-position='end']) .krn-shell {
      grid-template:
        'header header header' auto
        'main sidebar rail' minmax(0, 1fr) /
        minmax(0, 1fr) auto auto;
    }

    @media (max-width: 48rem) {
      .krn-shell,
      :host([data-sidebar-position='end']) .krn-shell {
        grid-template:
          'header' auto
          'main' minmax(0, 1fr) / minmax(0, 1fr);
      }

      .krn-shell__mobile-trigger {
        position: absolute;
        z-index: calc(var(--krn-z-sticky) + 1);
        inset-block-start: var(--krn-space-2);
        inset-inline-start: var(--krn-space-2);
        display: grid;
      }

      :host([data-mobile-navigation='hidden']) .krn-shell__mobile-trigger,
      :host:not(:has(.krn-shell__rail:not(:empty), .krn-shell__sidebar:not(:empty)))
        .krn-shell__mobile-trigger {
        display: none;
      }

      .krn-shell__navigation {
        display: none;
      }

      :host([data-mobile-navigation-open]) .krn-shell__navigation {
        display: grid;
        position: fixed;
        z-index: var(--krn-z-modal);
        inset: 0;
        justify-items: start;
        background: var(--krn-color-backdrop);
      }

      :host([data-sidebar-position='end'][data-mobile-navigation-open]) .krn-shell__navigation {
        justify-items: end;
      }

      .krn-shell__navigation-surface {
        position: relative;
        display: flex;
        min-inline-size: min(18rem, 88vi);
        max-inline-size: min(
          88vi,
          calc(var(--krn-shell-sidebar-width) + var(--krn-shell-rail-width))
        );
        block-size: 100dvb;
        overflow: hidden;
        box-shadow: var(--krn-shadow-overlay);
        background: var(--krn-color-surface);
      }

      .krn-shell__mobile-close {
        position: absolute;
        z-index: 1;
        inset-block-start: var(--krn-space-2);
        inset-inline-end: var(--krn-space-2);
        display: grid;
      }

      .krn-shell__rail,
      .krn-shell__sidebar {
        display: block;
        min-block-size: 0;
        block-size: 100%;
      }

      :host([data-mobile-navigation='sidebar']) .krn-shell__rail,
      :host([data-mobile-navigation='rail']) .krn-shell__sidebar {
        display: none;
      }
    }

    @media (forced-colors: active) {
      .krn-shell__rail,
      .krn-shell__sidebar {
        border-inline-end: 1px solid CanvasText;
      }
    }
  `,
})
export class KrnAppShell {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly coordinator = inject(KrnOverlayCoordinator);
  private readonly ids = inject(KrnIdService);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mobilePanel = viewChild<ElementRef<HTMLElement>>('mobilePanel');
  private readonly mobileTrigger = viewChild<ElementRef<HTMLButtonElement>>('mobileTrigger');
  private readonly mobileViewport = signal(false);
  private readonly overlayId = this.ids.next('mobile-navigation-overlay');
  readonly sidebarWidth = input<KrnLayoutSpace>('17rem');
  readonly railWidth = input<KrnLayoutSpace>('3.5rem');
  readonly mainMaxWidth = input<KrnLayoutSpace>('100%');
  readonly sidebarPosition = input<'start' | 'end'>('start');
  readonly mobileNavigation = input<'auto' | 'hidden' | 'sidebar' | 'rail'>('auto');
  readonly mobileNavigationOpen = model(false);
  readonly mobileNavigationId = input(this.ids.next('mobile-navigation'));
  readonly mobileNavigationLabel = input(this.translations.layout.mobileNavigation);
  readonly openNavigationLabel = input(this.translations.layout.openNavigation);
  readonly closeNavigationLabel = input(this.translations.layout.closeNavigation);
  readonly mainId = input('main-content');
  protected readonly toggle = (value: boolean): boolean => !value;
  protected readonly isMobileNavigationOpen = computed(
    () =>
      this.mobileViewport() && this.mobileNavigation() !== 'hidden' && this.mobileNavigationOpen(),
  );

  protected readonly resolvedSidebarWidth = computed(() =>
    krnCssLength(this.sidebarWidth(), '17rem'),
  );
  protected readonly resolvedRailWidth = computed(() => krnCssLength(this.railWidth(), '3.5rem'));
  protected readonly resolvedMainMaxWidth = computed(() =>
    krnCssLength(this.mainMaxWidth(), '100%'),
  );

  constructor() {
    const query = this.platform.matchMedia('(max-width: 48rem)');
    this.mobileViewport.set(query?.matches ?? false);
    const onViewportChange = (event: MediaQueryListEvent): void => {
      this.mobileViewport.set(event.matches);
      if (!event.matches) this.mobileNavigationOpen.set(false);
    };
    query?.addEventListener('change', onViewportChange);
    this.destroyRef.onDestroy(() => query?.removeEventListener('change', onViewportChange));

    effect((onCleanup) => {
      if (!this.isMobileNavigationOpen()) {
        return;
      }

      const panel = this.mobilePanel()?.nativeElement;
      if (!panel) return;
      this.coordinator.activate(this.overlayId, panel, this.mobileTrigger()?.nativeElement ?? null);
      this.platform.queueMicrotask(() => this.coordinator.focusInitial(panel, 'first-tabbable'));
      const onKeydown = (event: KeyboardEvent): void => {
        if (
          event.key !== 'Escape' ||
          event.defaultPrevented ||
          !this.coordinator.isTop(this.overlayId)
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.mobileNavigationOpen.set(false);
      };
      this.platform.document.addEventListener('keydown', onKeydown);
      onCleanup(() => {
        this.platform.document.removeEventListener('keydown', onKeydown);
        this.coordinator.deactivate(this.overlayId);
      });
    });

    effect(() => {
      if (this.mobileNavigation() === 'hidden' && this.mobileNavigationOpen()) {
        this.mobileNavigationOpen.set(false);
      }
    });
  }

  protected closeFromBackdrop(event: PointerEvent): void {
    if (event.target === event.currentTarget) {
      this.mobileNavigationOpen.set(false);
    }
  }
}

@Component({
  selector: 'krn-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="krn-header">
      <div class="krn-header__start">
        <ng-content select="[krnHeaderStart]" />
      </div>
      <div class="krn-header__content"><ng-content /></div>
      <div class="krn-header__end">
        <ng-content select="[krnHeaderEnd]" />
      </div>
    </header>
  `,
  host: {
    '[style.--krn-header-height]': 'resolvedHeight()',
    '[attr.data-sticky]': 'sticky() ? "" : null',
    '[attr.data-elevated]': 'elevated() ? "" : null',
  },
  styles: `
    :host {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
      border-start-start-radius: inherit;
      border-start-end-radius: inherit;
    }

    :host([data-sticky]) {
      position: sticky;
      z-index: var(--krn-z-sticky);
      inset-block-start: 0;
    }

    .krn-header {
      display: grid;
      min-block-size: var(--krn-header-height);
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--krn-space-3);
      padding-inline: clamp(var(--krn-space-3), 2.5vi, var(--krn-space-6));
      border-block-end: 1px solid var(--krn-color-border-subtle);
      border-start-start-radius: inherit;
      border-start-end-radius: inherit;
      background: var(--krn-color-surface);
      background: color-mix(in oklch, var(--krn-color-surface) 94%, transparent);
      color: var(--krn-color-text);
      backdrop-filter: blur(12px) saturate(115%);
    }

    :host([data-elevated]) .krn-header {
      border-block-end-color: color-mix(in oklch, var(--krn-color-border) 62%, transparent);
      box-shadow: var(--krn-shadow-sm);
    }

    .krn-header__start,
    .krn-header__end {
      display: flex;
      min-inline-size: 0;
      align-items: center;
      gap: var(--krn-space-2);
    }

    .krn-header__content {
      min-inline-size: 0;
    }

    .krn-header__start:empty,
    .krn-header__end:empty {
      display: none;
    }

    @media (prefers-reduced-transparency: reduce) {
      .krn-header {
        background: var(--krn-color-surface);
        backdrop-filter: none;
      }
    }

    @media (forced-colors: active) {
      .krn-header {
        border-block-end: 1px solid CanvasText;
        background: Canvas;
        backdrop-filter: none;
      }
    }
  `,
})
export class KrnHeader {
  readonly height = input<KrnLayoutSpace>('4rem');
  readonly sticky = input(true, { transform: booleanAttribute });
  readonly elevated = input(false, { transform: booleanAttribute });

  protected readonly resolvedHeight = computed(() => krnCssLength(this.height(), '4rem'));
}

@Component({
  selector: 'krn-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="krn-sidebar"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-hidden]="collapsed() && collapsedMode() === 'hidden' ? 'true' : null"
      [attr.inert]="collapsed() && collapsedMode() === 'hidden' ? '' : null"
    >
      <div class="krn-sidebar__header">
        <ng-content select="[krnSidebarHeader]" />
      </div>
      <div class="krn-sidebar__body"><ng-content /></div>
      <div class="krn-sidebar__footer">
        <ng-content select="[krnSidebarFooter]" />
      </div>
    </aside>
  `,
  host: {
    '[style.--krn-sidebar-width]': 'resolvedWidth()',
    '[style.--krn-sidebar-collapsed-width]': 'resolvedCollapsedWidth()',
    '[attr.data-collapsed]': 'collapsed() ? "" : null',
    '[attr.data-collapse-mode]': 'collapsedMode()',
    '[attr.data-side]': 'side()',
  },
  styles: `
    :host {
      display: block;
      inline-size: var(--krn-sidebar-width);
      min-block-size: 0;
      block-size: 100%;
      transition: inline-size var(--krn-motion-duration-layout) var(--krn-motion-ease-standard);
    }

    :host([data-collapsed]) {
      inline-size: var(--krn-sidebar-collapsed-width);
    }

    :host([data-collapsed]) .krn-sidebar {
      overflow: clip;
    }

    :host([data-collapsed][data-collapse-mode='hidden']) {
      inline-size: 0;
      overflow: clip;
    }

    .krn-sidebar {
      display: grid;
      block-size: 100%;
      min-block-size: 0;
      grid-template-rows: auto minmax(0, 1fr) auto;
      border-inline-end: 1px solid var(--krn-color-border);
      background: var(--krn-color-surface);
      color: var(--krn-color-text);
    }

    :host([data-side='end']) .krn-sidebar {
      border-inline-start: 1px solid var(--krn-color-border);
      border-inline-end: 0;
    }

    .krn-sidebar__header,
    .krn-sidebar__footer {
      padding: var(--krn-space-4);
    }

    .krn-sidebar__body {
      min-block-size: 0;
      overflow: auto;
      overscroll-behavior: contain;
      padding: var(--krn-space-3);
      scrollbar-width: thin;
      scrollbar-color: var(--krn-color-border-strong) transparent;
    }

    .krn-sidebar__header:empty,
    .krn-sidebar__footer:empty {
      display: none;
    }

    :host([data-collapsed][data-collapse-mode='icons'])
      :is(.krn-sidebar__header, .krn-sidebar__body, .krn-sidebar__footer) {
      padding-inline: var(--krn-space-2);
    }

    @media (forced-colors: active) {
      .krn-sidebar {
        border-inline-end-color: CanvasText;
      }
    }
  `,
})
export class KrnSidebar {
  readonly collapsed = model(false);
  readonly collapsedMode = input<'icons' | 'hidden'>('icons');
  readonly width = input<KrnLayoutSpace>('var(--krn-shell-sidebar-width, 17rem)');
  readonly collapsedWidth = input<KrnLayoutSpace>('4rem');
  readonly ariaLabel = input('Secondary navigation');
  readonly side = input<'start' | 'end'>('start');

  protected readonly resolvedWidth = computed(() => krnCssLength(this.width(), '17rem'));
  protected readonly resolvedCollapsedWidth = computed(() =>
    krnCssLength(this.collapsedWidth(), '4rem'),
  );

  toggle(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }
}

@Component({
  selector: 'krn-navigation-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="krn-rail" [attr.aria-label]="ariaLabel()">
      <div class="krn-rail__header">
        <ng-content select="[krnRailHeader]" />
      </div>
      <div class="krn-rail__body"><ng-content /></div>
      <div class="krn-rail__footer">
        <ng-content select="[krnRailFooter]" />
      </div>
    </nav>
  `,
  host: {
    '[style.--krn-rail-width]': 'resolvedWidth()',
    '[style.--krn-rail-expanded-width]': 'resolvedExpandedWidth()',
    '[attr.data-expanded]': 'expanded() ? "" : null',
    '[attr.data-side]': 'side()',
  },
  styles: `
    :host {
      display: block;
      inline-size: var(--krn-rail-width);
      block-size: 100%;
      min-block-size: 0;
      transition: inline-size var(--krn-motion-duration-layout) var(--krn-motion-ease-standard);
    }

    :host([data-expanded]) {
      inline-size: var(--krn-rail-expanded-width);
    }

    .krn-rail {
      display: grid;
      block-size: 100%;
      min-block-size: 0;
      grid-template-rows: auto minmax(0, 1fr) auto;
      border-inline-end: 1px solid var(--krn-color-border);
      background: var(--krn-color-surface);
      color: var(--krn-color-text);
      padding-block: var(--krn-space-1);
      overflow: clip;
    }

    :host([data-side='end']) .krn-rail {
      border-inline-start: 1px solid var(--krn-color-border);
      border-inline-end: 0;
    }

    .krn-rail__header,
    .krn-rail__footer,
    .krn-rail__body {
      display: flex;
      min-inline-size: 0;
      flex-direction: column;
      align-items: center;
      gap: var(--krn-space-1);
      padding-inline: var(--krn-space-1);
    }

    .krn-rail__body {
      min-block-size: 0;
      overflow-y: auto;
      padding-block: var(--krn-space-2);
      scrollbar-width: thin;
    }

    :host([data-expanded]) :is(.krn-rail__header, .krn-rail__footer, .krn-rail__body) {
      align-items: stretch;
      padding-inline: var(--krn-space-2);
    }

    .krn-rail__header:empty,
    .krn-rail__footer:empty {
      display: none;
    }

    @media (forced-colors: active) {
      .krn-rail {
        border-inline-end-color: CanvasText;
      }
    }
  `,
})
export class KrnNavigationRail {
  readonly expanded = model(false);
  readonly width = input<KrnLayoutSpace>('var(--krn-shell-rail-width, 3.5rem)');
  readonly expandedWidth = input<KrnLayoutSpace>('14rem');
  readonly ariaLabel = input('Primary navigation');
  readonly side = input<'start' | 'end'>('start');

  protected readonly resolvedWidth = computed(() => krnCssLength(this.width(), '3.5rem'));
  protected readonly resolvedExpandedWidth = computed(() =>
    krnCssLength(this.expandedWidth(), '14rem'),
  );

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
