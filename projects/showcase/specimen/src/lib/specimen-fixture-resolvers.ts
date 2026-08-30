import type { KrnDataGridMode } from '@kern-ui/angular/addon-grid';
import type { KrnNavigationItem } from '@kern-ui/angular/navigation';
import type { KrnNotification } from '@kern-ui/angular/patterns';

export function resolveKernSpecimenMenubarItems(
  state: string,
  items: readonly KrnNavigationItem[],
): readonly KrnNavigationItem[] {
  if (state === 'current') {
    return items.map((item, index) =>
      index === 0 ? { ...item, label: `${item.label} · Current` } : item,
    );
  }
  if (state === 'disabled') {
    return items.map((item, index) => (index === 0 ? { ...item, disabled: true } : item));
  }
  return items;
}

export function resolveKernSpecimenNotifications(
  state: string,
  notifications: readonly KrnNotification[],
): readonly KrnNotification[] {
  if (state === 'empty') return [];
  if (state === 'unread') {
    return notifications.map((notification) => ({ ...notification, read: false }));
  }
  return notifications;
}

export function resolveKernSpecimenFilterValues(
  activeFilter: string,
): Readonly<Partial<Record<string, string>>> {
  return activeFilter === 'healthy' || activeFilter === 'attention' ? { state: activeFilter } : {};
}

export function resolveKernSpecimenShortcutKeys(platform: string): readonly string[] {
  return platform === 'Windows' ? ['Ctrl', 'K'] : ['⌘', 'K'];
}

export function resolveKernSpecimenGridMode(
  pagination: boolean,
  virtualize = false,
): KrnDataGridMode {
  return virtualize ? { kind: 'virtual' } : { kind: 'client', pagination };
}
