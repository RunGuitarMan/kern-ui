import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import { KRN_LOADING_LABEL, krnReadI18nValue } from '@kern-ui/angular/i18n';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';
import { KRN_BUTTON_OPTIONS } from './button-options';
import { KRN_FLOATING_ACTION_BUTTON_OPTIONS } from './floating-action-button-options';
import { registerKrnLoadingActivationGuard } from './loading-action';

@Component({
  selector: 'button[krnButton]',
  template: `
    <span class="krn-action__icon" aria-hidden="true">
      <ng-content select="[krnLeadingIcon]" />
    </span>
    <span class="krn-action__label"><ng-content /></span>
    <span class="krn-action__icon" aria-hidden="true">
      <ng-content select="[krnTrailingIcon]" />
    </span>
    <span class="krn-action__status" role="status" aria-live="polite">
      {{ loading() ? resolvedLoadingLabel() : '' }}
    </span>
  `,
  host: {
    class: 'krn-action',
    type: 'button',
    '[attr.data-loading]': 'loading()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnButton {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly options = inject(KRN_BUTTON_OPTIONS);
  private readonly inheritedLoadingLabel = inject(KRN_LOADING_LABEL);
  private readonly syncLoadingAriaDisabled: () => void;

  readonly size = input<KrnSize>(this.options.size);
  readonly variant = input<KrnActionVariant>(this.options.variant);
  readonly tone = input<KrnTone>(this.options.tone);
  /**
   * Suppresses duplicate activation, owns `aria-disabled`, and updates the
   * persistent polite status. Use native `disabled` for ordinary unavailability.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible loading copy; defaults to the application or closest scoped option. */
  readonly loadingLabel = input<string | undefined>();
  protected readonly resolvedLoadingLabel = computed(
    () =>
      this.loadingLabel() ??
      this.options.loadingLabel ??
      krnReadI18nValue(this.inheritedLoadingLabel),
  );

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

@Component({
  selector: 'button[krnFab]',
  template: `
    <span class="krn-action__icon" aria-hidden="true">
      <ng-content select="[krnFabIcon]" />
    </span>
    <span class="krn-action__label"><ng-content /></span>
    <span class="krn-action__status" role="status" aria-live="polite">
      {{ loading() ? resolvedLoadingLabel() : '' }}
    </span>
  `,
  host: {
    class: 'krn-action krn-fab',
    type: 'button',
    '[attr.data-extended]': 'extended()',
    '[attr.data-loading]': 'loading()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnFloatingActionButton {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly options = inject(KRN_FLOATING_ACTION_BUTTON_OPTIONS);
  private readonly inheritedLoadingLabel = inject(KRN_LOADING_LABEL);
  private readonly syncLoadingAriaDisabled: () => void;

  readonly size = input<KrnSize>(this.options.size);
  readonly variant = input<KrnActionVariant>(this.options.variant);
  readonly tone = input<KrnTone>(this.options.tone);
  readonly extended = input(this.options.extended, { transform: booleanAttribute });
  /**
   * Suppresses duplicate activation and owns `aria-disabled` while retaining
   * focus. Use native `disabled` for ordinary unavailability.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible loading copy; defaults to the application or closest scoped option. */
  readonly loadingLabel = input<string | undefined>();
  protected readonly resolvedLoadingLabel = computed(
    () =>
      this.loadingLabel() ??
      this.options.loadingLabel ??
      krnReadI18nValue(this.inheritedLoadingLabel),
  );

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
