import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import type { KrnToastOptions, KrnToastPosition, KrnToastRecord } from './feedback.types';

let nextToastId = 0;
const toastExitDuration = 160;

interface KrnToastGroup {
  readonly key: string;
  readonly toast: KrnToastRecord;
  readonly ids: readonly string[];
  readonly count: number;
}

@Injectable({ providedIn: 'root' })
export class KrnToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly records = signal<readonly KrnToastRecord[]>([]);
  private readonly exiting = signal<ReadonlySet<string>>(new Set<string>());
  private readonly autoTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly exitTimers = new Map<string, ReturnType<typeof setTimeout>>();
  readonly toasts = this.records.asReadonly();
  readonly exitingIds = this.exiting.asReadonly();

  show(message: string, options: KrnToastOptions = {}): string {
    const id = `krn-toast-${++nextToastId}`;
    const record: KrnToastRecord = {
      id,
      message,
      title: options.title,
      tone: options.tone ?? 'neutral',
      duration: options.duration ?? 5000,
      dismissible: options.dismissible ?? true,
      actionLabel: options.actionLabel,
      action: options.action,
      createdAt: Date.now(),
    };
    this.records.update((records) => [...records, record]);
    if ((record.duration ?? 0) > 0 && isPlatformBrowser(this.platformId)) {
      this.autoTimers.set(
        id,
        setTimeout(() => this.dismiss(id), record.duration),
      );
    }
    return id;
  }

  success(message: string, options: Omit<KrnToastOptions, 'tone'> = {}): string {
    return this.show(message, { ...options, tone: 'success' });
  }

  error(message: string, options: Omit<KrnToastOptions, 'tone'> = {}): string {
    return this.show(message, { ...options, tone: 'danger', duration: options.duration ?? 0 });
  }

  dismiss(id: string): void {
    this.dismissMany([id]);
  }

  dismissMany(ids: readonly string[]): void {
    const existingIds = new Set(this.records().map((record) => record.id));
    const targets = [...new Set(ids)].filter((id) => existingIds.has(id));
    if (!targets.length) return;

    targets.forEach((id) => {
      const timer = this.autoTimers.get(id);
      if (timer) clearTimeout(timer);
      this.autoTimers.delete(id);
    });

    if (!this.shouldAnimate()) {
      this.remove(targets);
      return;
    }

    this.exiting.update((current) => {
      const next = new Set(current);
      targets.forEach((id) => next.add(id));
      return next;
    });
    targets.forEach((id) => {
      if (this.exitTimers.has(id)) return;
      this.exitTimers.set(
        id,
        setTimeout(() => this.remove([id]), toastExitDuration),
      );
    });
  }

  dismissAll(): void {
    this.dismissMany(this.records().map((record) => record.id));
  }

  act(record: KrnToastRecord): void {
    record.action?.();
    this.dismiss(record.id);
  }

  actGroup(record: KrnToastRecord, ids: readonly string[]): void {
    record.action?.();
    this.dismissMany(ids);
  }

  isLeaving(id: string): boolean {
    return this.exiting().has(id);
  }

  private remove(ids: readonly string[]): void {
    const targets = new Set(ids);
    ids.forEach((id) => {
      const autoTimer = this.autoTimers.get(id);
      if (autoTimer) clearTimeout(autoTimer);
      this.autoTimers.delete(id);
      const exitTimer = this.exitTimers.get(id);
      if (exitTimer) clearTimeout(exitTimer);
      this.exitTimers.delete(id);
    });
    this.exiting.update((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    this.records.update((records) => records.filter((record) => !targets.has(record.id)));
  }

  private shouldAnimate(): boolean {
    if (!isPlatformBrowser(this.platformId) || typeof window.matchMedia !== 'function')
      return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

@Component({
  selector: 'krn-toast, krn-toast-viewport, krn-snackbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    '[attr.data-position]': 'position()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    @if (totalToasts() > 1) {
      <div class="stack-controls">
        <span>
          <strong>{{ totalToasts() }}</strong>
          {{ totalToasts() === 1 ? 'notification' : 'notifications' }}
        </span>
        <span class="stack-actions">
          @if (hasOverflow()) {
            <button
              type="button"
              class="review"
              [attr.aria-expanded]="expanded()"
              (click)="expanded.update(toggle)"
            >
              {{ expanded() ? 'Show recent' : 'Review ' + hiddenToastCount() + ' earlier' }}
            </button>
          }
          <button type="button" class="clear" (click)="service.dismissAll()">Clear all</button>
        </span>
      </div>
    }

    @for (group of visibleGroups(); track group.ids[0]; let index = $index) {
      <article
        class="toast"
        [attr.data-tone]="group.toast.tone"
        [attr.data-leaving]="groupLeaving(group) ? '' : null"
        [style.--_stack-index]="index"
        [attr.role]="group.toast.tone === 'danger' ? 'alert' : 'status'"
        [attr.aria-atomic]="true"
      >
        <span class="indicator" aria-hidden="true">{{ toneIcon(group.toast) }}</span>
        <div class="copy">
          <span class="title-row">
            @if (group.toast.title) {
              <strong>{{ group.toast.title }}</strong>
            }
            @if (group.count > 1) {
              <span class="count" [attr.aria-label]="group.count + ' identical notifications'">
                ×{{ group.count }}
              </span>
            }
          </span>
          <p>{{ group.toast.message }}</p>
        </div>
        @if (group.toast.actionLabel) {
          <button type="button" class="action" (click)="service.actGroup(group.toast, group.ids)">
            {{ group.toast.actionLabel }}
          </button>
        }
        @if (group.toast.dismissible) {
          <button
            type="button"
            class="dismiss"
            [attr.aria-label]="
              group.count > 1
                ? 'Dismiss ' + group.count + ' identical notifications'
                : 'Dismiss notification'
            "
            (click)="service.dismissMany(group.ids)"
          >
            <span aria-hidden="true">×</span>
          </button>
        }
      </article>
    }

    @if (hiddenToastCount() > 0 && expanded()) {
      <p class="limit-note" role="status">
        Showing the latest {{ visibleToastCount() }} of {{ totalToasts() }} notifications.
      </p>
    }
  `,
  styles: `
    :host {
      position: fixed;
      z-index: var(--krn-z-toast, 900);
      inset-block-start: var(--krn-space-4, 1rem);
      inset-inline-end: var(--krn-space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--krn-space-2, 0.5rem);
      inline-size: min(26rem, calc(100vw - var(--krn-space-8, 2rem)));
      pointer-events: none;
    }
    :host([data-position^='bottom']) {
      inset-block: auto var(--krn-space-4, 1rem);
    }
    :host([data-position$='start']) {
      inset-inline: var(--krn-space-4, 1rem) auto;
    }
    :host([data-position$='center']) {
      inset-inline-start: 50%;
      inset-inline-end: auto;
      transform: translateX(-50%);
    }
    .stack-controls,
    .limit-note {
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-md, 0.5rem);
      color: var(--krn-color-text-muted, #626a76);
      background: color-mix(in oklch, var(--krn-color-surface-raised, #fff) 94%, transparent);
      box-shadow: var(--krn-shadow-sm, 0 8px 22px rgb(0 0 0 / 12%));
      font: var(--krn-font-body-sm, 500 0.8125rem/1.25rem sans-serif);
      pointer-events: auto;
      backdrop-filter: blur(12px);
    }
    .stack-controls {
      display: flex;
      min-block-size: 2.5rem;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.375rem 0.4375rem 0.375rem 0.75rem;
    }
    .stack-controls > span:first-child {
      white-space: nowrap;
    }
    .stack-controls strong {
      color: var(--krn-color-text, #252932);
      font-variant-numeric: tabular-nums;
    }
    .stack-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .stack-controls button {
      min-block-size: 1.75rem;
      padding-inline: 0.5rem;
      border: 0;
      border-radius: var(--krn-radius-sm, 0.375rem);
      color: var(--krn-color-text-muted, #626a76);
      background: transparent;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .stack-controls button:hover {
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface-subtle, #f2f3f5);
    }
    .stack-controls .clear {
      color: var(--krn-color-danger-text, #a02d2d);
    }
    .toast {
      --_tone: var(--krn-color-text-muted, #626a76);
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      align-items: start;
      gap: var(--krn-space-3, 0.75rem);
      min-block-size: 4rem;
      padding: var(--krn-space-3, 0.75rem);
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-inline-start: 3px solid var(--_tone);
      border-radius: var(--krn-radius-lg, 0.75rem);
      box-shadow: var(--krn-shadow-overlay, 0 18px 44px rgb(0 0 0 / 18%));
      color: var(--krn-color-text, #252932);
      background: color-mix(in oklch, var(--krn-color-surface-raised, #fff) 96%, transparent);
      pointer-events: auto;
      backdrop-filter: blur(14px);
      transform-origin: top right;
    }
    .toast[data-tone='info'] {
      --_tone: var(--krn-color-info, #245ea7);
    }
    .toast[data-tone='success'] {
      --_tone: var(--krn-color-success, #176b49);
    }
    .toast[data-tone='warning'] {
      --_tone: var(--krn-color-warning, #725400);
    }
    .toast[data-tone='danger'] {
      --_tone: var(--krn-color-danger, #a02d2d);
    }
    .indicator {
      display: grid;
      inline-size: 1.75rem;
      block-size: 1.75rem;
      border-radius: 50%;
      place-items: center;
      color: var(--_tone);
      background: color-mix(in oklch, var(--_tone) 13%, transparent);
      box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--_tone) 22%, transparent);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .copy {
      display: grid;
      min-inline-size: 0;
      gap: 0.1875rem;
      padding-block: 0.1875rem;
    }
    .title-row {
      display: flex;
      min-inline-size: 0;
      align-items: center;
      gap: 0.4375rem;
    }
    .title-row strong {
      overflow: hidden;
      font-weight: 650;
      line-height: 1.25;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count {
      display: inline-grid;
      min-inline-size: 1.5rem;
      min-block-size: 1.25rem;
      flex: 0 0 auto;
      place-items: center;
      padding-inline: 0.3125rem;
      border-radius: var(--krn-radius-full, 9999px);
      color: var(--_tone);
      background: color-mix(in oklch, var(--_tone) 12%, transparent);
      font-size: 0.6875rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    p {
      margin: 0;
    }
    .copy p {
      color: var(--krn-color-text-muted, #626a76);
      line-height: var(--krn-line-height-body, 1.5);
      overflow-wrap: anywhere;
    }
    .action,
    .dismiss {
      min-block-size: 1.75rem;
      border: 0;
      border-radius: var(--krn-radius-sm, 0.375rem);
      color: var(--krn-color-text-muted, #626a76);
      background: transparent;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .action {
      padding-inline: 0.5rem;
      color: var(--_tone);
    }
    .dismiss {
      display: grid;
      inline-size: 1.75rem;
      padding: 0;
      place-items: center;
      font-size: 1.125rem;
      line-height: 1;
    }
    :is(.action, .dismiss):hover {
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface-subtle, #f2f3f5);
    }
    :is(button):focus-visible {
      outline: var(--krn-focus-ring-width, 2px) solid var(--krn-color-focus, #4f6feb);
      outline-offset: var(--krn-focus-ring-offset, 2px);
    }
    .limit-note {
      padding: 0.5rem 0.75rem;
      text-align: center;
    }
    @media (prefers-reduced-motion: no-preference) {
      .toast {
        animation: krn-toast-enter var(--krn-motion-duration-slow, 240ms)
          var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1));
      }
      .toast[data-leaving] {
        pointer-events: none;
        animation: krn-toast-exit ${toastExitDuration}ms
          var(--krn-motion-ease-exit, cubic-bezier(0.7, 0, 0.84, 0)) forwards;
      }
    }
    @keyframes krn-toast-enter {
      from {
        opacity: 0;
        transform: translate3d(0.75rem, -0.375rem, 0) scale(0.975);
      }
    }
    @keyframes krn-toast-exit {
      to {
        opacity: 0;
        transform: translate3d(0.75rem, 0, 0) scale(0.975);
      }
    }
    @media (max-width: 35rem) {
      :host {
        inset-inline: var(--krn-space-2, 0.5rem);
        inline-size: auto;
        transform: none;
      }
      .stack-controls {
        align-items: start;
      }
      .stack-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .toast {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }
      .action {
        grid-column: 2;
      }
      .dismiss {
        grid-column: 3;
        grid-row: 1;
      }
    }
    @media (forced-colors: active) {
      .stack-controls,
      .toast,
      .limit-note {
        border-color: CanvasText;
        color: CanvasText;
        background: Canvas;
        box-shadow: none;
        backdrop-filter: none;
      }
      .toast {
        border-inline-start-color: Highlight;
      }
      .indicator,
      .count {
        color: CanvasText;
        background: Canvas;
        box-shadow: inset 0 0 0 1px CanvasText;
      }
    }
  `,
})
export class KrnToastViewport {
  readonly service = inject(KrnToastService);
  readonly position = input<KrnToastPosition>('top-end');
  readonly maxVisible = input(4);
  readonly maxExpanded = input(12);
  readonly ariaLabel = input('Notifications');
  readonly expanded = model(false);
  protected readonly Math = Math;
  protected readonly toggle = (value: boolean): boolean => !value;
  protected readonly groupedToasts = computed<readonly KrnToastGroup[]>(() => {
    const groups: KrnToastGroup[] = [];
    for (const toast of this.service.toasts()) {
      const key = toastGroupKey(toast);
      const previous = groups.at(-1);
      if (previous?.key === key) {
        groups[groups.length - 1] = {
          key,
          toast,
          ids: [...previous.ids, toast.id],
          count: previous.count + 1,
        };
      } else {
        groups.push({ key, toast, ids: [toast.id], count: 1 });
      }
    }
    return groups;
  });
  protected readonly totalToasts = computed(() => this.service.toasts().length);
  protected readonly hasOverflow = computed(
    () => this.groupedToasts().length > Math.max(1, this.maxVisible()),
  );
  protected readonly visibleGroups = computed(() => {
    const normalLimit = Math.max(1, this.maxVisible());
    const expandedLimit = Math.max(normalLimit, this.maxExpanded());
    return this.groupedToasts().slice(-(this.expanded() ? expandedLimit : normalLimit));
  });
  protected readonly visibleToastCount = computed(() =>
    this.visibleGroups().reduce((sum, group) => sum + group.count, 0),
  );
  protected readonly hiddenToastCount = computed(
    () => this.totalToasts() - this.visibleToastCount(),
  );

  protected groupLeaving(group: KrnToastGroup): boolean {
    return group.ids.every((id) => this.service.isLeaving(id));
  }

  protected toneIcon(toast: KrnToastRecord): string {
    return { neutral: '•', info: 'i', success: '✓', warning: '!', danger: '!' }[
      toast.tone ?? 'neutral'
    ];
  }
}

export { KrnToastViewport as KrnSnackbar, KrnToastViewport as KrnToast };

function toastGroupKey(toast: KrnToastRecord): string {
  return JSON.stringify([
    toast.title ?? '',
    toast.message,
    toast.tone ?? 'neutral',
    toast.actionLabel ?? '',
    toast.dismissible ?? true,
    toast.action ? toast.id : '',
  ]);
}
