import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { KRN_PLATFORM, KrnIdService, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import {
  KRN_ENGLISH_TRANSLATIONS,
  KRN_LOCALE,
  KRN_TRANSLATIONS,
  krnFormatTranslation,
} from '@kern-ui/angular/core';
import { krnReadI18nValue } from '@kern-ui/angular/i18n';

export interface KrnChartDatum {
  /** Stable identity used to preserve keyboard focus across immutable updates. */
  readonly id?: string | number;
  readonly label: string;
  readonly value: number;
  readonly description?: string;
}

export type KrnChartType = 'line' | 'bar' | 'donut';
export type KrnChartDatumKey = string | number;
export type KrnChartDatumIdentity = (datum: KrnChartDatum, index: number) => KrnChartDatumKey;
export type KrnChartNegativeValuePolicy = 'clamp' | 'reject';

export interface KrnChartLabels {
  readonly empty?: string;
  readonly viewData: string;
  readonly hideData: string;
  readonly total: string;
  readonly sourceData: string;
  readonly labelColumn: string;
  readonly valueColumn: string;
  readonly shareColumn: string;
  readonly legend: string;
  /** Backward-compatible template containing the `{value}` token. */
  readonly percentOfTotal: string;
  readonly formatPercentOfTotal?: (value: string) => string;
  readonly additionalItems?: (count: number) => string;
  readonly datumLabel: (label: string, value: string) => string;
  readonly datumShareLabel: (label: string, value: string, share: string) => string;
  readonly sourceDataCaption: (title: string, sourceData: string) => string;
  readonly summary: (title: string, items: readonly string[]) => string;
}

interface KrnResolvedChartLabels extends KrnChartLabels {
  readonly empty: string;
  readonly additionalItems: (count: number) => string;
}

export type KrnChartValueFormatter = (value: number) => string;

interface KrnNormalizedDatum extends KrnChartDatum {
  readonly key: KrnChartDatumKey;
}

interface KrnLinePoint extends KrnNormalizedDatum {
  readonly x: number;
  readonly y: number;
}

interface KrnDonutSegment extends KrnNormalizedDatum {
  readonly percent: number;
  readonly dashPercent: number;
  readonly offset: number;
  readonly targetX: number;
  readonly targetY: number;
}

interface KrnTooltipPosition {
  readonly x: number;
  readonly y: number;
}

@Component({
  selector: 'krn-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'resolvedType()',
  },
  templateUrl: './chart.html',
  styleUrl: './chart.css',
})
export class KrnChart {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly inheritedLocale = inject(KRN_LOCALE);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly tableId = inject(KrnIdService).next('chart-data');
  private hideTimer:
    { readonly handle: KrnScheduledHandle; readonly key: KrnChartDatumKey } | undefined;

  protected readonly Math = Math;
  protected readonly gridLines = [36, 105, 174, 244];
  protected readonly toggle = (value: boolean): boolean => !value;

  readonly type = input<KrnChartType>('line');
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  /** Returns a stable unique key used to preserve DOM and active state across data reordering. */
  readonly datumIdentity = input<KrnChartDatumIdentity>(
    (datum, index) => datum.id ?? (datum.label || index),
  );
  /** Clamps negative values to zero by default or rejects them with a validation error. */
  readonly negativeValuePolicy = input<KrnChartNegativeValuePolicy>('clamp');
  /** Limits the accessible text summary while the full data table remains available. */
  readonly summaryItemLimit = input(12);
  readonly locale = input<string | string[] | undefined>();
  private readonly resolvedLocale = computed(
    () => this.locale() ?? krnReadI18nValue(this.inheritedLocale),
  );
  readonly labels = input<Partial<KrnChartLabels>>({});
  readonly valueFormatter = input<KrnChartValueFormatter | null>(null);
  readonly percentFormatter = input<KrnChartValueFormatter | null>(null);
  readonly tableVisible = model(false);
  readonly activeIndex = model<number | null>(null);
  private readonly activeKey = signal<KrnChartDatumKey | null>(null);
  private readonly hoveredKey = signal<KrnChartDatumKey | null>(null);
  private readonly focusedKey = signal<KrnChartDatumKey | null>(null);
  private previousValidatedData: readonly KrnNormalizedDatum[] | null = null;
  private previousActiveIndex: number | null = null;

  readonly palette = input<readonly string[]>([
    'var(--krn-chart-1, #4f6feb)',
    'var(--krn-chart-3, #5087c8)',
    'var(--krn-chart-2, #3d8a77)',
    'var(--krn-chart-5, #8a63a8)',
    'var(--krn-chart-4, #b58633)',
  ]);

