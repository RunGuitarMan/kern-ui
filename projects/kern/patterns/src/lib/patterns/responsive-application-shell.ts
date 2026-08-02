import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { KRN_PLATFORM, KrnIdService, KrnOverlayCoordinator } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-responsive-application-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkTrapFocus],
  host: {
    '[attr.data-navigation-open]': 'isMobileNavigationOpen() ? "" : null',
  },
  template: `
    <header><ng-content select="[krnAppHeader]" /></header>
    <div #navigationOverlay class="navigation-overlay" (pointerdown)="closeFromBackdrop($event)">
      <aside
        #navigationPane
        [id]="navigationId"
        [attr.role]="isMobileNavigationOpen() ? 'dialog' : null"
        [attr.aria-modal]="isMobileNavigationOpen() ? 'true' : null"
        [attr.aria-label]="resolvedNavigationLabel()"
        [attr.tabindex]="isMobileNavigationOpen() ? -1 : null"
        [cdkTrapFocus]="isMobileNavigationOpen()"
        [cdkTrapFocusAutoCapture]="false"
        (pointerdown)="$event.stopPropagation()"
      >
        <button
          type="button"
          class="navigation-close"
          [attr.aria-label]="resolvedCloseNavigationLabel()"
          (click)="closeNavigation()"
        >
          <span aria-hidden="true">×</span>
        </button>
        <ng-content select="[krnAppNavigation]" />
      </aside>
    </div>
    <main [id]="resolvedMainId()" tabindex="-1"><ng-content /></main>
    <footer><ng-content select="[krnAppMobileNavigation]" /></footer>
  `,
  styles: `
    :host {
      position: relative;
      display: grid;
      min-block-size: 100dvb;
      min-inline-size: 0;
      grid-template: auto minmax(0, 1fr) / auto minmax(0, 1fr);
      overflow: clip;
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-canvas, #faf9f7);
    }
    :host([hidden]) {
      display: none;
    }
    header {
      z-index: var(--krn-z-sticky, 300);
      grid-column: 1 / -1;
      min-inline-size: 0;
    }
    .navigation-overlay {
      display: contents;
    }
    aside {
      position: relative;
      min-inline-size: var(--krn-app-sidebar-width, 15rem);
      overflow: auto;
      border-inline-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      background: var(--krn-color-surface, #fff);
    }
    .navigation-close {
      display: none;
      inline-size: var(--krn-touch-target-min, 2.75rem);
      block-size: var(--krn-touch-target-min, 2.75rem);
      margin: var(--krn-space-2, 0.5rem);
      margin-inline-start: auto;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
      font: inherit;
      font-size: 1.25rem;
      cursor: pointer;
    }
    .navigation-close:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    main {
      min-inline-size: 0;
      min-block-size: 0;
      overflow: auto;
      outline: none;
    }
    footer {
      display: none;
    }
    @media (max-width: 48rem) {
      :host {
        grid-template: auto minmax(0, 1fr) auto / minmax(0, 1fr);
      }
      .navigation-overlay {
        position: fixed;
        z-index: var(--krn-z-drawer, 700);
        inset: 0;
        display: block;
        visibility: hidden;
        pointer-events: none;
        background: var(--krn-color-backdrop, rgb(10 13 20 / 0.48));
      }
      aside {
        position: absolute;
        z-index: 1;
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: min(20rem, 88vi);
        min-inline-size: 0;
        translate: -102% 0;
        transition: translate var(--krn-motion-duration-enter)
          var(--krn-ease-enter, cubic-bezier(0.16, 1, 0.3, 1));
      }
      :host-context([dir='rtl']) aside {
        translate: 102% 0;
      }
      :host([data-navigation-open]) .navigation-overlay {
        visibility: visible;
        pointer-events: auto;
      }
      :host([data-navigation-open]) aside {
        translate: 0;
      }
      .navigation-close {
        display: grid;
        place-items: center;
      }
      main {
        grid-row: 2;
      }
      footer {
        display: block;
        grid-row: 3;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) aside {
        transition: none;
      }
    }
    :host-context(html[data-krn-motion='reduce']) aside {
      transition: none;
    }
    @media (forced-colors: active) {
      aside,
      .navigation-close {
        border-color: CanvasText;
      }
      .navigation-overlay {
        background: Canvas;
      }
    }
  `,
})
export class KrnResponsiveApplicationShell {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly coordinator = inject(KrnOverlayCoordinator);
  private readonly ids = inject(KrnIdService);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly destroyRef = inject(DestroyRef);
  private readonly navigationOverlay = viewChild<ElementRef<HTMLElement>>('navigationOverlay');
  private readonly navigationPane = viewChild<ElementRef<HTMLElement>>('navigationPane');
  private readonly mobileViewport = signal(false);
  private readonly responsiveViewportKnown = signal(false);
  protected readonly navigationId = this.ids.next('responsive-navigation');
  private readonly overlayId = this.ids.next('responsive-navigation-overlay');
  readonly navigationOpen = model(false);
  readonly mainId = input(this.ids.next('main-content'));
  readonly navigationLabel = input(this.translations.layout.primaryNavigation);
  readonly closeNavigationLabel = input(this.translations.layout.closeNavigation);
  protected readonly resolvedMainId = computed(() => {
    const id = typeof this.mainId() === 'string' ? this.mainId() : '';
    if (!id || /\s/u.test(id)) {
      throw new Error(
        'KrnResponsiveApplicationShell: mainId must be a non-empty non-whitespace DOM id token.',
      );
    }

    return id;
  });
  protected readonly resolvedNavigationLabel = computed(() =>
    this.requiredLabel(
      this.navigationLabel(),
      this.translations.layout.primaryNavigation,
      'Primary navigation',
    ),
  );
  protected readonly resolvedCloseNavigationLabel = computed(() =>
    this.requiredLabel(
      this.closeNavigationLabel(),
      this.translations.layout.closeNavigation,
      'Close navigation',
    ),
  );
  protected readonly isMobileNavigationOpen = computed(
    () => this.mobileViewport() && this.navigationOpen(),
  );

