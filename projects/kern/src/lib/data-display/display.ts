import { Clipboard } from '@angular/cdk/clipboard';
import { NgTemplateOutlet } from '@angular/common';
import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';

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
        [attr.aria-label]="'Remove ' + accessibleLabel()"
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
  readonly selected = model(false);
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly accessibleLabel = input('tag');
  readonly remove = output<void>();

  toggle(): void {
    if (!this.disabled()) this.selected.update((value) => !value);
  }
}

@Component({
  selector: 'krn-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" (error)="imageFailed.set(true)" [hidden]="imageFailed()" />
    }
    @if (!src() || imageFailed()) {
      <span aria-hidden="true">{{ initials() }}</span>
      <span class="sr-only">{{ alt() || name() }}</span>
    }
    @if (status()) {
      <span class="status" [attr.data-status]="status()" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      flex: 0 0 auto;
      place-items: center;
      overflow: visible;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: 50%;
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface-raised, #f2f3f5);
      font: 650 0.75rem/1 var(--krn-font-family-ui, sans-serif);
    }
    :host([data-size='sm']) {
      inline-size: 2rem;
      block-size: 2rem;
      font-size: 0.6875rem;
    }
    :host([data-size='lg']) {
      inline-size: 3.25rem;
      block-size: 3.25rem;
      font-size: 0.875rem;
    }
    img {
      inline-size: 100%;
      block-size: 100%;
      border-radius: inherit;
      object-fit: cover;
    }
    .status {
      position: absolute;
      inset-inline-end: -1px;
      inset-block-end: -1px;
      inline-size: 0.625rem;
      block-size: 0.625rem;
      border: 2px solid var(--krn-color-surface, #fff);
      border-radius: 50%;
      background: var(--krn-color-text-muted, #626a76);
    }
    .status[data-status='online'] {
      background: var(--krn-color-success-solid, #1c8d62);
    }
    .status[data-status='busy'] {
      background: var(--krn-color-danger-solid, #c73a35);
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class KrnAvatar {
  readonly src = input<string | undefined>();
  readonly alt = input('');
  readonly name = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly status = input<'online' | 'away' | 'busy' | undefined>();
  readonly imageFailed = model(false);
  readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('');
  });
}

@Component({
  selector: 'krn-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--krn-avatar-overlap]': 'overlap()',
    '[attr.aria-label]': 'ariaLabel()',
    role: 'group',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }
    :host ::ng-deep krn-avatar + krn-avatar {
      margin-inline-start: calc(var(--krn-avatar-overlap, 0.625rem) * -1);
    }
    :host ::ng-deep krn-avatar {
      box-shadow: 0 0 0 2px var(--krn-color-canvas, #faf9f7);
    }
  `,
})
export class KrnAvatarGroup {
  readonly ariaLabel = input('People');
  readonly overlap = input('0.625rem');
}

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
        border-color var(--krn-motion-fast, 90ms),
        translate var(--krn-motion-fast, 90ms);
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

@Component({
  selector: 'krn-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dl><ng-content /></dl>`,
  styles: `
    dl {
      display: grid;
      grid-template-columns: minmax(7rem, 0.45fr) minmax(0, 1fr);
      gap: 0;
      margin: 0;
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    @container (max-width: 28rem) {
      dl {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class KrnDescriptionList {}

@Component({
  selector: 'krn-description-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dt>{{ term() }}</dt>
    <dd><ng-content /></dd>
  `,
  styles: `
    :host {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: subgrid;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    dt,
    dd {
      margin: 0;
      padding-block: var(--krn-space-3, 0.75rem);
    }
    dt {
      color: var(--krn-color-text-muted, #626a76);
      font-weight: 600;
    }
    dd {
      min-inline-size: 0;
      overflow-wrap: anywhere;
      color: var(--krn-color-text, #252932);
    }
    @container (max-width: 28rem) {
      :host {
        grid-template-columns: 1fr;
      }
      dt {
        padding-block-end: 0.125rem;
      }
      dd {
        padding-block-start: 0;
      }
    }
  `,
})
export class KrnDescriptionItem {
  readonly term = input.required<string>();
}

@Component({
  selector: 'krn-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: grid;
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface, #fff);
    }
  `,
})
export class KrnList {
  readonly role = input<'list' | 'listbox'>('list');
  readonly ariaLabel = input('List');
}

@Component({
  selector: 'krn-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
  template: `
    <ng-content select="[krnListLeading]" />
    <span class="content">
      @if (heading()) {
        <strong>{{ heading() }}</strong>
      }
      <ng-content />
    </span>
    <ng-content select="[krnListTrailing]" />
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--krn-space-3, 0.75rem);
      min-block-size: var(--krn-data-row-size, 2.75rem);
      padding: var(--krn-space-3, 0.75rem) var(--krn-space-4, 1rem);
      color: var(--krn-color-text, #252932);
    }
    :host + :host {
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    :host([data-selected]) {
      box-shadow: inset 3px 0 0 var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    .content {
      display: grid;
      min-inline-size: 0;
      gap: 0.125rem;
      overflow-wrap: anywhere;
    }
  `,
})
export class KrnListItem {
  readonly heading = input('');
  readonly selected = input(false, { transform: booleanAttribute });
}

@Component({
  selector: 'krn-disclosure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details [open]="open()" (toggle)="onToggle($event)">
      <summary>
        <span>{{ heading() }}</span>
        <span class="indicator" aria-hidden="true"></span>
      </summary>
      <div class="panel"><ng-content /></div>
    </details>
  `,
  styles: `
    :host {
      display: block;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    details {
      interpolate-size: allow-keywords;
    }
    summary {
      display: flex;
      min-block-size: var(--krn-control-size, 2.5rem);
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0.375rem;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text, #252932);
      font-weight: 620;
      cursor: pointer;
      list-style: none;
      transition:
        color var(--krn-motion-moderate, 160ms),
        background var(--krn-motion-moderate, 160ms);
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 3px;
    }
    summary:hover {
      background: color-mix(in oklch, var(--krn-color-surface-subtle, #f3f4f6) 74%, transparent);
    }
    .indicator {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: 45deg;
      transition: rotate var(--krn-motion-moderate, 160ms);
    }
    details[open] .indicator {
      rotate: 225deg;
    }
    .panel {
      padding: 0 var(--krn-space-4, 1rem) 1rem;
      color: var(--krn-color-text-muted, #626a76);
    }
    @supports selector(details::details-content) {
      details::details-content {
        block-size: 0;
        overflow: clip;
        opacity: 0;
        transition:
          block-size var(--krn-motion-moderate, 160ms) var(--krn-motion-ease-standard, ease),
          opacity var(--krn-motion-moderate, 160ms) var(--krn-motion-ease-standard, ease);
      }
      details[open]::details-content {
        block-size: auto;
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      summary,
      .indicator,
      details::details-content {
        transition: none;
      }
    }
  `,
})
export class KrnDisclosure {
  readonly heading = input.required<string>();
  readonly open = model(false);

  onToggle(event: Event): void {
    this.open.set((event.currentTarget as HTMLDetailsElement).open);
  }
}

@Component({
  selector: 'krn-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
  `,
})
export class KrnAccordion {
  readonly ariaLabel = input('Accordion');
}

@Component({
  selector: 'krn-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'list',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: grid;
    }
  `,
})
export class KrnTimeline {
  readonly ariaLabel = input('Timeline');
}

@Component({
  selector: 'krn-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
  },
  template: `
    <span class="rail" aria-hidden="true"><i></i></span>
    <div>
      <div class="meta">{{ time() }}</div>
      <strong>{{ heading() }}</strong>
      <div class="body"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: 1rem minmax(0, 1fr);
      gap: 0.75rem;
      min-block-size: 4rem;
      color: var(--krn-color-text, #252932);
    }
    .rail {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .rail::after {
      position: absolute;
      inset-block: 0.75rem 0;
      inline-size: 1px;
      background: var(--krn-color-border, #cdd1d7);
      content: '';
    }
    i {
      position: relative;
      z-index: 1;
      inline-size: 0.625rem;
      block-size: 0.625rem;
      margin-block-start: 0.25rem;
      border: 2px solid var(--krn-color-brand-solid, #4f6feb);
      border-radius: 50%;
      background: var(--krn-color-canvas, #faf9f7);
    }
    .meta {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
    }
    .body {
      margin-block-start: 0.25rem;
      color: var(--krn-color-text-muted, #626a76);
    }
  `,
})
export class KrnTimelineItem {
  readonly heading = input.required<string>();
  readonly time = input('');
}

export interface KrnTreeNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly KrnTreeNode[];
  readonly disabled?: boolean;
}

interface KrnVisibleTreeNode {
  readonly node: KrnTreeNode;
  readonly parent: KrnTreeNode | null;
}

@Component({
  selector: 'krn-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tree',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <ng-container
      [ngTemplateOutlet]="branch"
      [ngTemplateOutletContext]="{ $implicit: nodes(), depth: 0 }"
    />
    <ng-template #branch let-branchNodes let-depth="depth">
      <ul role="group" class="branch" [attr.data-depth]="depth">
        @for (node of branchNodes; track node.id) {
          <li
            role="treeitem"
            [attr.aria-level]="depth + 1"
            [attr.aria-expanded]="node.children?.length ? expanded().has(node.id) : null"
            [attr.aria-selected]="selected() === node.id"
            [attr.aria-disabled]="node.disabled || null"
          >
            <button
              #treeItem
              type="button"
              [disabled]="node.disabled"
              [attr.data-tree-item]="node.id"
              [attr.tabindex]="isTabStop(node) ? 0 : -1"
              (click)="activate(node)"
              (keydown)="onKeydown($event, node)"
            >
              <span
                class="chevron"
                [class.has-children]="node.children?.length"
                [class.expanded]="expanded().has(node.id)"
                aria-hidden="true"
              ></span>
              <span>{{ node.label }}</span>
            </button>
            @if (node.children?.length && expanded().has(node.id)) {
              <ng-container
                [ngTemplateOutlet]="branch"
                [ngTemplateOutletContext]="{ $implicit: node.children, depth: depth + 1 }"
              />
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  styles: `
    :host {
      display: block;
      color: var(--krn-color-text, #252932);
    }
    .branch {
      display: grid;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .branch:not([data-depth='0']) {
      position: relative;
      margin-block: 0.125rem 0.25rem;
      margin-inline-start: 1rem;
      padding-inline-start: 0.875rem;
      border-inline-start: 1px solid
        color-mix(in oklch, var(--krn-color-border, #cdd1d7) 72%, transparent);
    }
    li {
      position: relative;
      min-inline-size: 0;
    }
    .branch:not([data-depth='0']) > li::before {
      position: absolute;
      inset-block-start: 1rem;
      inset-inline-start: -0.875rem;
      inline-size: 0.625rem;
      border-block-start: 1px solid
        color-mix(in oklch, var(--krn-color-border, #cdd1d7) 72%, transparent);
      content: '';
    }
    button {
      display: flex;
      inline-size: 100%;
      min-block-size: 2rem;
      align-items: center;
      gap: 0.5rem;
      padding-inline: 0.5rem;
      border: 0;
      border-inline-start: 2px solid transparent;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    [aria-selected='true'] > button {
      border-inline-start-color: var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
      font-weight: 620;
    }
    button:hover:not(:disabled) {
      background: color-mix(in oklch, var(--krn-color-surface-subtle, #f3f4f6) 74%, transparent);
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 1px;
    }
    .chevron {
      position: relative;
      display: grid;
      inline-size: 1rem;
      block-size: 1rem;
      color: var(--krn-color-text-muted, #626a76);
      place-items: center;
    }
    .chevron.has-children::before {
      inline-size: 0.4rem;
      block-size: 0.4rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: -45deg;
      transition: rotate var(--krn-motion-moderate, 160ms);
      content: '';
    }
    .chevron.expanded::before {
      rotate: 45deg;
    }
    @media (prefers-reduced-motion: reduce) {
      .chevron.has-children::before {
        transition: none;
      }
    }
  `,
})
export class KrnTree {
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('treeItem');
  readonly nodes = input<readonly KrnTreeNode[]>([]);
  readonly ariaLabel = input('Tree');
  readonly selected = model('');
  readonly expanded = model<ReadonlySet<string>>(new Set<string>());
  private readonly visibleNodes = computed<readonly KrnVisibleTreeNode[]>(() => {
    const result: KrnVisibleTreeNode[] = [];
    const visit = (nodes: readonly KrnTreeNode[], parent: KrnTreeNode | null): void => {
      for (const node of nodes) {
        result.push({ node, parent });
        if (node.children?.length && this.expanded().has(node.id)) {
          visit(node.children, node);
        }
      }
    };
    visit(this.nodes(), null);
    return result;
  });
  private readonly focusableNodes = computed(() =>
    this.visibleNodes().filter(({ node }) => !node.disabled),
  );

  activate(node: KrnTreeNode): void {
    if (node.disabled) return;
    this.selected.set(node.id);
    if (node.children?.length) this.toggle(node.id);
  }

  protected isTabStop(node: KrnTreeNode): boolean {
    const focusable = this.focusableNodes();
    const selected = focusable.find(({ node: candidate }) => candidate.id === this.selected());
    return (selected ?? focusable[0])?.node.id === node.id;
  }

  onKeydown(event: KeyboardEvent, node: KrnTreeNode): void {
    if (node.disabled) return;

    if (event.key === 'ArrowRight' && node.children?.length) {
      event.preventDefault();
      if (!this.expanded().has(node.id)) {
        this.toggle(node.id);
      } else {
        this.focusNode(this.firstFocusableVisibleDescendant(node));
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      const expanded = Boolean(node.children?.length && this.expanded().has(node.id));
      const parent = expanded ? null : this.enabledParent(node.id);
      if (!expanded && !parent) return;
      event.preventDefault();
      if (expanded) {
        this.toggle(node.id);
      } else {
        this.focusNode(parent);
      }
      return;
    }

    const focusable = this.focusableNodes();
    const current = focusable.findIndex(({ node: candidate }) => candidate.id === node.id);
    if (current < 0) return;
    const target =
      event.key === 'Home'
        ? focusable[0]
        : event.key === 'End'
          ? focusable.at(-1)
          : event.key === 'ArrowDown'
            ? focusable[current + 1]
            : event.key === 'ArrowUp'
              ? focusable[current - 1]
              : undefined;
    if (!['Home', 'End', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    this.focusNode(target?.node);
  }

  private toggle(id: string): void {
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  private firstFocusableVisibleDescendant(node: KrnTreeNode): KrnTreeNode | null {
    for (const child of node.children ?? []) {
      if (!child.disabled) return child;
      if (child.children?.length && this.expanded().has(child.id)) {
        const descendant = this.firstFocusableVisibleDescendant(child);
        if (descendant) return descendant;
      }
    }
    return null;
  }

  private enabledParent(id: string): KrnTreeNode | null {
    let parent = this.visibleNodes().find(({ node }) => node.id === id)?.parent ?? null;
    while (parent?.disabled) {
      parent = this.visibleNodes().find(({ node }) => node.id === parent?.id)?.parent ?? null;
    }
    return parent;
  }

  private focusNode(node?: KrnTreeNode | null): void {
    if (!node || node.disabled) return;
    this.selected.set(node.id);
    this.elements()
      .find(({ nativeElement }) => nativeElement.dataset['treeItem'] === node.id)
      ?.nativeElement.focus();
  }
}

type KrnCodeTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'literal'
  | 'number'
  | 'decorator'
  | 'tag'
  | 'attribute'
  | 'type'
  | 'operator'
  | 'punctuation';

interface KrnCodeToken {
  readonly value: string;
  readonly kind: KrnCodeTokenKind;
}

const codeKeywords = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'constructor',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'get',
  'if',
  'implements',
  'import',
  'in',
  'infer',
  'interface',
  'keyof',
  'let',
  'new',
  'of',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'satisfies',
  'set',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'type',
  'typeof',
  'undefined',
  'using',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

const codeTokenPattern =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`|<\/?[A-Za-z][\w.-]*|(?:\[\(|\[\*|\[|\(|#)[A-Za-z_][\w.-]*(?:\)\]|\]|\))(?=\s*=)|@[A-Za-z_$][\w$]*|\b[A-Za-z_$][\w$]*\b|\b\d+(?:\.\d+)?\b|=>|===?|!==?|&&|\|\||\?\?|[+\-*/%<>!&|?=]+|[{}()[\],.;:])/gm;

function highlightCode(source: string, language: string): readonly KrnCodeToken[] {
  const normalizedLanguage = language.toLowerCase();
  if (!/(?:angular|html|typescript|ts|javascript|js|tsx|jsx)/.test(normalizedLanguage)) {
    return [{ value: source, kind: 'plain' }];
  }

  const tokens: KrnCodeToken[] = [];
  let cursor = 0;
  for (const match of source.matchAll(codeTokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ value: source.slice(cursor, index), kind: 'plain' });
    const value = match[0];
    tokens.push({ value, kind: codeTokenKind(value) });
    cursor = index + value.length;
  }
  if (cursor < source.length) tokens.push({ value: source.slice(cursor), kind: 'plain' });
  return tokens;
}

function codeTokenKind(value: string): KrnCodeTokenKind {
  if (/^(?:\/[/*]|<!--)/.test(value)) return 'comment';
  if (/^['"`]/.test(value)) return 'string';
  if (/^<\/?[A-Za-z]/.test(value)) return 'tag';
  if (/^@/.test(value)) return 'decorator';
  if (/^(?:\[\(|\[\*|\[|\(|#).+(?:\)\]|\]|\))$/.test(value)) return 'attribute';
  if (/^\d/.test(value)) return 'number';
  if (/^(?:true|false|null|undefined|NaN)$/.test(value)) return 'literal';
  if (codeKeywords.has(value)) return 'keyword';
  if (/^[A-Z][\w$]*$/.test(value)) return 'type';
  if (/^(?:=>|===?|!==?|&&|\|\||\?\?|[+\-*/%<>!&|?=]+)$/.test(value)) return 'operator';
  if (/^[{}()[\],.;:]$/.test(value)) return 'punctuation';
  return 'plain';
}

@Component({
  selector: 'krn-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <span>{{ language() }}</span>
      <button type="button" (click)="copy()" [attr.aria-label]="'Copy ' + language() + ' code'">
        {{ copied() ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <pre
      tabindex="0"
    ><code>@for (token of highlightedTokens(); track $index) {<span [class]="'token token-' + token.kind">{{ token.value }}</span>}</code></pre>
    <span class="sr-only" aria-live="polite">{{ copied() ? 'Code copied to clipboard' : '' }}</span>
  `,
  styles: `
    :host {
      --_code-surface: var(--krn-color-surface-sunken, #f5f5f6);
      --_code-header: var(--krn-color-surface-subtle, #fafafa);
      --_code-border: var(--krn-color-border, #dedee2);
      --_code-text: var(--krn-color-text, #1d1d1f);
      --_code-muted: var(--krn-color-text-muted, #66666d);
      --_code-action: var(--krn-color-link, #3154c8);
      --_code-action-hover: var(--krn-color-surface-raised, #fff);
      --_syntax-comment: var(--krn-color-text-muted, #66666d);
      --_syntax-string: var(--krn-color-success, #207a4b);
      --_syntax-keyword: var(--krn-color-primary, #3154c8);
      --_syntax-literal: var(--krn-color-warning, #7b5511);
      --_syntax-number: var(--krn-color-warning, #7b5511);
      --_syntax-decorator: var(--krn-color-danger, #a42f46);
      --_syntax-tag: var(--krn-color-danger, #a42f46);
      --_syntax-attribute: var(--krn-color-primary, #3154c8);
      --_syntax-type: var(--krn-color-info, #275ca8);
      --_syntax-operator: var(--krn-color-text-muted, #66666d);
      display: block;
      min-inline-size: 0;
      max-inline-size: 100%;
      overflow: clip;
      border: var(--krn-border-width-1, 1px) solid var(--_code-border);
      border-radius: var(--krn-radius-surface, 0.75rem);
      color: var(--_code-text);
      background: var(--_code-surface);
      box-shadow: var(--krn-shadow-sm, 0 1px 3px rgb(0 0 0 / 10%));
    }
    .bar {
      display: flex;
      min-block-size: 2.5rem;
      align-items: center;
      justify-content: space-between;
      padding-inline: 0.875rem;
      border-block-end: var(--krn-border-width-1, 1px) solid var(--_code-border);
      color: var(--_code-muted);
      background: var(--_code-header);
      font:
        550 0.75rem/1 var(--krn-font-family-mono, ui-monospace),
        monospace;
    }
    button {
      min-block-size: 1.75rem;
      padding-inline: 0.5rem;
      border: 0;
      border-radius: 0.3125rem;
      color: var(--_code-action);
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      color: var(--krn-color-primary-hover, var(--_code-action));
      background: var(--_code-action-hover);
    }
    button:focus-visible,
    pre:focus-visible {
      outline: var(--krn-focus-ring-width, 2px) solid var(--krn-color-focus, #3154c8);
      outline-offset: -3px;
    }
    pre {
      max-block-size: var(--krn-code-max-height, 28rem);
      margin: 0;
      padding: 1.125rem;
      overflow: auto;
      font:
        0.8125rem/1.65 var(--krn-font-family-mono, ui-monospace),
        SFMono-Regular,
        Consolas,
        monospace;
      font-variant-ligatures: none;
      tab-size: 2;
    }
    code {
      white-space: pre;
    }
    .token-comment {
      color: var(--_syntax-comment);
      font-style: italic;
    }
    .token-string {
      color: var(--_syntax-string);
    }
    .token-keyword {
      color: var(--_syntax-keyword);
    }
    .token-literal {
      color: var(--_syntax-literal);
    }
    .token-number {
      color: var(--_syntax-number);
    }
    .token-decorator {
      color: var(--_syntax-decorator);
    }
    .token-tag {
      color: var(--_syntax-tag);
    }
    .token-attribute {
      color: var(--_syntax-attribute);
    }
    .token-type {
      color: var(--_syntax-type);
    }
    .token-operator,
    .token-punctuation {
      color: var(--_syntax-operator);
    }
    ::selection {
      color: var(--_code-text);
      background: var(--krn-color-selection, rgb(49 84 200 / 24%));
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class KrnCodeBlock {
  private readonly clipboard = inject(Clipboard);
  readonly code = input.required<string>();
  readonly language = input('text');
  readonly copied = model(false);
  readonly highlightedTokens = computed(() => highlightCode(this.code(), this.language()));

  copy(): void {
    if (!this.clipboard.copy(this.code())) return;
    this.copied.set(true);
  }
}

@Component({
  selector: 'krn-keyboard-shortcut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'label()',
  },
  template: `
    @for (key of keys(); track $index) {
      <kbd>{{ key }}</kbd>
      @if (!$last) {
        <span aria-hidden="true">+</span>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.6875rem;
    }
    kbd {
      min-inline-size: 1.375rem;
      padding: 0.125rem 0.3125rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-block-end-width: 2px;
      border-radius: 0.25rem;
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface-raised, #f2f3f5);
      font:
        600 0.6875rem/1rem ui-monospace,
        monospace;
      text-align: center;
    }
  `,
})
export class KrnKeyboardShortcut {
  readonly keys = input.required<readonly string[]>();
  readonly label = computed(() => this.keys().join(' plus '));
}

@Component({
  selector: 'krn-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'meter',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemin]': 'safeMin()',
    '[attr.aria-valuemax]': 'safeMax()',
    '[attr.aria-valuenow]': 'safeValue()',
    '[attr.aria-valuetext]': 'displayValue()',
    '[attr.data-tone]': 'meterTone()',
  },
  template: `
    <div class="labels">
      <span>{{ label() }}</span>
      <strong>{{ displayValue() }}</strong>
    </div>
    <span class="track" aria-hidden="true">
      <span class="fill" [style.inline-size.%]="percentage()"></span>
    </span>
  `,
  styles: `
    :host {
      --_meter-color: var(--krn-color-primary, #4f6feb);
      display: grid;
      gap: 0.5rem;
    }
    :host([data-tone='success']) {
      --_meter-color: var(--krn-color-success, #18724b);
    }
    :host([data-tone='warning']) {
      --_meter-color: var(--krn-color-warning, #946200);
    }
    :host([data-tone='danger']) {
      --_meter-color: var(--krn-color-danger, #b6293d);
    }
    .labels {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.8125rem;
    }
    strong {
      color: var(--krn-color-text, #252932);
      font-variant-numeric: tabular-nums;
    }
    .track {
      display: block;
      block-size: 0.625rem;
      overflow: hidden;
      border: 1px solid var(--krn-color-border, #d8dbe0);
      border-radius: var(--krn-radius-full, 999px);
      background: var(--krn-color-surface-sunken, #eef0f2);
    }
    .fill {
      display: block;
      block-size: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        color-mix(in oklch, var(--_meter-color) 78%, white),
        var(--_meter-color)
      );
      box-shadow: 0 0 0.65rem color-mix(in oklch, var(--_meter-color) 24%, transparent);
      transition:
        inline-size 360ms var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1)),
        background 220ms var(--krn-motion-ease-standard, ease);
    }
    @media (prefers-reduced-motion: reduce) {
      .fill {
        transition: none;
      }
    }
  `,
})
export class KrnMeter {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input(100);
  readonly low = input(25);
  readonly high = input(75);
  readonly optimum = input(100);
  readonly safeMin = computed(() => Math.min(this.min(), this.max()));
  readonly safeMax = computed(() => Math.max(this.min() + 1, this.max()));
  readonly safeValue = computed(() =>
    Math.min(this.safeMax(), Math.max(this.safeMin(), this.value())),
  );
  readonly percentage = computed(
    () => ((this.safeValue() - this.safeMin()) / (this.safeMax() - this.safeMin())) * 100,
  );
  readonly displayValue = computed(() => `${Math.round(this.percentage())}%`);
  readonly meterTone = computed<'success' | 'warning' | 'danger'>(() => {
    const value = this.safeValue();
    if (this.optimum() <= this.low()) {
      return value <= this.low() ? 'success' : value <= this.high() ? 'warning' : 'danger';
    }
    if (this.optimum() >= this.high()) {
      return value >= this.high() ? 'success' : value >= this.low() ? 'warning' : 'danger';
    }
    return value >= this.low() && value <= this.high() ? 'success' : 'warning';
  });
}

@Component({
  selector: 'krn-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-readonly]': 'readonly()',
  },
  template: `
    @for (item of items(); track item) {
      <button
        #ratingItem
        type="button"
        role="radio"
        [attr.aria-checked]="item === value()"
        [attr.aria-label]="item + ' of ' + max()"
        [attr.data-rating-item]="item"
        [attr.tabindex]="item === value() || (!value() && item === 1) ? 0 : -1"
        [disabled]="disabled()"
        (click)="setValue(item)"
        (keydown)="onKeydown($event)"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          [attr.data-filled]="item <= value() ? '' : null"
        >
          <path
            d="m12 3.75 2.45 4.96 5.47.8-3.96 3.85.94 5.45L12 16.23 7.1 18.8l.94-5.45-3.96-3.85 5.47-.8L12 3.75Z"
          />
        </svg>
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      gap: 0.125rem;
    }
    button {
      --_rating-color: oklch(66% 0.16 76);
      display: grid;
      inline-size: 2rem;
      block-size: 2rem;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--_rating-color);
      background: transparent;
      cursor: pointer;
      transition:
        background var(--krn-motion-duration-fast, 90ms),
        transform var(--krn-motion-duration-fast, 90ms);
    }
    svg {
      inline-size: 1.25rem;
      block-size: 1.25rem;
      overflow: visible;
    }
    path {
      fill: color-mix(in oklch, var(--krn-color-surface, #fff) 90%, var(--_rating-color));
      stroke: color-mix(in oklch, var(--_rating-color) 64%, var(--krn-color-text-muted, #626a76));
      stroke-linejoin: round;
      stroke-width: 1.45;
      transition:
        fill var(--krn-motion-duration-fast, 90ms),
        stroke var(--krn-motion-duration-fast, 90ms);
    }
    svg[data-filled] path {
      fill: var(--_rating-color);
      stroke: color-mix(in oklch, var(--_rating-color) 84%, var(--krn-color-text, #252932));
    }
    button:hover {
      background: color-mix(in oklch, var(--_rating-color) 10%, transparent);
      transform: translateY(-1px);
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 1px;
    }
    button:disabled {
      opacity: var(--krn-opacity-disabled, 0.48);
      cursor: not-allowed;
    }
  `,
})
export class KrnRating {
  private readonly ratingItems = viewChildren<ElementRef<HTMLButtonElement>>('ratingItem');
  readonly value = model(0);
  readonly max = input(5);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('Rating');
  readonly items = computed(() =>
    Array.from({ length: Math.max(1, this.max()) }, (_, index) => index + 1),
  );

  setValue(value: number): void {
    if (!this.disabled() && !this.readonly()) this.value.set(value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readonly()) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      const value = Math.min(this.max(), this.value() + 1);
      this.value.set(value);
      this.focusValue(value);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      const value = Math.max(1, this.value() - 1);
      this.value.set(value);
      this.focusValue(value);
    }
  }

  private focusValue(value: number): void {
    this.ratingItems()[value - 1]?.nativeElement.focus();
  }
}

@Component({
  selector: 'krn-responsive-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.aspect-ratio]': 'aspectRatio()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      position: relative;
      display: block;
      min-inline-size: 0;
      overflow: clip;
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface-raised, #f2f3f5);
    }
    :host ::ng-deep :is(img, video, iframe, svg) {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      object-fit: var(--krn-media-fit, cover);
    }
  `,
})
export class KrnResponsiveMedia {
  readonly aspectRatio = input('16 / 9');
}
