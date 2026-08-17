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
import { krnInputFallback } from '../reactive-input';
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
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class KrnToastViewport {
  protected readonly service = inject(KrnToastService);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly position = input<KrnToastPosition>('top-end');
  readonly maxVisible = input(4, { transform: numberAttribute });
  readonly maxExpanded = input(12, { transform: numberAttribute });
  readonly labels = input<Partial<KrnToastTranslations>>({});
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.toast.ariaLabel,
  );
  readonly expanded = model(false);
  protected readonly copy = computed(() => ({
    ...this.translations.toast,
    ariaLabel: this.resolvedAriaLabel(),
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