  constructor() {
    const query = this.platform.matchMedia('(max-width: 48rem)');
    if (query) {
      this.mobileViewport.set(query.matches);
      this.responsiveViewportKnown.set(true);
    }
    const onViewportChange = (event: MediaQueryListEvent): void => {
      this.mobileViewport.set(event.matches);
      if (!event.matches) {
        this.navigationOpen.set(false);
      }
    };
    query?.addEventListener('change', onViewportChange);
    this.destroyRef.onDestroy(() => query?.removeEventListener('change', onViewportChange));

    effect((onCleanup) => {
      if (!this.isMobileNavigationOpen()) {
        return;
      }

      const panel = this.navigationPane()?.nativeElement;
      const overlay = this.navigationOverlay()?.nativeElement;
      if (!panel || !overlay) {
        return;
      }
      this.coordinator.activate(this.overlayId, overlay, null, () => this.closeNavigation());
      this.platform.queueMicrotask(() => {
        if (
          this.isMobileNavigationOpen() &&
          this.coordinator.isTop(this.overlayId) &&
          panel.isConnected &&
          overlay.isConnected
        ) {
          this.coordinator.focusInitial(panel, 'first-tabbable');
        }
      });
      onCleanup(() => {
        this.coordinator.deactivate(this.overlayId);
      });
    });

    effect(() => {
      if (this.navigationOpen() && this.responsiveViewportKnown() && !this.mobileViewport()) {
        this.navigationOpen.set(false);
      }
    });
  }

  protected closeNavigation(): void {
    this.navigationOpen.set(false);
  }

  protected closeFromBackdrop(event: PointerEvent): void {
    if (event.target === event.currentTarget) {
      this.closeNavigation();
    }
  }

  private requiredLabel(value: string, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
