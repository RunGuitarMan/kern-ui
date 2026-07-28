import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injectable,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import {
  KRN_PLATFORM,
  KrnIdService,
  krnIsNode,
  krnPrefersReducedMotion,
  type KrnScheduledHandle,
} from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnToastTranslations } from '@kern-ui/angular/core';
import type {
  KrnToastOptions,
  KrnToastPauseReason,
  KrnToastPosition,
  KrnToastRecord,
} from './feedback.types';

const toastExitDuration = 160;

interface ToastTimer {
  handle: KrnScheduledHandle | null;
  remaining: number;
  startedAt: number;
}

@Injectable({ providedIn: 'root' })
export class KrnToastService {
  private readonly ids = inject(KrnIdService);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly destroyRef = inject(DestroyRef);
  private readonly records = signal<readonly KrnToastRecord[]>([]);
  private readonly exiting = signal<ReadonlySet<string>>(new Set<string>());
  private readonly autoTimers = new Map<string, ToastTimer>();
  private readonly exitTimers = new Map<string, KrnScheduledHandle>();
  private readonly pauseReasons = new Map<string, Set<KrnToastPauseReason>>();
  readonly toasts = this.records.asReadonly();
  readonly exitingIds = this.exiting.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.autoTimers.values()) {
        this.platform.cancelScheduled(timer.handle);
      }
      for (const timer of this.exitTimers.values()) this.platform.cancelScheduled(timer);
      this.autoTimers.clear();
      this.exitTimers.clear();
      this.pauseReasons.clear();
    });
  }

  show(message: string, options: KrnToastOptions = {}): string {
    const id = this.ids.next('toast');
    const record: KrnToastRecord = {
      id,
      message,
      title: options.title,
      tone: options.tone ?? 'neutral',
      duration: options.duration ?? (options.actionLabel || options.action ? 0 : 5000),
      dismissible: options.dismissible ?? true,
      actionLabel: options.actionLabel,
      action: options.action,
      createdAt: this.platform.now(),
    };
    this.records.update((records) => [...records, record]);
    if ((record.duration ?? 0) > 0 && this.platform.isBrowser) {
      this.autoTimers.set(id, {
        handle: null,
        remaining: record.duration ?? 0,
        startedAt: 0,
      });
      this.startAutoTimer(id);
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
      if (timer) this.platform.cancelScheduled(timer.handle);
      this.autoTimers.delete(id);
      this.pauseReasons.delete(id);
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
      const handle = this.platform.schedule(() => this.remove([id]), toastExitDuration);
      if (handle === null) this.remove([id]);
      else this.exitTimers.set(id, handle);
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

  pause(id: string, reason: KrnToastPauseReason): void {
    const timer = this.autoTimers.get(id);
    if (!timer || this.isLeaving(id)) return;
    const reasons = this.pauseReasons.get(id) ?? new Set<KrnToastPauseReason>();
    if (reasons.has(reason)) return;
    reasons.add(reason);
    this.pauseReasons.set(id, reasons);
    if (timer.handle === null) return;

    this.platform.cancelScheduled(timer.handle);
    timer.remaining = Math.max(0, timer.remaining - (this.platform.now() - timer.startedAt));
    timer.handle = null;
  }

  resume(id: string, reason: KrnToastPauseReason): void {
    const reasons = this.pauseReasons.get(id);
    if (reasons) {
      reasons.delete(reason);
      if (!reasons.size) this.pauseReasons.delete(id);
    }
    if (this.pauseReasons.has(id) || this.isLeaving(id)) return;
    this.startAutoTimer(id);
  }

  private remove(ids: readonly string[]): void {
    const targets = new Set(ids);
    ids.forEach((id) => {
      const autoTimer = this.autoTimers.get(id);
      if (autoTimer) this.platform.cancelScheduled(autoTimer.handle);
      this.autoTimers.delete(id);
      this.pauseReasons.delete(id);
      const exitTimer = this.exitTimers.get(id);
      this.platform.cancelScheduled(exitTimer ?? null);
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
    return !krnPrefersReducedMotion(this.platform);
  }

  private startAutoTimer(id: string): void {
    const timer = this.autoTimers.get(id);
    if (!timer || timer.handle !== null || this.pauseReasons.has(id)) return;
    if (timer.remaining <= 0) {
      this.dismiss(id);
      return;
    }
    timer.startedAt = this.platform.now();
    timer.handle = this.platform.schedule(() => {
      timer.handle = null;
      timer.remaining = 0;
      this.dismiss(id);
    }, timer.remaining);
  }
}

@Component({
  selector: 'krn-toast, krn-toast-viewport, krn-snackbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    '[attr.data-position]': 'position()',
    '[attr.aria-label]': 'copy().ariaLabel',
  },
  template: `
    @if (totalToasts() > 1) {
      <div class="stack-controls">
        <span>
          <strong>{{ totalToasts() }}</strong>
          {{ copy().countLabel(totalToasts()) }}
        </span>
        <span class="stack-actions">
          @if (hasOverflow()) {
            <button
              type="button"
              class="review"
              [attr.aria-expanded]="expanded()"
              (click)="expanded.update(toggle)"
            >
              {{ expanded() ? copy().showRecent : copy().reviewEarlier(hiddenToastCount()) }}
            </button>
          }
          <button type="button" class="clear" (click)="service.dismissAll()">
            {{ copy().clearAll }}
          </button>
        </span>
      </div>
    }

    @if (visibleToasts().length) {
      <div
        class="toast-stack"
        [style.--_stack-count]="visibleToasts().length"
        [attr.aria-label]="visibleToasts().length > 1 ? copy().stackLabel : null"
      >
        @for (toast of visibleToasts(); track toast.id; let index = $index) {
          <article
            class="toast"
            [attr.data-tone]="toast.tone"
            [attr.data-leaving]="service.isLeaving(toast.id) ? '' : null"
            [style.--_stack-index]="index"
            [attr.role]="toast.tone === 'danger' ? 'alert' : 'status'"
            [attr.aria-atomic]="true"
            (mouseenter)="service.pause(toast.id, 'pointer')"
            (mouseleave)="service.resume(toast.id, 'pointer')"
            (focusin)="service.pause(toast.id, 'focus')"
            (focusout)="onToastFocusout($event, toast.id)"
          >
            <span class="indicator" aria-hidden="true">{{ toneIcon(toast) }}</span>
            <div class="copy">
              @if (toast.title) {
                <strong>{{ toast.title }}</strong>
              }
              <p>{{ toast.message }}</p>
            </div>
            @if (toast.actionLabel) {
              <button type="button" class="action" (click)="service.act(toast)">
                {{ toast.actionLabel }}
              </button>
            }
            @if (toast.dismissible) {
              <button
                type="button"
                class="dismiss"
                [attr.aria-label]="copy().dismiss"
                (click)="service.dismiss(toast.id)"
              >
                <span aria-hidden="true">×</span>
              </button>
            }
          </article>
        }
      </div>
    }

    @if (hiddenToastCount() > 0 && expanded()) {
      <p class="limit-note" role="status">
        {{ copy().limit(visibleToastCount(), totalToasts()) }}
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
    .toast-stack {
      display: flex;
      flex-direction: column;
      min-block-size: 4rem;
      pointer-events: none;
      perspective: 60rem;
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
      transition:
        margin-block-start var(--krn-motion-duration-enter)
          var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1)),
        opacity var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease),
        transform var(--krn-motion-duration-enter)
          var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1)),
        box-shadow var(--krn-motion-duration-selection) var(--krn-motion-ease-standard, ease);
      z-index: calc(20 - var(--_stack-index));
    }
    .toast + .toast {
      margin-block-start: -3.3rem;
      opacity: calc(1 - var(--_stack-index) * 0.12);
      transform: translateY(calc(var(--_stack-index) * 0.45rem))
        scale(calc(1 - var(--_stack-index) * 0.018));
    }
    .toast-stack:is(:hover, :focus-within) .toast {
      margin-block-start: 0;
      opacity: 1;
      transform: none;
      box-shadow: var(--krn-shadow-lg, 0 12px 32px rgb(0 0 0 / 16%));
    }
    .toast-stack:is(:hover, :focus-within) .toast + .toast {
      margin-block-start: var(--krn-space-2, 0.5rem);
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
    .copy strong {
      overflow: hidden;
      font-weight: 650;
      line-height: 1.25;
      text-overflow: ellipsis;
      white-space: nowrap;
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
        animation: krn-toast-enter var(--krn-motion-duration-enter)
          var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1));
      }
      .toast[data-leaving] {
        pointer-events: none;
        animation: krn-toast-exit var(--krn-motion-duration-exit)
          var(--krn-motion-ease-exit, cubic-bezier(0.7, 0, 0.84, 0)) forwards;
      }
    }
    :host-context(html[data-krn-motion='full']) .toast {
      animation: krn-toast-enter var(--krn-motion-duration-enter)
        var(--krn-motion-ease-enter, cubic-bezier(0.16, 1, 0.3, 1));
    }
    :host-context(html[data-krn-motion='full']) .toast[data-leaving] {
      pointer-events: none;
      animation: krn-toast-exit var(--krn-motion-duration-exit)
        var(--krn-motion-ease-exit, cubic-bezier(0.7, 0, 0.84, 0)) forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .toast,
      :host-context(html:not([data-krn-motion='full'])) .toast + .toast {
        transition: none;
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
      .toast-stack,
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
      .indicator {
        color: CanvasText;
        background: Canvas;
        box-shadow: inset 0 0 0 1px CanvasText;
      }
    }
  `,
})
export class KrnToastViewport {
  protected readonly service = inject(KrnToastService);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly position = input<KrnToastPosition>('top-end');
  readonly maxVisible = input(4, { transform: numberAttribute });
  readonly maxExpanded = input(12, { transform: numberAttribute });
  readonly labels = input<Partial<KrnToastTranslations>>({});
  readonly ariaLabel = input(this.translations.toast.ariaLabel);
  readonly expanded = model(false);
  protected readonly copy = computed(() => ({
    ...this.translations.toast,
    ariaLabel: this.ariaLabel(),
    ...this.labels(),
  }));
  protected readonly Math = Math;
  protected readonly toggle = (value: boolean): boolean => !value;
  protected readonly totalToasts = computed(() => this.service.toasts().length);
  protected readonly hasOverflow = computed(
    () => this.totalToasts() > Math.max(1, this.maxVisible()),
  );
  protected readonly visibleToasts = computed(() => {
    const normalLimit = Math.max(1, this.maxVisible());
    const expandedLimit = Math.max(normalLimit, this.maxExpanded());
    return this.service
      .toasts()
      .slice(-(this.expanded() ? expandedLimit : normalLimit))
      .reverse();
  });
  protected readonly visibleToastCount = computed(() => this.visibleToasts().length);
  protected readonly hiddenToastCount = computed(
    () => this.totalToasts() - this.visibleToastCount(),
  );

  protected toneIcon(toast: KrnToastRecord): string {
    return { neutral: '•', info: 'i', success: '✓', warning: '!', danger: '!' }[
      toast.tone ?? 'neutral'
    ];
  }

  protected onToastFocusout(event: FocusEvent, id: string): void {
    const current = event.currentTarget as HTMLElement;
    if (krnIsNode(this.platform, event.relatedTarget) && current.contains(event.relatedTarget)) {
      return;
    }
    this.service.resume(id, 'focus');
  }
}

export { KrnToastViewport as KrnSnackbar, KrnToastViewport as KrnToast };
