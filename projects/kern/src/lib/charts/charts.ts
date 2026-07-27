import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
} from '@angular/core';

export interface KrnChartDatum {
  readonly label: string;
  readonly value: number;
  readonly description?: string;
}

export type KrnChartType = 'line' | 'bar' | 'donut';

interface KrnLinePoint extends KrnChartDatum {
  readonly x: number;
  readonly y: number;
}

interface KrnDonutSegment extends KrnChartDatum {
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
    '[attr.data-type]': 'type()',
  },
  template: `
    <figure>
      <figcaption>
        <span>
          @if (eyebrow()) {
            <small>{{ eyebrow() }}</small>
          }
          <strong>{{ title() }}</strong>
          @if (description()) {
            <span>{{ description() }}</span>
          }
        </span>
        <button
          type="button"
          class="data-toggle"
          [attr.aria-expanded]="tableVisible()"
          (click)="tableVisible.update(toggle)"
        >
          {{ tableVisible() ? 'Hide data' : 'View data' }}
        </button>
      </figcaption>

      <div class="plot" [class.has-active]="activeIndex() !== null">
        @if (type() === 'line') {
          <svg viewBox="0 0 640 280" role="img" [attr.aria-label]="accessibleSummary()">
            <g class="grid" aria-hidden="true">
              @for (line of gridLines; track line) {
                <line x1="28" [attr.y1]="line" x2="620" [attr.y2]="line"></line>
              }
            </g>
            <path class="area" [attr.d]="areaPath()" aria-hidden="true"></path>
            <path class="line" [attr.d]="linePath()" aria-hidden="true"></path>
            @for (point of linePoints(); track $index; let index = $index) {
              <g
                class="point"
                tabindex="0"
                role="graphics-symbol"
                [attr.data-active]="activeIndex() === index ? '' : null"
                [attr.aria-label]="point.label + ': ' + point.value"
                (mouseenter)="setActive(index)"
                (mouseleave)="clearActive(index)"
                (focus)="setActive(index)"
                (blur)="clearActive(index)"
                (click)="setActive(index)"
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
                <title>{{ point.label }}: {{ point.value }}</title>
              </g>
            }
          </svg>
        } @else if (type() === 'bar') {
          <svg viewBox="0 0 640 280" role="img" [attr.aria-label]="accessibleSummary()">
            <g class="grid" aria-hidden="true">
              @for (line of gridLines; track line) {
                <line x1="28" [attr.y1]="line" x2="620" [attr.y2]="line"></line>
              }
            </g>
            @for (bar of bars(); track $index; let index = $index) {
              <g
                class="bar"
                tabindex="0"
                role="graphics-symbol"
                [attr.data-active]="activeIndex() === index ? '' : null"
                [attr.aria-label]="bar.label + ': ' + bar.value"
                [style.--_bar-opacity]="barOpacity(index)"
                (mouseenter)="setActive(index)"
                (mouseleave)="clearActive(index)"
                (focus)="setActive(index)"
                (blur)="clearActive(index)"
                (click)="setActive(index)"
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
                <title>{{ bar.label }}: {{ bar.value }}</title>
              </g>
            }
          </svg>
        } @else {
          <div class="donut-layout">
            <svg viewBox="0 0 240 240" role="img" [attr.aria-label]="accessibleSummary()">
              <circle class="donut-track" cx="120" cy="120" r="82"></circle>
              @for (segment of donutSegments(); track $index; let index = $index) {
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
                  (mouseenter)="setActive(index)"
                  (mouseleave)="clearActive(index)"
                  (click)="setActive(index)"
                ></circle>
                <circle
                  class="donut-hit-area"
                  [attr.cx]="segment.targetX"
                  [attr.cy]="segment.targetY"
                  r="16"
                  tabindex="0"
                  role="graphics-symbol"
                  [attr.data-active]="activeIndex() === index ? '' : null"
                  [attr.aria-label]="
                    segment.label + ': ' + segment.value + ', ' + rounded(segment.percent) + '%'
                  "
                  (mouseenter)="setActive(index)"
                  (mouseleave)="clearActive(index)"
                  (focus)="setActive(index)"
                  (blur)="clearActive(index)"
                  (click)="setActive(index)"
                >
                  <title>
                    {{ segment.label }}: {{ segment.value }} ({{ rounded(segment.percent) }}%)
                  </title>
                </circle>
              }
              @if (activeDatum(); as active) {
                <text x="120" y="111" text-anchor="middle" class="donut-total-label">
                  {{ abbreviated(active.label).toUpperCase() }}
                </text>
                <text x="120" y="140" text-anchor="middle" class="donut-total">
                  {{ formattedValue(active.value) }}
                </text>
              } @else {
                <text x="120" y="111" text-anchor="middle" class="donut-total-label">TOTAL</text>
                <text x="120" y="140" text-anchor="middle" class="donut-total">
                  {{ formattedValue(total()) }}
                </text>
              }
            </svg>
            <ul class="legend" aria-label="Chart legend">
              @for (segment of donutSegments(); track $index; let index = $index) {
                <li [attr.data-active]="activeIndex() === index ? '' : null">
                  <button
                    type="button"
                    (mouseenter)="setActive(index)"
                    (mouseleave)="clearActive(index)"
                    (focus)="setActive(index)"
                    (blur)="clearActive(index)"
                    (click)="setActive(index)"
                  >
                    <i [style.--_series-color]="color(index)" aria-hidden="true"></i>
                    <span>{{ segment.label }}</span>
                    <strong>{{ rounded(segment.percent) }}%</strong>
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
                  rounded(total() ? (Math.max(0, active.value) / total()) * 100 : 0) + '% of total'
              }}
            </small>
          </div>
        }
      </div>

      @if (tableVisible()) {
        <div class="table-scroll">
          <table>
            <caption>
              {{
                title()
              }}
              — source data
            </caption>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Value</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              @for (datum of data(); track $index) {
                <tr>
                  <th scope="row">{{ datum.label }}</th>
                  <td>{{ formattedValue(datum.value) }}</td>
                  <td>{{ rounded(total() ? (Math.max(0, datum.value) / total()) * 100 : 0) }}%</td>
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
        border-color var(--krn-motion-duration-fast, 90ms),
        background var(--krn-motion-duration-fast, 90ms);
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
        r 180ms var(--krn-motion-ease-standard, ease),
        fill 180ms var(--krn-motion-ease-standard, ease),
        opacity 180ms var(--krn-motion-ease-standard, ease);
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
        opacity 200ms var(--krn-motion-ease-standard, ease),
        transform 240ms var(--krn-motion-ease-enter, ease);
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
        opacity 200ms var(--krn-motion-ease-standard, ease),
        stroke-width 240ms var(--krn-motion-ease-enter, ease);
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
      transition: background 180ms var(--krn-motion-ease-standard, ease);
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
        inset-block-start 180ms var(--krn-motion-ease-enter, ease-out),
        inset-inline-start 180ms var(--krn-motion-ease-enter, ease-out);
      animation: krn-chart-tooltip-in 180ms var(--krn-motion-ease-enter, ease-out);
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
    @media (prefers-reduced-motion: reduce) {
      .dot,
      .bar rect,
      .donut-segment,
      .chart-tooltip {
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
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly Math = Math;
  readonly type = input<KrnChartType>('line');
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  readonly tableVisible = model(false);
  readonly activeIndex = model<number | null>(null);
  readonly gridLines = [36, 105, 174, 244];
  readonly palette = input<readonly string[]>([
    'var(--krn-chart-1, #4f6feb)',
    'var(--krn-chart-3, #5087c8)',
    'var(--krn-chart-2, #3d8a77)',
    'var(--krn-chart-5, #8a63a8)',
    'var(--krn-chart-4, #b58633)',
  ]);
  readonly toggle = (value: boolean): boolean => !value;
  readonly total = computed(() =>
    this.data().reduce((sum, datum) => sum + Math.max(0, datum.value), 0),
  );
  readonly maxValue = computed(() => Math.max(1, ...this.data().map((datum) => datum.value)));
  readonly linePoints = computed<readonly KrnLinePoint[]>(() => {
    const data = this.data();
    const range = 592;
    const step = data.length > 1 ? range / (data.length - 1) : 0;
    return data.map((datum, index) => ({
      ...datum,
      x: 28 + step * index,
      y: 244 - (Math.max(0, datum.value) / this.maxValue()) * 208,
    }));
  });
  readonly linePath = computed(() => smoothLinePath(this.linePoints()));
  readonly areaPath = computed(() => {
    const points = this.linePoints();
    if (!points.length) return '';
    return `${this.linePath()} L ${points.at(-1)?.x ?? 28} 244 L ${points[0]?.x ?? 28} 244 Z`;
  });
  readonly bars = computed(() => {
    const data = this.data();
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
  readonly donutSegments = computed<readonly KrnDonutSegment[]>(() => {
    const total = this.total() || 1;
    let offset = 0;
    return this.data().map((datum) => {
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
  readonly activeDatum = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : (this.data()[index] ?? null);
  });
  readonly tooltipPosition = computed<KrnTooltipPosition>(() => {
    const index = this.activeIndex();
    if (index === null) return { x: 50, y: 50 };
    if (this.type() === 'line') {
      const point = this.linePoints()[index];
      return point
        ? { x: clamp((point.x / 640) * 100, 13, 87), y: clamp((point.y / 280) * 100, 24, 86) }
        : { x: 50, y: 50 };
    }
    if (this.type() === 'bar') {
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
  readonly accessibleSummary = computed(
    () =>
      `${this.title()}. ${this.data()
        .map((datum) => `${datum.label}: ${datum.value}`)
        .join(', ')}`,
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
    });
  }

  color(index: number): string {
    const palette = this.palette();
    return palette[index % palette.length] ?? 'var(--krn-chart-1, #4f6feb)';
  }

  barOpacity(index: number): number {
    return 0.66 + (index % 3) * 0.09;
  }

  setActive(index: number): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
    this.activeIndex.set(index);
  }

  clearActive(index: number): void {
    if (this.activeIndex() !== index) return;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      if (this.activeIndex() === index) this.activeIndex.set(null);
      this.hideTimer = undefined;
    }, 110);
  }

  abbreviated(label: string): string {
    return label.length > 9 ? `${label.slice(0, 8)}…` : label;
  }

  formattedValue(value: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }

  rounded(value: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
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
    />
  `,
})
export class KrnLineChart {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  readonly palette = input<readonly string[]>(['var(--krn-chart-1, #4f6feb)']);
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
    />
  `,
})
export class KrnBarChart {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly data = input.required<readonly KrnChartDatum[]>();
  readonly palette = input<readonly string[]>(['var(--krn-chart-1, #4f6feb)']);
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
    />
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