  protected readonly resolvedType = computed<KrnChartType>(() => {
    const type = this.type();
    if (type !== 'line' && type !== 'bar' && type !== 'donut') {
      throw new Error(
        `KrnChart type must be "line", "bar", or "donut"; received "${String(type)}".`,
      );
    }
    return type;
  });
  protected readonly resolvedTitle = computed(() => {
    const inputTitle = this.title();
    const title = typeof inputTitle === 'string' ? inputTitle.trim() : '';
    if (!title) throw new Error('KrnChart requires a non-empty title.');
    return title;
  });
  private readonly resolvedPalette = computed(() => {
    const colors = this.palette().filter(
      (color): color is string => typeof color === 'string' && color.trim().length > 0,
    );
    return colors.length ? colors : ['var(--krn-chart-1, #4f6feb)'];
  });

  protected readonly resolvedLabels = computed<KrnResolvedChartLabels>(() => {
    const overrides = this.labels();
    return {
      ...this.translations.chart,
      ...overrides,
      empty:
        overrides.empty ??
        this.translations.chart.empty ??
        KRN_ENGLISH_TRANSLATIONS.chart.empty ??
        'No chart data',
      additionalItems:
        overrides.additionalItems ??
        this.translations.chart.additionalItems ??
        KRN_ENGLISH_TRANSLATIONS.chart.additionalItems ??
        ((count: number) => `${count} more data points`),
      formatPercentOfTotal:
        overrides.formatPercentOfTotal ??
        (overrides.percentOfTotal !== undefined
          ? undefined
          : this.translations.chart.formatPercentOfTotal),
    };
  });
  private readonly numberFormatter = computed(
    () => new Intl.NumberFormat(this.resolvedLocale(), { maximumFractionDigits: 2 }),
  );
  private readonly percentageNumberFormatter = computed(
    () =>
      new Intl.NumberFormat(this.resolvedLocale(), {
        style: 'percent',
        maximumFractionDigits: 1,
      }),
  );
  protected readonly validatedData = computed<readonly KrnNormalizedDatum[]>(() => {
    const identities = new Map<KrnChartDatumKey, number>();
    return this.data().map((datum, index) => {
      const label = typeof datum.label === 'string' ? datum.label.trim() : '';
      if (!label) {
        throw new Error(`KrnChart datum at index ${index} must have a non-empty label.`);
      }
      if (!Number.isFinite(datum.value)) {
        throw new RangeError(`KrnChart datum "${datum.label}" must have a finite numeric value.`);
      }
      if (datum.value < 0 && this.negativeValuePolicy() === 'reject') {
        throw new RangeError(
          `KrnChart datum "${datum.label}" is negative while negativeValuePolicy is "reject".`,
        );
      }
      const key = this.datumIdentity()(datum, index);
      if (
        (typeof key !== 'string' && typeof key !== 'number') ||
        (typeof key === 'string' && !key.trim()) ||
        (typeof key === 'number' && !Number.isFinite(key))
      ) {
        throw new TypeError(`KrnChart datum "${datum.label}" resolved to an invalid identity.`);
      }
      const previousIndex = identities.get(key);
      if (previousIndex !== undefined) {
        throw new Error(
          `KrnChart datum identities must be unique; "${String(key)}" is used at indexes ${previousIndex} and ${index}.`,
        );
      }
      identities.set(key, index);
      return {
        ...datum,
        key,
        label,
        description: datum.description?.trim() || undefined,
        value: Math.max(0, datum.value),
      };
    });
  });
  protected readonly total = computed(() =>
    this.validatedData().reduce((sum, datum) => sum + datum.value, 0),
  );
  private readonly maxValue = computed(() =>
    Math.max(1, ...this.validatedData().map((datum) => datum.value)),
  );
  protected readonly linePoints = computed<readonly KrnLinePoint[]>(() => {
    const data = this.validatedData();
    const range = 592;
    const step = data.length > 1 ? range / (data.length - 1) : 0;
    return data.map((datum, index) => ({
      ...datum,
      x: 28 + step * index,
      y: 244 - (Math.max(0, datum.value) / this.maxValue()) * 208,
    }));
  });
  protected readonly linePath = computed(() => smoothLinePath(this.linePoints()));
  protected readonly areaPath = computed(() => {
    const points = this.linePoints();
    if (!points.length) return '';
    return `${this.linePath()} L ${points.at(-1)?.x ?? 28} 244 L ${points[0]?.x ?? 28} 244 Z`;
  });
  protected readonly bars = computed(() => {
    const data = this.validatedData();
    const slot = 592 / Math.max(1, data.length);
    const width = Math.max(14, Math.min(54, slot * 0.54));
    return data.map((datum, index) => {
      const height = (Math.max(0, datum.value) / this.maxValue()) * 208;
      return {
        ...datum,
        x: 28 + slot * index + (slot - width) / 2,
        y: 244 - height,
        width,
        height,
      };
    });
  });
  protected readonly donutSegments = computed<readonly KrnDonutSegment[]>(() => {
    const total = this.total() || 1;
    let offset = 0;
    return this.validatedData().map((datum) => {
      const percent = (Math.max(0, datum.value) / total) * 100;
      const gap = Math.min(1, percent * 0.16);
      const midpointAngle = ((offset + percent / 2) / 100) * Math.PI * 2 - Math.PI / 2;
      const segment = {
        ...datum,
        percent,
        dashPercent: Math.max(0, percent - gap),
        offset: offset - gap / 2,
        targetX: 120 + Math.cos(midpointAngle) * 82,
        targetY: 120 + Math.sin(midpointAngle) * 82,
      };
      offset += percent;
      return segment;
    });
  });
  protected readonly activeDatum = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : (this.validatedData()[index] ?? null);
  });
  protected readonly tooltipPosition = computed<KrnTooltipPosition>(() => {
    const index = this.activeIndex();
    if (index === null) return { x: 50, y: 50 };
    if (this.resolvedType() === 'line') {
      const point = this.linePoints()[index];
      return point
        ? { x: clamp((point.x / 640) * 100, 13, 87), y: clamp((point.y / 280) * 100, 24, 86) }
        : { x: 50, y: 50 };
    }
    if (this.resolvedType() === 'bar') {
      const bar = this.bars()[index];
      return bar
        ? {
            x: clamp(((bar.x + bar.width / 2) / 640) * 100, 13, 87),
            y: clamp((bar.y / 280) * 100, 24, 86),
          }
        : { x: 50, y: 50 };
    }
    return { x: 74, y: 24 };
  });
  protected readonly accessibleSummary = computed(() => {
    const data = this.validatedData();
    const requestedLimit = this.summaryItemLimit();
    const limit = Math.min(
      50,
      Math.max(1, Number.isFinite(requestedLimit) ? Math.trunc(requestedLimit) : 12),
    );
    const items = data.slice(0, limit).map((datum) => this.accessibleDatumLabel(datum));
    const remaining = data.length - items.length;
    if (remaining > 0) items.push(this.resolvedLabels().additionalItems(remaining));
    return this.resolvedLabels().summary(this.resolvedTitle(), items);
  });

  constructor() {
    effect(() => {
      const data = this.validatedData();
      const index = this.activeIndex();
      const dataChanged = data !== this.previousValidatedData;
      const indexChanged = index !== this.previousActiveIndex;

      if (dataChanged) {
        this.clearMissingInteractionKeys(data);
        const key = this.preferredInteractionKey() ?? this.activeKey();
        if (key !== null) {
          const nextIndex = data.findIndex((datum) => datum.key === key);
          if (nextIndex < 0) {
            this.activeKey.set(null);
            this.activeIndex.set(null);
          } else if (nextIndex !== index) {
            this.activeIndex.set(nextIndex);
          }
        } else if (indexChanged) {
          const datum = index === null ? null : data[index];
          this.activeKey.set(datum?.key ?? null);
          if (index !== null && !datum) this.activeIndex.set(null);
        }
      } else if (indexChanged) {
        const datum = index === null ? null : data[index];
        this.activeKey.set(datum?.key ?? null);
        if (index !== null && !datum) this.activeIndex.set(null);
      }

      this.previousValidatedData = data;
      this.previousActiveIndex = this.activeIndex();
    });
    this.destroyRef.onDestroy(() => this.cancelHideTimer());
  }

  protected color(index: number): string {
    const palette = this.resolvedPalette();
    return palette[index % palette.length] ?? 'var(--krn-chart-1, #4f6feb)';
  }

  protected barOpacity(index: number): number {
    return 0.66 + (index % 3) * 0.09;
  }

  protected setActive(index: number): void {
    this.cancelHideTimer();
    const key = this.validatedData()[index]?.key;
    if (key !== undefined) this.activateKey(key);
  }

  protected clearActive(index: number): void {
    const key = this.validatedData()[index]?.key;
    if (key === undefined || this.activeKey() !== key || this.preferredInteractionKey() !== null) {
      return;
    }
    this.scheduleClear(key);
  }

  protected setHovered(key: KrnChartDatumKey): void {
    this.cancelHideTimer();
    this.hoveredKey.set(key);
    this.activateKey(this.focusedKey() ?? key);
  }

  protected clearHovered(key: KrnChartDatumKey): void {
    if (this.hoveredKey() !== key) return;
    this.hoveredKey.set(null);
    this.reconcileAfterInteraction(key);
  }

  protected setFocused(key: KrnChartDatumKey): void {
    this.cancelHideTimer();
    this.focusedKey.set(key);
    this.activateKey(key);
  }

  protected clearFocused(key: KrnChartDatumKey): void {
    if (this.focusedKey() !== key) return;
    this.focusedKey.set(null);
    this.reconcileAfterInteraction(key);
  }

  private activateKey(key: KrnChartDatumKey): void {
    const index = this.validatedData().findIndex((datum) => datum.key === key);
    if (index < 0) return;
    this.activeKey.set(key);
    this.activeIndex.set(index);
  }

  private reconcileAfterInteraction(key: KrnChartDatumKey): void {
    const preferredKey = this.preferredInteractionKey();
    if (preferredKey !== null) {
      this.cancelHideTimer();
      this.activateKey(preferredKey);
      return;
    }
    if (this.activeKey() === key) this.scheduleClear(key);
  }

  private scheduleClear(key: KrnChartDatumKey): void {
    this.cancelHideTimer();
    const handle = this.platform.schedule(() => {
      const preferredKey = this.preferredInteractionKey();
      if (preferredKey !== null) {
        this.activateKey(preferredKey);
      } else if (this.activeKey() === key) {
        this.activeKey.set(null);
        this.activeIndex.set(null);
      }
      this.hideTimer = undefined;
    }, 110);
    if (handle === null) {
      if (this.preferredInteractionKey() === null && this.activeKey() === key) {
        this.activeKey.set(null);
        this.activeIndex.set(null);
      }
      return;
    }
    this.hideTimer = { handle, key };
  }

  protected markTabIndex(index: number): 0 | -1 {
    return index === (this.activeIndex() ?? 0) ? 0 : -1;
  }

  protected onMarkKeydown(event: KeyboardEvent, index: number): void {
    const itemCount = this.validatedData().length;
    if (!itemCount) return;

    const direction =
      this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl' ? -1 : 1;
    let targetIndex: number | null = null;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.setActive(index);
        return;
      case 'ArrowRight':
        targetIndex = (index + direction + itemCount) % itemCount;
        break;
      case 'ArrowLeft':
        targetIndex = (index - direction + itemCount) % itemCount;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = itemCount - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.setActive(targetIndex);
    this.host.nativeElement
      .querySelector<HTMLElement | SVGElement>(`[data-chart-index="${targetIndex}"]`)
      ?.focus();
  }

  protected accessibleDatumLabel(datum: KrnChartDatum): string {
    return this.resolvedLabels().datumLabel(datum.label, this.formattedValue(datum.value));
  }

  protected accessibleDatumShareLabel(datum: KrnDonutSegment): string {
    return this.resolvedLabels().datumShareLabel(
      datum.label,
      this.formattedValue(datum.value),
      this.formattedPercent(datum.percent),
    );
  }

  protected abbreviated(label: string): string {
    return label.length > 9 ? `${label.slice(0, 8)}…` : label;
  }

  protected uppercase(label: string): string {
    return label.toLocaleUpperCase(this.resolvedLocale());
  }

  protected formattedValue(value: number): string {
    const formatted = this.valueFormatter()?.(value);
    return typeof formatted === 'string' && formatted.trim()
      ? formatted
      : this.numberFormatter().format(value);
  }

  protected formattedPercent(value: number): string {
    const formatted = this.percentFormatter()?.(value);
    return typeof formatted === 'string' && formatted.trim()
      ? formatted
      : this.percentageNumberFormatter().format(value / 100);
  }

  protected percentOfTotal(value: number): string {
    const formatted = this.formattedPercent(value);
    return krnFormatTranslation(
      this.resolvedLabels().percentOfTotal,
      { value: formatted },
      this.resolvedLabels().formatPercentOfTotal,
      formatted,
    );
  }

  private cancelHideTimer(): void {
    if (this.hideTimer === undefined) return;
    this.platform.cancelScheduled(this.hideTimer.handle);
    this.hideTimer = undefined;
  }

  private preferredInteractionKey(): KrnChartDatumKey | null {
    return this.focusedKey() ?? this.hoveredKey();
  }

  private clearMissingInteractionKeys(data: readonly KrnNormalizedDatum[]): void {
    const hasKey = (key: KrnChartDatumKey | null): boolean =>
      key === null || data.some((datum) => datum.key === key);
    if (!hasKey(this.focusedKey())) this.focusedKey.set(null);
    if (!hasKey(this.hoveredKey())) this.hoveredKey.set(null);
  }
}

