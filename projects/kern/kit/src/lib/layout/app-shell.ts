import { CdkTrapFocus } from '@angular/cdk/a11y';
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

import {
  KRN_PLATFORM,
  KrnIdService,
  KrnOverlayCoordinator,
  krnIsHtmlElement,
  type KrnOverlayInitialFocus,
} from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type { KrnLayoutSpace } from './layout.types';
import { krnCssLength } from './layout.types';

@Component({
  selector: 'krn-app-shell',
  standalone: true,
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.html',
  host: {
    '[style.--krn-shell-sidebar-width]': 'resolvedSidebarWidth()',
    '[style.--krn-shell-rail-width]': 'resolvedRailWidth()',
    '[style.--krn-shell-main-max]': 'resolvedMainMaxWidth()',
    '[attr.data-sidebar-position]': 'sidebarPosition()',
    '[attr.data-mobile-navigation]': 'mobileNavigation()',
    '[attr.data-mobile-navigation-open]': 'isMobileNavigationOpen() ? "" : null',
  },
  styleUrl: './app-shell.css',
})
export class KrnAppShell {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly coordinator = inject(KrnOverlayCoordinator);
  private readonly ids = inject(KrnIdService);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mobilePanel = viewChild<ElementRef<HTMLElement>>('mobilePanel');
  private readonly mobileTrigger = viewChild<ElementRef<HTMLButtonElement>>('mobileTrigger');
  private readonly mainElement = viewChild<ElementRef<HTMLElement>>('mainElement');
  private readonly mobileViewport = signal(false);
  private readonly responsiveViewportKnown = signal(false);
  private readonly overlayId = this.ids.next('mobile-navigation-overlay');
  readonly sidebarWidth = input<KrnLayoutSpace>('17rem');
  readonly railWidth = input<KrnLayoutSpace>('3.5rem');
  readonly mainMaxWidth = input<KrnLayoutSpace>('100%');
  readonly sidebarPosition = input<'start' | 'end'>('start');
  readonly mobileNavigation = input<'auto' | 'hidden' | 'sidebar' | 'rail'>('auto');
  readonly mobileNavigationOpen = model(false);
  readonly mobileNavigationId = input(this.ids.next('mobile-navigation'));
  readonly mobileNavigationLabel = input<string | undefined>();
  protected readonly resolvedMobileNavigationLabel = krnInputFallback(
    this.mobileNavigationLabel,
    () => this.translations.layout.mobileNavigation,
  );
  /** Space-separated element ids that name the mobile navigation dialog. */
  readonly mobileNavigationLabelledBy = input('');
  /** Space-separated element ids that describe the mobile navigation dialog. */
  readonly mobileNavigationDescribedBy = input('');
  /** Focus target applied after the mobile navigation dialog opens. */
  readonly mobileNavigationInitialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  readonly openNavigationLabel = input<string | undefined>();
  protected readonly resolvedOpenNavigationLabel = krnInputFallback(
    this.openNavigationLabel,
    () => this.translations.layout.openNavigation,
  );
  readonly closeNavigationLabel = input<string | undefined>();
  protected readonly resolvedCloseNavigationLabel = krnInputFallback(
    this.closeNavigationLabel,
    () => this.translations.layout.closeNavigation,
  );
  readonly mainId = input('main-content');
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
    if (query) {
      this.mobileViewport.set(query.matches);
      this.responsiveViewportKnown.set(true);
    }
    const onViewportChange = (event: MediaQueryListEvent): void => {
      this.mobileViewport.set(event.matches);
      if (!event.matches) this.closeMobileNavigation();
    };
    query?.addEventListener('change', onViewportChange);
    this.destroyRef.onDestroy(() => query?.removeEventListener('change', onViewportChange));

    effect((onCleanup) => {
      if (!this.isMobileNavigationOpen()) {
        return;
      }

      const panel = this.mobilePanel()?.nativeElement;
      if (!panel) return;
      const activeElement = this.platform.document.activeElement;
      const restoreFocus =
        krnIsHtmlElement(this.platform, activeElement) &&
        activeElement.isConnected &&
        activeElement !== this.platform.document.body &&
        activeElement !== this.platform.document.documentElement
          ? null
          : (this.mobileTrigger()?.nativeElement ?? null);
      this.coordinator.activate(this.overlayId, panel, restoreFocus, () =>
        this.closeMobileNavigation(),
      );
      this.platform.queueMicrotask(() =>
        this.coordinator.focusInitial(panel, this.mobileNavigationInitialFocus()),
      );
      onCleanup(() => {
        this.coordinator.deactivate(this.overlayId);
      });
    });

