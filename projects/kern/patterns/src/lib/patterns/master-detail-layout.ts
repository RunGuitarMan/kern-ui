import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  effect,
  inject,
  Injector,
  input,
  model,
  viewChild,
} from '@angular/core';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-master-detail-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-detail-open]': 'detailOpen() ? "" : null',
  },
  templateUrl: './master-detail-layout.html',
  styleUrl: './master-detail-layout.css',
})
export class KrnMasterDetailLayout {
  private readonly injector = inject(Injector);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly masterPane = viewChild<ElementRef<HTMLElement>>('masterPane');
  private readonly detailPane = viewChild<ElementRef<HTMLElement>>('detailPane');
  readonly masterLabel = input<typeof this.translations.patterns.masterList | undefined>();
  readonly detailLabel = input<typeof this.translations.patterns.detail | undefined>();
  readonly detailOpen = model(false);
  protected readonly resolvedMasterLabel = computed(() =>
    this.requiredLabel(this.masterLabel(), this.translations.patterns.masterList, 'Master list'),
  );
  protected readonly resolvedDetailLabel = computed(() =>
    this.requiredLabel(this.detailLabel(), this.translations.patterns.detail, 'Detail'),
  );
  private readonly focusHandoff = effect(() => {
    const detailOpen = this.detailOpen();
    const master = this.masterPane()?.nativeElement;
    const detail = this.detailPane()?.nativeElement;
    if (!master || !detail || !this.platform.isBrowser) {
      return;
    }

    const hiddenPane = detailOpen ? master : detail;
    const visiblePane = detailOpen ? detail : master;
    const activeElement = this.platform.document.activeElement;
    if (!activeElement || !hiddenPane.contains(activeElement)) {
      return;
    }

    afterNextRender(
      {
        write: () => {
          const currentActiveElement = this.platform.document.activeElement;
          if (
            this.detailOpen() === detailOpen &&
            visiblePane.isConnected &&
            (currentActiveElement === activeElement ||
              currentActiveElement === this.platform.document.body) &&
            this.platform.window?.getComputedStyle(hiddenPane).display === 'none'
          ) {
            visiblePane.focus({ preventScroll: true });
          }
        },
      },
      { injector: this.injector },
    );
  });

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
