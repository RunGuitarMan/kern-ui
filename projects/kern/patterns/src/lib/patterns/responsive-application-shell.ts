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
  templateUrl: './responsive-application-shell.html',
  styleUrl: './responsive-application-shell.css',
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
  readonly navigationLabel = input<typeof this.translations.layout.primaryNavigation | undefined>();
  readonly closeNavigationLabel = input<
    typeof this.translations.layout.closeNavigation | undefined
  >();
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

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
