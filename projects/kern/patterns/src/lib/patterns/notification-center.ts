import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { KrnIdService } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { KrnBadge } from '@kern-ui/angular/kit';
import type { KrnNotification } from './product-types';

@Component({
  selector: 'krn-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge],
  template: `
    <section [attr.aria-label]="resolvedAriaLabel()">
      <header>
        <span>
          <h2>{{ resolvedHeading() }}</h2>
          <krn-badge
            aria-live="polite"
            aria-atomic="true"
            [tone]="unreadCount() ? 'brand' : 'neutral'"
            >{{ resolvedUnreadLabel() }}</krn-badge
          >
        </span>
        @if (unreadCount()) {
          <button type="button" [attr.aria-controls]="notificationsId" (click)="markAllRead.emit()">
            {{ resolvedMarkAllReadLabel() }}
          </button>
        }
      </header>
      @if (validatedNotifications().length) {
        <ol [id]="notificationsId">
          @for (notification of validatedNotifications(); track notification.id) {
            <li [attr.data-unread]="!notification.read ? '' : null">
              <button type="button" (click)="notificationSelected.emit(notification)">
                <span
                  class="marker"
                  [attr.data-tone]="notification.tone ?? 'neutral'"
                  aria-hidden="true"
                ></span>
                <span>
                  <strong>{{ notification.title }}</strong>
                  <span>{{ notification.detail }}</span>
                  <time [attr.datetime]="notification.dateTime?.trim() || null">{{
                    notification.timestamp
                  }}</time>
                </span>
                @if (!notification.read) {
                  <span class="sr-only">{{ resolvedUnreadStateLabel() }}</span>
                }
              </button>
            </li>
          }
        </ol>
      } @else {
        <div class="empty" role="status">{{ resolvedEmptyLabel() }}</div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      color: var(--krn-color-text, #252932);
    }
    :host([hidden]) {
      display: none;
    }
    section {
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-overlay, 0.75rem);
      background: var(--krn-color-surface, #fff);
    }
    header {
      display: flex;
      min-block-size: 3.5rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-inline: 1rem;
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    header > span {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    h2 {
      margin: 0;
      font: inherit;
      font-weight: 650;
    }
    header button {
      border: 0;
      color: var(--krn-color-brand-text, #1d4ed8);
      background: transparent;
      font: inherit;
      font-weight: 620;
      cursor: pointer;
    }
    ol {
      max-block-size: 28rem;
      margin: 0;
      padding: 0;
      overflow: auto;
      list-style: none;
    }
    li + li {
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    li[data-unread] {
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    li button {
      display: grid;
      inline-size: 100%;
      grid-template-columns: 0.625rem minmax(0, 1fr);
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    li button:hover {
      background: color-mix(in srgb, var(--krn-color-surface-raised, #f2f3f5), transparent 20%);
    }
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: -3px;
    }
    li button > span:nth-child(2) {
      display: grid;
      gap: 0.125rem;
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }
    li button > span > span,
    time {
      color: var(--krn-color-text-muted, #626a76);
    }
    time {
      margin-block-start: 0.25rem;
      font-size: 0.75rem;
    }
    .marker {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      margin-block-start: 0.35rem;
      border: 1px solid currentColor;
      border-radius: 50%;
      background: var(--krn-color-text-muted, #626a76);
    }
    .marker[data-tone='success'] {
      background: var(--krn-color-success-solid, #1c8d62);
    }
    .marker[data-tone='warning'] {
      background: var(--krn-color-warning-solid, #a27700);
    }
    .marker[data-tone='danger'] {
      background: var(--krn-color-danger-solid, #c73a35);
    }
    .marker[data-tone='info'] {
      background: var(--krn-color-info-solid, #3e6faf);
    }
    .empty {
      display: grid;
      min-block-size: 10rem;
      place-content: center;
      color: var(--krn-color-text-muted, #626a76);
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    @media (pointer: coarse) {
      header button {
        min-block-size: 2.75rem;
      }
    }
    @media (forced-colors: active) {
      section,
      header,
      li + li {
        border-color: CanvasText;
      }
      li[data-unread] {
        background: Canvas;
        outline: 2px solid Highlight;
        outline-offset: -2px;
      }
      .marker {
        border-color: CanvasText;
        background: CanvasText;
      }
      li[data-unread] .marker {
        border-color: Highlight;
        background: Highlight;
      }
    }
  `,
})
export class KrnNotificationCenter {
  private readonly translations = inject(KRN_TRANSLATIONS);
  protected readonly notificationsId = inject(KrnIdService).next('notifications');
  readonly heading = input<typeof this.translations.patterns.notifications | undefined>();
  readonly ariaLabel = input<typeof this.translations.patterns.notificationCenter | undefined>();
  readonly unreadLabel = input<typeof this.translations.patterns.unreadCount | undefined>();
  readonly unreadStateLabel = input<typeof this.translations.patterns.unread | undefined>();
  readonly markAllReadLabel = input<typeof this.translations.patterns.markAllRead | undefined>();
  readonly emptyLabel = input<typeof this.translations.patterns.notificationsEmpty | undefined>();
  readonly notifications = input<readonly KrnNotification[]>([]);
  readonly markAllRead = output<void>();
  readonly notificationSelected = output<KrnNotification>();
  protected readonly resolvedHeading = computed(() =>
    this.requiredLabel(this.heading(), this.translations.patterns.notifications),
  );
  protected readonly resolvedAriaLabel = computed(() =>
    this.requiredLabel(this.ariaLabel(), this.translations.patterns.notificationCenter),
  );
  protected readonly resolvedMarkAllReadLabel = computed(() =>
    this.requiredLabel(this.markAllReadLabel(), this.translations.patterns.markAllRead),
  );
  protected readonly resolvedEmptyLabel = computed(() =>
    this.requiredLabel(this.emptyLabel(), this.translations.patterns.notificationsEmpty),
  );
  protected readonly validatedNotifications = computed(() => {
    const ids = new Set<string>();
    for (const [index, notification] of this.notifications().entries()) {
      const id = typeof notification.id === 'string' ? notification.id.trim() : '';
      if (!id || ids.has(id)) {
        throw new Error(
          `KrnNotificationCenter requires non-empty unique notification ids; received "${String(notification.id)}" at index ${index}.`,
        );
      }
      ids.add(id);
      for (const [field, value] of [
        ['title', notification.title],
        ['detail', notification.detail],
        ['timestamp', notification.timestamp],
      ] as const) {
        if (typeof value !== 'string' || !value.trim()) {
          throw new Error(
            `KrnNotificationCenter notification "${notification.id}" requires a non-empty ${field}.`,
          );
        }
      }
      if (typeof notification.read !== 'boolean') {
        throw new TypeError(
          `KrnNotificationCenter notification "${notification.id}" requires a boolean read state.`,
        );
      }
      if (
        notification.dateTime !== undefined &&
        (typeof notification.dateTime !== 'string' ||
          !this.isIsoDateTime(notification.dateTime.trim()))
      ) {
        throw new Error(
          `KrnNotificationCenter notification "${notification.id}" requires a valid ISO dateTime when provided.`,
        );
      }
      if (
        notification.tone !== undefined &&
        !['neutral', 'info', 'success', 'warning', 'danger'].includes(notification.tone)
      ) {
        throw new Error(
          `KrnNotificationCenter notification "${notification.id}" has an invalid tone.`,
        );
      }
    }
    return this.notifications();
  });
  protected readonly unreadCount = computed(
    () => this.validatedNotifications().filter((item) => !item.read).length,
  );
  protected readonly resolvedUnreadLabel = computed(() => {
    const count = this.unreadCount();
    const formatter = this.unreadLabel();
    const translatedFormatter = this.translations.patterns.unreadCount;
    const formatted = typeof formatter === 'function' ? formatter(count) : '';
    const translated = typeof translatedFormatter === 'function' ? translatedFormatter(count) : '';

    return (
      formatted.trim() ||
      translated.trim() ||
      `${count} unread notification${count === 1 ? '' : 's'}`
    );
  });
  protected readonly resolvedUnreadStateLabel = computed(() =>
    this.requiredLabel(
      this.unreadStateLabel(),
      typeof this.translations.patterns.unread === 'string'
        ? this.translations.patterns.unread.trim() || 'Unread'
        : 'Unread',
    ),
  );

  private requiredLabel(value: string | undefined, fallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || fallback.trim();
  }

  private isIsoDateTime(value: string): boolean {
    const match =
      /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?)?$/.exec(
        value,
      );

    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }
}
