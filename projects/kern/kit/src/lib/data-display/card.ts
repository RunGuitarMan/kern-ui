import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'krn-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-interactive]': 'interactive() ? "" : null',
    '[attr.tabindex]': 'interactive() ? 0 : null',
  },
  template: `
    @if (eyebrow()) {
      <p class="eyebrow">{{ eyebrow() }}</p>
    }
    @if (heading()) {
      <div class="heading-row">
        <h3>{{ heading() }}</h3>
        <ng-content select="[krnCardAction]" />
      </div>
    }
    <div class="body"><ng-content /></div>
    <ng-content select="[krnCardFooter]" />
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      padding: var(--krn-space-5, 1.25rem);
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
    }
    :host([data-interactive]) {
      cursor: pointer;
      transition:
        border-color var(--krn-motion-duration-interaction),
        translate var(--krn-motion-duration-interaction);
    }
    :host([data-interactive]):hover {
      border-color: var(--krn-color-border-strong, #8f969f);
    }
    :host([data-interactive]):active {
      translate: 0 1px;
    }
    :host([data-interactive]):focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 3px;
    }
    .eyebrow {
      margin: 0 0 var(--krn-space-2, 0.5rem);
      color: var(--krn-color-text-muted, #626a76);
      font: var(--krn-font-label-sm, 650 0.75rem/1rem sans-serif);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .heading-row {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: var(--krn-space-4, 1rem);
      margin-block-end: var(--krn-space-3, 0.75rem);
    }
    h3 {
      margin: 0;
      font: var(--krn-font-heading-sm, 650 1.125rem/1.5rem sans-serif);
    }
    .body {
      min-inline-size: 0;
    }
  `,
})
export class KrnCard {
  readonly eyebrow = input('');
  readonly heading = input('');
  readonly interactive = input(false, { transform: booleanAttribute });
}

@Component({
  selector: 'krn-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-trend]': 'trend()',
  },
  template: `
    <span class="label">{{ label() }}</span>
    <strong>{{ value() }}</strong>
    @if (detail()) {
      <span class="detail">
        @if (trend() !== 'flat') {
          <span aria-hidden="true">{{ trend() === 'up' ? '↗' : '↘' }}</span>
        }
        {{ detail() }}
      </span>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.25rem;
      min-inline-size: 0;
      font-variant-numeric: tabular-nums;
    }
    .label,
    .detail {
      color: var(--krn-color-text-muted, #626a76);
      font: var(--krn-font-body-sm, 500 0.8125rem/1.125rem sans-serif);
    }
    strong {
      overflow-wrap: anywhere;
      color: var(--krn-color-text, #252932);
      font: var(--krn-font-heading-lg, 620 1.75rem/2rem sans-serif);
      letter-spacing: -0.025em;
    }
    :host([data-trend='up']) .detail {
      color: var(--krn-color-success-text, #176b49);
    }
    :host([data-trend='down']) .detail {
      color: var(--krn-color-danger-text, #a02d2d);
    }
  `,
})
export class KrnStat {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input('');
  readonly trend = input<'up' | 'down' | 'flat'>('flat');
}
