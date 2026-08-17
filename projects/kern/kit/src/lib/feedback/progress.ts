import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import { krnResolvedLocale } from '../reactive-locale';

@Component({
  selector: 'krn-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'safeMax()',
    '[attr.aria-valuenow]': 'indeterminate() ? null : safeValue()',
    '[attr.aria-valuetext]': 'valueText() || null',
    '[attr.data-indeterminate]': 'indeterminate()',
  },
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class KrnProgressBar {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly value = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.feedback.progress,
  );
  readonly valueText = input('');
  protected readonly safeMax = computed(() => Math.max(1, this.max()));
  protected readonly safeValue = computed(() =>
    Math.min(Math.max(0, this.value()), this.safeMax()),
  );
  protected readonly percentage = computed(() =>
    this.indeterminate() ? 35 : (this.safeValue() / this.safeMax()) * 100,
  );
}

@Component({
  selector: 'krn-circular-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'safeMax()',
    '[attr.aria-valuenow]': 'indeterminate() ? null : safeValue()',
    '[attr.aria-valuetext]': 'indeterminate() ? null : formattedPercentage()',
    '[attr.data-indeterminate]': 'indeterminate()',
  },
  templateUrl: './circular-progress.html',
  styleUrl: './circular-progress.css',
})
export class KrnCircularProgress {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly value = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.feedback.progress,
  );
  readonly locale = input<string | string[] | undefined>();
  private readonly resolvedLocale = krnResolvedLocale(this.locale);
  protected readonly safeMax = computed(() => Math.max(1, this.max()));
  protected readonly safeValue = computed(() =>
    Math.min(Math.max(0, this.value()), this.safeMax()),
  );
  protected readonly percentage = computed(() => (this.safeValue() / this.safeMax()) * 100);
  private readonly percentageFormatter = computed(
    () =>
      new Intl.NumberFormat(this.resolvedLocale(), {
        style: 'percent',
        maximumFractionDigits: 0,
      }),
  );
  protected readonly formattedPercentage = computed(() =>
    this.percentageFormatter().format(this.percentage() / 100),
  );
  protected readonly dashArray = computed(
    () => `${this.indeterminate() ? 25 : this.percentage()} 100`,
  );
}

@Component({
  selector: 'krn-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', '[attr.aria-label]': 'resolvedLabel()' },
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
})
export class KrnSpinner {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly label = input<string | undefined>();
  protected readonly resolvedLabel = krnInputFallback(
    this.label,
    () => this.translations.feedback.loading,
  );
}

@Component({
  selector: 'krn-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.inline-size]': 'width()',
    '[style.block-size]': 'height()',
    '[attr.data-shape]': 'shape()',
  },
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
})
export class KrnSkeleton {
  readonly width = input('100%');
  readonly height = input('var(--krn-space-4)');
  readonly shape = input<'text' | 'rectangle' | 'circle'>('text');
}

@Component({
  selector: 'krn-loading-overlay',
  standalone: true,
  imports: [KrnSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-busy]': 'active()',
    '[attr.data-active]': 'active()',
    '[attr.data-blocking]': 'blocking()',
  },
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.css',
})
export class KrnLoadingOverlay {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly active = input(false, { transform: booleanAttribute });
  readonly blocking = input(true, { transform: booleanAttribute });
  readonly label = input<string | undefined>();
  protected readonly resolvedLabel = krnInputFallback(
    this.label,
    () => this.translations.feedback.loadingInProgress,
  );
}
