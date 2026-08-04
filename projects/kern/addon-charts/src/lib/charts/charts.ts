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
  template: `
    <figure>
      <figcaption>
        <span>
          @if (eyebrow()) {
            <small>{{ eyebrow() }}</small>
          }
          <strong>{{ resolvedTitle() }}</strong>
          @if (description()) {
            <span>{{ description() }}</span>
          }
        </span>
        <button
          type="button"
          class="data-toggle"
          [attr.aria-expanded]="tableVisible()"
          [attr.aria-controls]="tableVisible() ? tableId : null"
          (click)="tableVisible.update(toggle)"
        >
          {{ tableVisible() ? resolvedLabels().hideData : resolvedLabels().viewData }}
        </button>
      </figcaption>

      <div class="plot" [class.has-active]="activeIndex() !== null">
        @if (!validatedData().length) {
          <p class="empty-chart" role="status">{{ resolvedLabels().empty }}</p>
        } @else if (resolvedType() === 'line') {
          <svg viewBox="0 0 640 280" role="group" [attr.aria-label]="accessibleSummary()">
            <g class="grid" aria-hidden="true">
              @for (line of gridLines; track line) {
                <line x1="28" [attr.y1]="line" x2="620" [attr.y2]="line"></line>
              }
            </g>
            <path class="area" [attr.d]="areaPath()" aria-hidden="true"></path>
            <path class="line" [attr.d]="linePath()" aria-hidden="true"></path>
            @for (point of linePoints(); track point.key; let index = $index) {
              <g
                class="point"
                [attr.tabindex]="markTabIndex(index)"
                role="button"
                [attr.data-chart-index]="index"
                [attr.data-active]="activeIndex() === index ? '' : null"
                [attr.aria-label]="accessibleDatumLabel(point)"
                (mouseenter)="setHovered(point.key)"
                (mouseleave)="clearHovered(point.key)"
                (focus)="setFocused(point.key)"
                (blur)="clearFocused(point.key)"
                (click)="setActive(index)"
                (keydown)="onMarkKeydown($event, index)"
              >
                <rect
                  class="mark-hit-area"
                  [attr.x]="point.x - 42"
                  y="24"
                  width="84"
                  height="242"
                  rx="12"
                  aria-hidden="true"
                ></rect>
                <circle class="hit-area" [attr.cx]="point.x" [attr.cy]="point.y" r="16"></circle>
                <circle class="dot" [attr.cx]="point.x" [attr.cy]="point.y" r="4"></circle>
                <text [attr.x]="point.x" y="270" text-anchor="middle">
                  {{ abbreviated(point.label) }}
                </text>
                <title>{{ accessibleDatumLabel(point) }}</title>
              </g>
            }
          </svg>
        } @else if (resolvedType() === 'bar') {
          <svg viewBox="0 0 640 280" role="group" [attr.aria-label]="accessibleSummary()">
            <g class="grid" aria-hidden="true">
              @for (line of gridLines; track line) {
                <line x1="28" [attr.y1]="line" x2="620" [attr.y2]="line"></line>
              }
            </g>
            @for (bar of bars(); track bar.key; let index = $index) {
              <g
                class="bar"
                [attr.tabindex]="markTabIndex(index)"
                role="button"
                [attr.data-chart-index]="index"
                [attr.data-active]="activeIndex() === index ? '' : null"
                [attr.aria-label]="accessibleDatumLabel(bar)"
                [style.--_bar-opacity]="barOpacity(index)"
                (mouseenter)="setHovered(bar.key)"
                (mouseleave)="clearHovered(bar.key)"
                (focus)="setFocused(bar.key)"
                (blur)="clearFocused(bar.key)"
                (click)="setActive(index)"
                (keydown)="onMarkKeydown($event, index)"
              >
                <rect
                  [attr.x]="bar.x"
                  [attr.y]="bar.y"
                  [attr.width]="bar.width"
                  [attr.height]="bar.height"
                  rx="7"
                ></rect>
                <text [attr.x]="bar.x + bar.width / 2" y="270" text-anchor="middle">
                  {{ abbreviated(bar.label) }}
                </text>
                <title>{{ accessibleDatumLabel(bar) }}</title>
              </g>
            }
          </svg>
        } @else {
          <div class="donut-layout">
            <svg viewBox="0 0 240 240" role="group" [attr.aria-label]="accessibleSummary()">
              <circle class="donut-track" cx="120" cy="120" r="82" aria-hidden="true"></circle>
              @for (segment of donutSegments(); track segment.key; let index = $index) {
                <circle
                  class="donut-segment"
                  cx="120"
                  cy="120"
                  r="82"
                  pathLength="100"
                  [attr.stroke-dasharray]="segment.dashPercent + ' ' + (100 - segment.dashPercent)"
                  [attr.stroke-dashoffset]="segment.offset * -1"
                  [attr.data-active]="activeIndex() === index ? '' : null"
                  [style.--_series-color]="color(index)"
                  aria-hidden="true"
                  (mouseenter)="setHovered(segment.key)"
                  (mouseleave)="clearHovered(segment.key)"
                  (click)="setActive(index)"
                ></circle>
                <circle
                  class="donut-hit-area"
                  [attr.cx]="segment.targetX"
                  [attr.cy]="segment.targetY"
                  r="16"
                  [attr.data-active]="activeIndex() === index ? '' : null"
                  aria-hidden="true"
                  (mouseenter)="setHovered(segment.key)"
                  (mouseleave)="clearHovered(segment.key)"
                  (click)="setActive(index)"
                >
                  <title>
                    {{ accessibleDatumShareLabel(segment) }}
                  </title>
                </circle>
              }
              @if (activeDatum(); as active) {
                <text x="120" y="111" text-anchor="middle" class="donut-total-label">
                  {{ uppercase(abbreviated(active.label)) }}
                </text>
                <text x="120" y="140" text-anchor="middle" class="donut-total">
                  {{ formattedValue(active.value) }}
                </text>
              } @else {
                <text x="120" y="111" text-anchor="middle" class="donut-total-label">
                  {{ uppercase(resolvedLabels().total) }}
                </text>
                <text x="120" y="140" text-anchor="middle" class="donut-total">
                  {{ formattedValue(total()) }}
                </text>
              }
            </svg>
            <ul class="legend" [attr.aria-label]="resolvedLabels().legend">
              @for (segment of donutSegments(); track segment.key; let index = $index) {
                <li [attr.data-active]="activeIndex() === index ? '' : null">
                  <button
                    type="button"
                    [attr.data-active]="activeIndex() === index ? '' : null"
                    (mouseenter)="setHovered(segment.key)"
                    (mouseleave)="clearHovered(segment.key)"
                    (focus)="setFocused(segment.key)"
                    (blur)="clearFocused(segment.key)"
                    (click)="setActive(index)"
                  >
                    <i [style.--_series-color]="color(index)" aria-hidden="true"></i>
                    <span>{{ segment.label }}</span>
                    <strong>{{ formattedPercent(segment.percent) }}</strong>
                  </button>
                </li>
              }
            </ul>
          </div>
        }

        @if (activeDatum(); as active) {
          <div
            class="chart-tooltip"
            role="status"
            aria-live="polite"
            [style.--_tooltip-x]="tooltipPosition().x + '%'"
            [style.--_tooltip-y]="tooltipPosition().y + '%'"
          >
            <span>{{ active.label }}</span>
            <strong>{{ formattedValue(active.value) }}</strong>
            <small>
              {{
                active.description ||
                  percentOfTotal(total() ? (Math.max(0, active.value) / total()) * 100 : 0)
              }}
            </small>
          </div>
        }
      </div>

      @if (tableVisible()) {
        <div class="table-scroll" [id]="tableId">
          <table>
            <caption>
              {{
                resolvedLabels().sourceDataCaption(resolvedTitle(), resolvedLabels().sourceData)
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ resolvedLabels().labelColumn }}</th>
                <th scope="col">{{ resolvedLabels().valueColumn }}</th>
                <th scope="col">{{ resolvedLabels().shareColumn }}</th>
              </tr>
            </thead>
            <tbody>
              @for (datum of validatedData(); track datum.key) {
                <tr>
                  <th scope="row">{{ datum.label }}</th>
                  <td>{{ formattedValue(datum.value) }}</td>
                  <td>
                    {{ formattedPercent(total() ? (Math.max(0, datum.value) / total()) * 100 : 0) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </figure>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      container: krn-chart / inline-size;
      color: var(--krn-color-text, #252932);
      font: var(--krn-font-body-sm, 500 0.8125rem/1.25rem sans-serif);
    }
    :host([hidden]) {
      display: none;
    }
    figure {
      display: grid;
      gap: 1.25rem;
      margin: 0;
    }
    figcaption {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 1rem;
    }
    figcaption > span {
      display: grid;
      gap: 0.1875rem;
    }
    figcaption small {
      color: var(--krn-color-brand-text, #1d4ed8);
      font-size: 0.6875rem;
      font-weight: 650;
      letter-spacing: 0.075em;
      text-transform: uppercase;
    }
    figcaption strong {
      font: var(--krn-font-heading-sm, 650 1.125rem/1.5rem sans-serif);
      letter-spacing: -0.012em;
    }
    figcaption span span {
      color: var(--krn-color-text-muted, #626a76);
    }
    .data-toggle {
      min-block-size: 2rem;
      padding-inline: 0.6875rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
      box-shadow: var(--krn-shadow-xs, 0 1px 2px rgb(0 0 0 / 5%));
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition:
        border-color var(--krn-motion-duration-interaction),
        background var(--krn-motion-duration-interaction);
    }
    .data-toggle:hover {
      border-color: var(--krn-color-border-strong, #b5bac2);
      background: var(--krn-color-surface-subtle, #f6f6f6);
    }
    button:focus-visible,
    [tabindex='0']:focus-visible {
      outline: var(--krn-focus-ring-width, 2px) solid var(--krn-color-focus, #4f6feb);
      outline-offset: var(--krn-focus-ring-offset, 2px);
    }
    .plot {
      position: relative;
      min-inline-size: 0;
      isolation: isolate;
    }
    .empty-chart {
      display: grid;
      min-block-size: 12rem;
      place-items: center;
      margin: 0;
      border: 1px dashed var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-md, 0.5rem);
      color: var(--krn-color-text-muted, #626a76);
    }
    svg {
      display: block;
      inline-size: 100%;
      block-size: auto;
      overflow: visible;
    }
    .grid line {
      stroke: color-mix(in oklch, var(--krn-color-border-subtle, #e0e3e7) 76%, transparent);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .area {
      fill: color-mix(in oklch, var(--krn-chart-1, #4f6feb) 11%, transparent);
      stroke: none;
    }
    .line {
      fill: none;
      stroke: var(--krn-chart-1, #4f6feb);
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.5;
      vector-effect: non-scaling-stroke;
      filter: drop-shadow(
        0 4px 8px color-mix(in oklch, var(--krn-chart-1, #4f6feb) 20%, transparent)
      );
    }
    .point,
    .bar,
    .donut-segment,
    .donut-hit-area {
      cursor: pointer;
      outline: none;
    }
    .hit-area,
    .mark-hit-area {
      fill: transparent;
      stroke: none;
      pointer-events: all;
    }
    .dot {
      fill: var(--krn-color-surface, #fff);
      stroke: var(--krn-chart-1, #4f6feb);
      stroke-width: 2.5;
      vector-effect: non-scaling-stroke;
      transition:
        r var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease),
        fill var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease),
        opacity var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease);
    }
    .point:hover .dot,
    .point[data-active] .dot,
    .point:focus .dot {
      r: 6;
      fill: var(--krn-chart-1, #4f6feb);
    }
    .point text,
    .bar text {
      fill: var(--krn-color-text-muted, #626a76);
      font: 500 11px var(--krn-font-family-ui, sans-serif);
      letter-spacing: 0.01em;
      pointer-events: none;
    }
    .bar rect {
      fill: var(--krn-chart-1, #4f6feb);
      opacity: var(--_bar-opacity);
      transform-box: fill-box;
      transform-origin: center bottom;
      transition:
        opacity var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease),
        transform var(--krn-motion-duration-enter) var(--krn-motion-ease-enter, ease);
    }
    .bar:hover rect,
    .bar[data-active] rect,
    .bar:focus rect {
      opacity: 1;
      transform: scaleY(1.018);
    }
    .has-active .bar:not([data-active]) rect,
    .has-active .point:not([data-active]) .dot {
      opacity: 0.38;
    }
    .donut-layout {
      display: grid;
      grid-template-columns: minmax(11rem, 15rem) minmax(10rem, 1fr);
      align-items: center;
      gap: clamp(1.25rem, 5cqi, 3rem);
    }
    .donut-layout svg {
      aspect-ratio: 1;
    }
    .donut-track,
    .donut-segment {
      fill: none;
      stroke-width: 24;
      vector-effect: non-scaling-stroke;
    }
    .donut-track {
      stroke: var(--krn-color-surface-sunken, #f2f3f5);
    }
    .donut-segment {
      stroke: var(--_series-color);
      stroke-linecap: round;
      pointer-events: stroke;
      rotate: -90deg;
      transform-origin: center;
      transition:
        opacity var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease),
        stroke-width var(--krn-motion-duration-enter) var(--krn-motion-ease-enter, ease);
    }
    .donut-segment:hover,
    .donut-segment[data-active],
    .donut-segment:focus {
      stroke-width: 29;
    }
    .has-active .donut-segment:not([data-active]) {
      opacity: 0.3;
    }
    .donut-hit-area {
      fill: transparent;
      stroke: none;
      pointer-events: all;
    }
    .donut-total-label {
      fill: var(--krn-color-text-muted, #626a76);
      font: 650 9px var(--krn-font-family-ui, sans-serif);
      letter-spacing: 0.09em;
    }
    .donut-total {
      fill: var(--krn-color-text, #252932);
      font: 650 25px var(--krn-font-family-ui, sans-serif);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
    }
    .donut-total-label,
    .donut-total {
      pointer-events: none;
    }
    .legend {
      display: grid;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .legend button {
      display: grid;
      inline-size: 100%;
      grid-template-columns: 0.625rem minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.625rem;
      min-block-size: 2.25rem;
      padding-inline: 0.625rem;
      border: 0;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
      transition: background var(--krn-motion-duration-selection)
        var(--krn-motion-ease-standard, ease);
    }
    .legend button:hover,
    .legend li[data-active] button {
      background: var(--krn-color-surface-subtle, #f2f3f5);
    }
    .legend i {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-radius: 50%;
      background: var(--_series-color);
      box-shadow: 0 0 0 3px color-mix(in oklch, var(--_series-color) 13%, transparent);
    }
    .legend strong {
      color: var(--krn-color-text-muted, #626a76);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .chart-tooltip {
      position: absolute;
      z-index: 2;
      inset-block-start: var(--_tooltip-y);
      inset-inline-start: var(--_tooltip-x);
      display: grid;
      min-inline-size: 8.5rem;
      gap: 0.1rem;
      padding: 0.5625rem 0.6875rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-md, 0.5rem);
      color: var(--krn-color-text, #252932);
      background: color-mix(in oklch, var(--krn-color-surface-raised, #fff) 94%, transparent);
      box-shadow: var(--krn-shadow-overlay, 0 12px 32px rgb(0 0 0 / 18%));
      font-size: 0.75rem;
      pointer-events: none;
      transform: translate(-50%, calc(-100% - 0.5rem));
      backdrop-filter: blur(10px);
      transition:
        inset-block-start var(--krn-motion-duration-selection)
          var(--krn-motion-ease-enter, ease-out),
        inset-inline-start var(--krn-motion-duration-selection)
          var(--krn-motion-ease-enter, ease-out);
      animation: krn-chart-tooltip-in var(--krn-motion-duration-selection)
        var(--krn-motion-ease-enter, ease-out);
    }
    .chart-tooltip span,
    .chart-tooltip small {
      color: var(--krn-color-text-muted, #626a76);
    }
    .chart-tooltip strong {
      font-size: 0.9375rem;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.015em;
    }
    .chart-tooltip small {
      font-size: 0.6875rem;
    }
    @keyframes krn-chart-tooltip-in {
      from {
        opacity: 0;
        transform: translate(-50%, calc(-100% - 0.25rem)) scale(0.98);
      }
    }
    .table-scroll {
      max-inline-size: 100%;
      overflow: auto;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-md, 0.5rem);
      background: var(--krn-color-surface, #fff);
    }
    table {
      inline-size: 100%;
      border-collapse: collapse;
    }
    caption {
      padding: 0.75rem;
      font-weight: 650;
      text-align: start;
    }
    th,
    td {
      padding: 0.625rem 0.75rem;
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      text-align: start;
    }
    td {
      font-variant-numeric: tabular-nums;
      text-align: end;
    }
    @container krn-chart (max-width: 30rem) {
      .donut-layout {
        grid-template-columns: 1fr;
      }
      .donut-layout svg {
        max-inline-size: 12.5rem;
        justify-self: center;
      }
      .chart-tooltip {
        inset-block-start: 0.5rem;
        inset-inline-start: 0.5rem;
        min-inline-size: 7.5rem;
        transform: none;
      }
    }
    @media (pointer: coarse) {
      .data-toggle,
      .legend button {
        min-block-size: 2.75rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .dot,
      :host-context(html:not([data-krn-motion='full'])) .bar rect,
      :host-context(html:not([data-krn-motion='full'])) .donut-segment,
      :host-context(html:not([data-krn-motion='full'])) .chart-tooltip {
        transition: none;
        animation: none;
      }
    }
    @media (forced-colors: active) {
      .line,
      .dot,
      .bar rect,
      .donut-segment {
        stroke: Highlight;
      }
      .bar rect {
        fill: Highlight;
      }
      .chart-tooltip {
        border-color: CanvasText;
        background: Canvas;
        backdrop-filter: none;
      }
    }
  `,
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
  template: `
    <krn-chart
      type="line"
      [title]="title()"
      [eyebrow]="eyebrow()"
      [description]="description()"
      [data]="data()"
      [palette]="palette()"
      [locale]="locale()"
      [labels]="labels()"
      [valueFormatter]="valueFormatter()"
      [percentFormatter]="percentFormatter()"
      [datumIdentity]="datumIdentity()"
      [negativeValuePolicy]="negativeValuePolicy()"
      [summaryItemLimit]="summaryItemLimit()"
      [(tableVisible)]="tableVisible"
      [(activeIndex)]="activeIndex"
    />
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
  `,
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
  template: `
    <krn-chart
      type="bar"
      [title]="title()"
      [eyebrow]="eyebrow()"
      [description]="description()"
      [data]="data()"
      [palette]="palette()"
      [locale]="locale()"
      [labels]="labels()"
      [valueFormatter]="valueFormatter()"
      [percentFormatter]="percentFormatter()"
      [datumIdentity]="datumIdentity()"
      [negativeValuePolicy]="negativeValuePolicy()"
      [summaryItemLimit]="summaryItemLimit()"
      [(tableVisible)]="tableVisible"
      [(activeIndex)]="activeIndex"
    />
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
  `,
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
  template: `
    <krn-chart
      type="donut"
      [title]="title()"
      [eyebrow]="eyebrow()"
      [description]="description()"
      [data]="data()"
      [palette]="palette()"
      [locale]="locale()"
      [labels]="labels()"
      [valueFormatter]="valueFormatter()"
      [percentFormatter]="percentFormatter()"
      [datumIdentity]="datumIdentity()"
      [negativeValuePolicy]="negativeValuePolicy()"
      [summaryItemLimit]="summaryItemLimit()"
      [(tableVisible)]="tableVisible"
      [(activeIndex)]="activeIndex"
    />
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
  `,
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
