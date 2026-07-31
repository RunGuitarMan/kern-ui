import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import { KRN_LOADING_LABEL } from '@kern-ui/angular/i18n';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';
import { KRN_ICON_BUTTON_OPTIONS } from './icon-button-options';
import { registerKrnLoadingActivationGuard } from './loading-action';

@Component({
  selector: 'button[krnIconButton]',
  template: `
    <span class="krn-action__icon" aria-hidden="true"><ng-content /></span>
    <span class="krn-action__status" role="status" aria-live="polite">
      {{ loading() ? loadingLabel() : '' }}
    </span>
  `,
  host: {
    class: 'krn-action krn-icon-action',
    type: 'button',
    '[attr.data-loading]': 'loading()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnIconButton {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly options = inject(KRN_ICON_BUTTON_OPTIONS);
  private readonly defaultLoadingLabel = this.options.loadingLabel ?? inject(KRN_LOADING_LABEL);
  private readonly syncLoadingAriaDisabled: () => void;

  readonly size = input<KrnSize>(this.options.size);
  readonly variant = input<KrnActionVariant>(this.options.variant);
  readonly tone = input<KrnTone>(this.options.tone);
  /**
   * Suppresses duplicate activation and owns `aria-disabled` while retaining
   * focus. Use native `disabled` for ordinary unavailability.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible loading copy; defaults to the application or closest scoped option. */
  readonly loadingLabel = input(this.defaultLoadingLabel);

  constructor() {
    this.syncLoadingAriaDisabled = registerKrnLoadingActivationGuard({
      destroyRef: this.destroyRef,
      element: this.elementRef.nativeElement,
      isLoading: this.loading,
      renderer: this.renderer,
    });
  }

  protected ngDoCheck(): void {
    this.syncLoadingAriaDisabled();
  }
}