@Component({
  selector: 'krn-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnChart],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
})
export class KrnLineChart {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  readonly palette = input<readonly string[]>(['var(--krn-chart-1, #4f6feb)']);
  readonly locale = input<string | string[] | undefined>();
  readonly labels = input<Partial<KrnChartLabels>>({});
  readonly valueFormatter = input<KrnChartValueFormatter | null>(null);
  readonly percentFormatter = input<KrnChartValueFormatter | null>(null);
  /** Returns a stable unique key used to preserve DOM and active state across data reordering. */
  readonly datumIdentity = input<KrnChartDatumIdentity>(
    (datum, index) => datum.id ?? (datum.label || index),
  );
  /** Clamps negative values to zero by default or rejects them with a validation error. */
  readonly negativeValuePolicy = input<KrnChartNegativeValuePolicy>('clamp');
  /** Limits the accessible text summary while the full data table remains available. */
  readonly summaryItemLimit = input(12);
  /** Controls source-data disclosure and reflects user toggles. */
  readonly tableVisible = model(false);
  /** Controls the disclosed datum and reflects pointer or keyboard interaction. */
  readonly activeIndex = model<number | null>(null);
}

@Component({
  selector: 'krn-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnChart],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
})
export class KrnBarChart {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  readonly palette = input<readonly string[]>(['var(--krn-chart-1, #4f6feb)']);
  readonly locale = input<string | string[] | undefined>();
  readonly labels = input<Partial<KrnChartLabels>>({});
  readonly valueFormatter = input<KrnChartValueFormatter | null>(null);
  readonly percentFormatter = input<KrnChartValueFormatter | null>(null);
  /** Returns a stable unique key used to preserve DOM and active state across data reordering. */
  readonly datumIdentity = input<KrnChartDatumIdentity>(
    (datum, index) => datum.id ?? (datum.label || index),
  );
  /** Clamps negative values to zero by default or rejects them with a validation error. */
  readonly negativeValuePolicy = input<KrnChartNegativeValuePolicy>('clamp');
  /** Limits the accessible text summary while the full data table remains available. */
  readonly summaryItemLimit = input(12);
  /** Controls source-data disclosure and reflects user toggles. */
  readonly tableVisible = model(false);
  /** Controls the disclosed datum and reflects pointer or keyboard interaction. */
  readonly activeIndex = model<number | null>(null);
}

