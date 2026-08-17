import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { KrnIdService } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { KrnBadge } from '@kern-ui/angular/kit';
import type { KrnNotification } from './product-types';

@Component({
  selector: 'krn-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge],
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.css',
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
