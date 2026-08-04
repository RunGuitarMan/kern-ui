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
  template: `<span class="track"
    ><span class="indicator" [style.inline-size.%]="percentage()"></span
  ></span>`,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }
    .track {
      display: block;
      block-size: 0.5rem;
      overflow: hidden;
      border: var(--krn-border-width-1) solid
        color-mix(in oklch, var(--krn-color-border) 72%, transparent);
      border-radius: var(--krn-radius-full);
      background: var(--krn-color-surface-sunken);
    }
    .indicator {
      display: block;
      block-size: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        color-mix(in oklch, var(--krn-color-primary) 82%, white),
        var(--krn-color-primary)
      );
      box-shadow: 0 0 0.75rem color-mix(in oklch, var(--krn-color-primary) 22%, transparent);
      transition: inline-size var(--krn-motion-duration-layout) var(--krn-motion-ease-enter);
    }
    :host([data-indeterminate='true']) .indicator {
      inline-size: 35% !important;
      animation: krn-progress-indeterminate var(--krn-motion-duration-progress)
        var(--krn-motion-ease-standard) var(--krn-motion-iteration-continuous);
    }
    @keyframes krn-progress-indeterminate {
      from {
        transform: translateX(-110%);
      }
      to {
        transform: translateX(300%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .indicator {
        transition: none;
      }
      :host-context(html:not([data-krn-motion='full'])):host([data-indeterminate='true'])
        .indicator {
        inline-size: 100% !important;
        animation: none;
        opacity: var(--krn-opacity-muted);
      }
    }
  `,
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
  template: `
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle class="track" cx="18" cy="18" r="15.5" pathLength="100" />
      <circle
        class="indicator"
        cx="18"
        cy="18"
        r="15.5"
        pathLength="100"
        [attr.stroke-dasharray]="dashArray()"
      />
    </svg>
    @if (showValue() && !indeterminate()) {
      <span>{{ formattedPercentage() }}</span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      inline-size: var(--krn-space-12);
      aspect-ratio: 1;
      place-items: center;
      color: var(--krn-color-text);
      font-size: var(--krn-font-size-xs);
      font-weight: var(--krn-font-weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    svg {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      transform: rotate(-90deg);
    }
    circle {
      fill: none;
      stroke-width: var(--krn-border-width-2);
    }
    .track {
      stroke: var(--krn-color-surface-sunken);
    }
    .indicator {
      stroke: var(--krn-color-primary);
      stroke-linecap: round;
      filter: drop-shadow(
        0 0 0.2rem color-mix(in oklch, var(--krn-color-primary) 26%, transparent)
      );
      transition: stroke-dasharray var(--krn-motion-duration-layout) var(--krn-motion-ease-enter);
    }
    :host([data-indeterminate='true']) svg {
      animation: krn-circular-spin var(--krn-motion-duration-spinner) linear
        var(--krn-motion-iteration-continuous);
    }
    :host([data-indeterminate='true']) .indicator {
      stroke-dasharray: 25 100;
    }
    @keyframes krn-circular-spin {
      to {
        transform: rotate(270deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) svg,
      :host-context(html:not([data-krn-motion='full'])) .indicator {
        animation: none !important;
        transition: none;
      }
    }
  `,
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
  template: `<span class="spinner" aria-hidden="true"></span>`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
    }
    .spinner {
      inline-size: var(--krn-icon-size-md);
      block-size: var(--krn-icon-size-md);
      border: calc(var(--krn-border-width-1) * 2) solid
        color-mix(in oklch, var(--krn-color-primary) 18%, var(--krn-color-border));
      border-block-start-color: var(--krn-color-primary);
      border-radius: var(--krn-radius-full);
      animation: krn-spinner var(--krn-motion-duration-spinner) linear
        var(--krn-motion-iteration-continuous);
    }
    @keyframes krn-spinner {
      to {
        transform: rotate(1turn);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .spinner {
        border-color: var(--krn-color-primary);
        animation: none;
      }
    }
  `,
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
  template: ``,
  styles: `
    :host {
      display: block;
      min-block-size: var(--krn-space-4);
      overflow: hidden;
      border-radius: var(--krn-radius-sm);
      background: var(--krn-color-surface-sunken);
    }
    :host([data-shape='circle']) {
      aspect-ratio: 1;
      border-radius: var(--krn-radius-full);
    }
    :host::after {
      display: block;
      inline-size: 46%;
      block-size: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        color-mix(in oklch, var(--krn-color-surface-raised) 72%, transparent),
        transparent
      );
      content: '';
      animation: krn-skeleton var(--krn-motion-duration-skeleton) var(--krn-motion-ease-standard)
        var(--krn-motion-iteration-continuous);
    }
    @keyframes krn-skeleton {
      from {
        transform: translateX(-110%);
      }
      to {
        transform: translateX(325%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full']))::after {
        display: none;
      }
    }
  `,
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
  template: `
    <div
      class="loading-content"
      [attr.aria-hidden]="active() && blocking() ? 'true' : null"
      [attr.inert]="active() && blocking() ? '' : null"
    >
      <ng-content />
    </div>
    @if (active()) {
      <div
        class="loading-surface"
        [attr.role]="blocking() ? 'alert' : 'status'"
        [attr.aria-live]="'polite'"
      >
        <span class="loading-panel">
          <krn-spinner [label]="resolvedLabel()" />
          <span>{{ resolvedLabel() }}</span>
        </span>
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      overflow: clip;
      border-radius: inherit;
    }
    .loading-content {
      min-inline-size: 0;
    }
    :host([data-active='true'][data-blocking='true']) .loading-content {
      user-select: none;
    }
    .loading-surface {
      position: absolute;
      z-index: var(--krn-z-overlay);
      inset: 0;
      display: grid;
      min-block-size: var(--krn-control-height-lg);
      padding: var(--krn-space-4);
      place-items: center;
      background: color-mix(in oklch, var(--krn-color-surface) 78%, transparent);
      color: var(--krn-color-text);
      backdrop-filter: blur(3px);
    }
    .loading-panel {
      display: inline-flex;
      max-inline-size: min(100%, 28rem);
      align-items: center;
      justify-content: center;
      gap: var(--krn-space-3);
      padding: var(--krn-space-2) var(--krn-space-3);
      border: var(--krn-border-width-1) solid var(--krn-color-border);
      border-radius: var(--krn-radius-full);
      box-shadow: var(--krn-shadow-md);
      background: color-mix(in oklch, var(--krn-color-surface-raised) 94%, transparent);
      font-size: var(--krn-font-size-sm);
      font-weight: var(--krn-font-weight-medium);
      text-align: center;
    }
    :host([data-blocking='false']) .loading-surface {
      pointer-events: none;
    }
    @media (forced-colors: active) {
      .loading-surface,
      .loading-panel {
        background: Canvas;
        backdrop-filter: none;
      }
      .loading-panel {
        border-color: CanvasText;
      }
    }
  `,
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
