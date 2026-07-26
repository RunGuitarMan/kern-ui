import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

import type { KrnLayoutSpace} from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="krn-shell">
      <div class="krn-shell__header">
        <ng-content select="krn-header,[krnAppHeader]" />
      </div>
      <div class="krn-shell__rail">
        <ng-content select="krn-navigation-rail,[krnAppRail]" />
      </div>
      <div class="krn-shell__sidebar">
        <ng-content select="krn-sidebar,[krnAppSidebar]" />
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
  },
  styles: `
    :host {
      display: block;
      min-block-size: 100dvb;
      min-inline-size: 0;
      background: var(--krn-color-canvas);
      color: var(--krn-color-text);
    }

    .krn-shell {
      display: grid;
      min-block-size: inherit;
      grid-template:
        'header header header' auto
        'rail sidebar main' minmax(0, 1fr) /
        auto auto minmax(0, 1fr);
    }

    .krn-shell__header {
      z-index: var(--krn-z-sticky);
      grid-area: header;
      min-inline-size: 0;
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

      .krn-shell__rail,
      .krn-shell__sidebar {
        display: none;
      }

      :host([data-mobile-navigation='sidebar']) .krn-shell__sidebar,
      :host([data-mobile-navigation='rail']) .krn-shell__rail {
        display: block;
        position: fixed;
        z-index: var(--krn-z-overlay);
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: min(84vi, var(--krn-shell-sidebar-width));
        box-shadow: var(--krn-shadow-overlay);
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
  readonly sidebarWidth = input<KrnLayoutSpace>('17rem');
  readonly railWidth = input<KrnLayoutSpace>('4.25rem');
  readonly mainMaxWidth = input<KrnLayoutSpace>('100%');
  readonly sidebarPosition = input<'start' | 'end'>('start');
  readonly mobileNavigation = input<'hidden' | 'sidebar' | 'rail'>('hidden');
  readonly mainId = input('main-content');

  protected readonly resolvedSidebarWidth = computed(() =>
    krnCssLength(this.sidebarWidth(), '17rem'),
  );
  protected readonly resolvedRailWidth = computed(() => krnCssLength(this.railWidth(), '4.25rem'));
  protected readonly resolvedMainMaxWidth = computed(() =>
    krnCssLength(this.mainMaxWidth(), '100%'),
  );
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
      border-block-end: 1px solid var(--krn-color-border);
      background: var(--krn-color-surface);
      background: color-mix(in oklch, var(--krn-color-surface) 94%, transparent);
      color: var(--krn-color-text);
      backdrop-filter: blur(12px) saturate(115%);
    }

    :host([data-elevated]) .krn-header {
      border-block-end-color: transparent;
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
      transition: inline-size var(--krn-motion-duration-slow) var(--krn-motion-ease-standard);
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
      transition: inline-size var(--krn-motion-duration-slow) var(--krn-motion-ease-standard);
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
      background: var(--krn-color-surface-sunken);
      color: var(--krn-color-text);
      padding-block: var(--krn-space-2);
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
      align-items: stretch;
      gap: var(--krn-space-1);
      padding-inline: var(--krn-space-2);
    }

    .krn-rail__body {
      min-block-size: 0;
      overflow-y: auto;
      padding-block: var(--krn-space-3);
      scrollbar-width: thin;
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
  readonly width = input<KrnLayoutSpace>('var(--krn-shell-rail-width, 4.25rem)');
  readonly expandedWidth = input<KrnLayoutSpace>('14rem');
  readonly ariaLabel = input('Primary navigation');
  readonly side = input<'start' | 'end'>('start');

  protected readonly resolvedWidth = computed(() => krnCssLength(this.width(), '4.25rem'));
  protected readonly resolvedExpandedWidth = computed(() =>
    krnCssLength(this.expandedWidth(), '14rem'),
  );

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