    effect(() => {
      if (
        this.mobileNavigationOpen() &&
        (this.mobileNavigation() === 'hidden' ||
          (this.responsiveViewportKnown() && !this.mobileViewport()))
      ) {
        this.closeMobileNavigation();
      }
    });
  }

  protected closeFromBackdrop(event: PointerEvent): void {
    if (event.target === event.currentTarget) {
      this.closeMobileNavigation();
    }
  }

  openMobileNavigation(): void {
    if (this.mobileViewport() && this.mobileNavigation() !== 'hidden') {
      this.mobileNavigationOpen.set(true);
    }
  }

  closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  toggleMobileNavigation(): void {
    if (this.isMobileNavigationOpen()) {
      this.closeMobileNavigation();
    } else {
      this.openMobileNavigation();
    }
  }

  focusMain(options?: FocusOptions): void {
    this.mainElement()?.nativeElement.focus(options);
  }
}

@Component({
  selector: 'krn-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  host: {
    '[style.--krn-header-height]': 'resolvedHeight()',
    '[style.--krn-header-sticky-offset]': 'resolvedStickyOffset()',
    '[attr.data-sticky]': 'sticky() ? "" : null',
    '[attr.data-elevated]': 'elevated() ? "" : null',
  },
  styleUrl: './header.css',
})
export class KrnHeader {
  readonly height = input<KrnLayoutSpace>('4rem');
  /** Logical inset between a sticky header and its scrolling boundary. */
  readonly stickyOffset = input<KrnLayoutSpace>(0);
  readonly sticky = input(true, { transform: booleanAttribute });
  readonly elevated = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  /** Space-separated element ids that name the native header landmark. */
  readonly ariaLabelledBy = input('');

  protected readonly resolvedHeight = computed(() => krnCssLength(this.height(), '4rem'));
  protected readonly resolvedStickyOffset = computed(() => krnCssLength(this.stickyOffset()));
}

@Component({
  selector: 'krn-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  host: {
    '[style.--krn-sidebar-width]': 'resolvedWidth()',
    '[style.--krn-sidebar-collapsed-width]': 'resolvedCollapsedWidth()',
    '[attr.data-collapsed]': 'collapsed() ? "" : null',
    '[attr.data-collapse-mode]': 'collapsedMode()',
    '[attr.data-side]': 'side()',
  },
  styleUrl: './sidebar.css',
})
export class KrnSidebar {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly collapsed = model(false);
  readonly collapsedMode = input<'icons' | 'hidden'>('icons');
  readonly width = input<KrnLayoutSpace>('var(--krn-shell-sidebar-width, 17rem)');
  readonly collapsedWidth = input<KrnLayoutSpace>('4rem');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.layout.secondaryNavigation,
  );
  /** Space-separated element ids that name the native complementary landmark. */
  readonly ariaLabelledBy = input('');
  /** Space-separated element ids that describe the native complementary landmark. */
  readonly ariaDescribedBy = input('');
  readonly side = input<'auto' | 'start' | 'end'>('auto');

  protected readonly isHidden = computed(
    () => this.collapsed() && this.collapsedMode() === 'hidden',
  );
  protected readonly resolvedWidth = computed(() => krnCssLength(this.width(), '17rem'));
  protected readonly resolvedCollapsedWidth = computed(() =>
    krnCssLength(this.collapsedWidth(), '4rem'),
  );

  expand(): void {
    this.collapsed.set(false);
  }

  collapse(): void {
    this.collapsed.set(true);
  }

  toggle(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }
}

@Component({
  selector: 'krn-navigation-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navigation-rail.html',
  host: {
    '[style.--krn-rail-width]': 'resolvedWidth()',
    '[style.--krn-rail-expanded-width]': 'resolvedExpandedWidth()',
    '[attr.data-expanded]': 'expanded() ? "" : null',
    '[attr.data-side]': 'side()',
  },
  styleUrl: './navigation-rail.css',
})
export class KrnNavigationRail {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly expanded = model(false);
  readonly width = input<KrnLayoutSpace>('var(--krn-shell-rail-width, 3.5rem)');
  readonly expandedWidth = input<KrnLayoutSpace>('14rem');
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.layout.primaryNavigation,
  );
  /** Space-separated element ids that name the native navigation landmark. */
  readonly ariaLabelledBy = input('');
  /** Space-separated element ids that describe the native navigation landmark. */
  readonly ariaDescribedBy = input('');
  readonly side = input<'auto' | 'start' | 'end'>('auto');

  protected readonly resolvedWidth = computed(() => krnCssLength(this.width(), '3.5rem'));
  protected readonly resolvedExpandedWidth = computed(() =>
    krnCssLength(this.expandedWidth(), '14rem'),
  );

  expand(): void {
    this.expanded.set(true);
  }

  collapse(): void {
    this.expanded.set(false);
  }

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
