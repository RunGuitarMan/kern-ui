import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

export type KrnDisplayTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'krn-badge, krn-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-status]': 'status() ? "" : null',
  },
  template: `
    @if (status()) {
      <span class="marker" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styles: `
    :host {
      --_badge-accent: var(--krn-color-text-muted, #5d6470);
      --_badge-color: var(--krn-color-text-muted, #5d6470);
      --_badge-tint: var(--krn-color-surface-subtle, #f5f6f7);
      --_badge-surface: color-mix(
        in oklch,
        var(--krn-color-surface-raised, #fff) 86%,
        var(--_badge-tint)
      );
      display: inline-flex;
      min-block-size: 1.5rem;
      box-sizing: border-box;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid
        color-mix(in oklch, var(--_badge-accent) 22%, var(--krn-color-border, #d8dbe0));
      border-radius: var(--krn-radius-pill, 999px);
      color: var(--_badge-color);
      background: var(--_badge-surface);
      box-shadow: inset 0 1px color-mix(in oklch, white 5%, transparent);
      font: 600 0.75rem/1.05 var(--krn-font-family-ui, sans-serif);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.004em;
      text-align: center;
      vertical-align: middle;
      white-space: nowrap;
    }
    :host([data-tone='brand']) {
      --_badge-accent: var(--krn-color-primary, #4666da);
      --_badge-color: var(--krn-color-brand-text, #1d4ed8);
      --_badge-tint: var(--krn-color-primary-subtle, #e8edff);
    }
    :host([data-tone='success']) {
      --_badge-accent: var(--krn-color-success, #176b49);
      --_badge-color: var(--krn-color-success-text, #176b49);
      --_badge-tint: var(--krn-color-success-subtle, #e4f3eb);
    }
    :host([data-tone='warning']) {
      --_badge-accent: var(--krn-color-warning, #725400);
      --_badge-color: var(--krn-color-warning-text, #725400);
      --_badge-tint: var(--krn-color-warning-subtle, #fff1d0);
    }
    :host([data-tone='danger']) {
      --_badge-accent: var(--krn-color-danger, #a02d2d);
      --_badge-color: var(--krn-color-danger-text, #a02d2d);
      --_badge-tint: var(--krn-color-danger-subtle, #fce8ea);
    }
    :host([data-tone='info']) {
      --_badge-accent: var(--krn-color-info, #245ea7);
      --_badge-color: var(--krn-color-info-text, #245ea7);
      --_badge-tint: var(--krn-color-info-subtle, #e5effb);
    }
    :host([data-status]) {
      --_badge-surface: color-mix(
        in oklch,
        var(--krn-color-surface-raised, #fff) 94%,
        var(--_badge-tint)
      );
      border-color: color-mix(in oklch, var(--_badge-accent) 18%, var(--krn-color-border, #d8dbe0));
    }
    .marker {
      inline-size: 0.4rem;
      block-size: 0.4rem;
      flex: 0 0 auto;
      border: 0;
      border-radius: 50%;
      background: var(--_badge-accent);
      box-shadow: 0 0 0 2px color-mix(in oklch, var(--_badge-accent) 11%, transparent);
    }
    @media (forced-colors: active) {
      :host {
        border-color: CanvasText;
        color: CanvasText;
        background: Canvas;
        box-shadow: none;
      }
      .marker {
        forced-color-adjust: none;
        background: Highlight;
        box-shadow: none;
      }
    }
  `,
})
export class KrnBadge {
  readonly tone = input<KrnDisplayTone>('neutral');
  readonly status = input(false, { transform: booleanAttribute });
}

@Component({
  selector: 'krn-chip, krn-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[attr.data-selected]': 'selected() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
  template: `
    <ng-template #projectedLabel><ng-content /></ng-template>
    @if (interactive()) {
      <button
        type="button"
        class="label"
        [disabled]="disabled()"
        [attr.aria-pressed]="selected()"
        (click)="toggle()"
      >
        <ng-container [ngTemplateOutlet]="projectedLabel" />
      </button>
    } @else {
      <span class="label"><ng-container [ngTemplateOutlet]="projectedLabel" /></span>
    }
    @if (removable()) {
      <button
        type="button"
        class="remove"
        [disabled]="disabled()"
        [attr.aria-label]="translations.dataDisplay.removeItem(accessibleLabel())"
        (click)="remove.emit()"
      >
        <span aria-hidden="true">×</span>
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      min-block-size: var(--krn-control-size-sm, 2rem);
      align-items: stretch;
      overflow: clip;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
      font: var(--krn-font-label, 600 0.8125rem/1.125rem sans-serif);
    }
    :host([data-selected]) {
      border-color: var(--krn-color-brand-border, #dc7352);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    button {
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: -3px;
    }
    .label {
      display: inline-flex;
      align-items: center;
      padding-inline: 0.625rem;
    }
    .remove {
      inline-size: 1.75rem;
      border-inline-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      font-size: 1rem;
    }
    :host([data-disabled]) {
      opacity: var(--krn-opacity-disabled, 0.48);
    }
  `,
})
export class KrnChip {
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly selected = model(false);
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly accessibleLabel = input(this.translations.dataDisplay.tag);
  readonly remove = output<void>();

  protected toggle(): void {
    if (!this.disabled()) this.selected.update((value) => !value);
  }
}
