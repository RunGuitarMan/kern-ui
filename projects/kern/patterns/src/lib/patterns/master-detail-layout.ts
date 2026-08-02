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
  template: `
    <div class="layout">
      <aside #masterPane class="master" tabindex="-1" [attr.aria-label]="resolvedMasterLabel()">
        <ng-content select="[krnMaster]" />
      </aside>
      <section #detailPane class="detail" tabindex="-1" [attr.aria-label]="resolvedDetailLabel()">
        <ng-content select="[krnDetail]" />
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }
    :host([hidden]) {
      display: none;
    }
    .layout {
      display: grid;
      min-block-size: 20rem;
      grid-template-columns: minmax(15rem, 0.38fr) minmax(0, 1fr);
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface, #fff);
    }
    .master {
      min-inline-size: 0;
      overflow: auto;
      border-inline-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    .detail {
      min-inline-size: 0;
      overflow: auto;
    }
    @container (max-width: 42rem) {
      .layout {
        grid-template-columns: 1fr;
      }
      :host([data-detail-open]) .master {
        display: none;
      }
      :host(:not([data-detail-open])) .detail {
        display: none;
      }
      .master {
        border-inline-end: 0;
      }
    }
    @media (forced-colors: active) {
      .layout,
      .master {
        border-color: CanvasText;
      }
    }
  `,
})
export class KrnMasterDetailLayout {
  private readonly injector = inject(Injector);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly masterPane = viewChild<ElementRef<HTMLElement>>('masterPane');
  private readonly detailPane = viewChild<ElementRef<HTMLElement>>('detailPane');
  readonly masterLabel = input(this.translations.patterns.masterList);
  readonly detailLabel = input(this.translations.patterns.detail);
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

  private requiredLabel(value: string, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