@Component({
  selector: 'krn-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnChart],
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.css',
})
export class KrnDonutChart {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  readonly palette = input<readonly string[]>([
    'var(--krn-chart-1, #4f6feb)',
    'var(--krn-chart-3, #5087c8)',
    'var(--krn-chart-2, #3d8a77)',
    'var(--krn-chart-5, #8a63a8)',
    'var(--krn-chart-4, #b58633)',
  ]);
  readonly locale = input<string | string[] | undefined>();
  readonly labels = input<Partial<KrnChartLabels>>({});
  readonly valueFormatter = input<KrnChartValueFormatter | null>(null);
  readonly percentFormatter = input<KrnChartValueFormatter | null>(null);
  /** Returns a stable unique key used to preserve DOM and active state across data reordering. */
  readonly datumIdentity = input<KrnChartDatumIdentity>(
    (datum, index) => datum.id ?? (datum.label || index),
  );
  /** Clamps negative values to zero by default or rejects them with a validation error. */
  readonly negativeValuePolicy = input<KrnChartNegativeValuePolicy>('clamp');
  /** Limits the accessible text summary while the full data table remains available. */
  readonly summaryItemLimit = input(12);
  /** Controls source-data disclosure and reflects user toggles. */
  readonly tableVisible = model(false);
  /** Controls the disclosed segment and reflects pointer or keyboard interaction. */
  readonly activeIndex = model<number | null>(null);
}

function smoothLinePath(points: readonly KrnLinePoint[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0]?.x ?? 28} ${points[0]?.y ?? 244}`;

  let path = `M ${points[0]?.x.toFixed(2)} ${points[0]?.y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (!start || !end) continue;
    const before = points[index - 1] ?? start;
    const after = points[index + 2] ?? end;
    const controlOneX = start.x + (end.x - before.x) / 6;
    const controlOneY = start.y + (end.y - before.y) / 6;
    const controlTwoX = end.x - (after.x - start.x) / 6;
    const controlTwoY = end.y - (after.y - start.y) / 6;
    path += ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}, ${controlTwoX.toFixed(
      2,
    )} ${controlTwoY.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }
  return path;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
