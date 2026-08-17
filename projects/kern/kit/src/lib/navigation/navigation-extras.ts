import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Location } from '@angular/common';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnNavigationItem, KrnTocItem } from './navigation.types';

function validateBottomNavigationItems(
  items: readonly KrnNavigationItem[],
): readonly KrnNavigationItem[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item.id !== 'string' || item.id.trim().length === 0 || ids.has(item.id)) {
      throw new Error(
        `KrnBottomNavigation requires non-empty unique item ids; received "${item.id}".`,
      );
    }
    ids.add(item.id);
  }
  return items;
}

function validateTocItems(items: readonly KrnTocItem[]): readonly KrnTocItem[] {
  const ids = new Set<string>();
  let changed = false;
  const normalized = items.map((item) => {
    if (typeof item.id !== 'string' || item.id.trim().length === 0 || ids.has(item.id)) {
      throw new Error(
        `KrnTableOfContents requires non-empty unique item ids; received "${item.id}".`,
      );
    }
    ids.add(item.id);
    if (item.level === undefined || item.level === 2 || item.level === 3 || item.level === 4) {
      return item;
    }
    changed = true;
    return { ...item, level: 2 as const };
  });
  return changed ? normalized : items;
}

function sameDocumentHref(document: Document, targetId: string): string {
  const current = document.defaultView?.location.href ?? document.baseURI;
  const url = new URL(current);
  return `${url.pathname}${url.search}#${encodeURIComponent(targetId)}`;
}

function isPlainPrimaryActivation(event: MouseEvent): boolean {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

function navigateToAnchor(
  document: Document,
  targetId: string,
  event: MouseEvent,
  moveFocus = false,
): boolean {
  if (!isPlainPrimaryActivation(event)) return false;
  const target = document.getElementById(targetId);
  if (!target) return true;
  event.preventDefault();
  const view = document.defaultView;
  view?.history.pushState(view.history.state, '', sameDocumentHref(document, targetId));
  target.scrollIntoView?.({ behavior: 'auto', block: 'start' });
  const HTMLElementConstructor = view?.HTMLElement;
  if (moveFocus && HTMLElementConstructor && target instanceof HTMLElementConstructor) {
    const restoreTabIndex = !target.hasAttribute('tabindex') && target.tabIndex < 0;
    if (restoreTabIndex) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    if (restoreTabIndex) {
      if (document.activeElement === target) {
        target.addEventListener(
          'blur',
          () => {
            if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex');
          },
          { once: true },
        );
      } else {
        target.removeAttribute('tabindex');
      }
    }
  }
  return true;
}

@Component({
  selector: 'krn-bottom-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-navigation.html',
  styleUrl: './bottom-navigation.css',
  host: {
    '[style.--krn-bottom-nav-count]': 'columnCount()',
  },
})
export class KrnBottomNavigation {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly items = input<readonly KrnNavigationItem[], readonly KrnNavigationItem[]>([], {
    transform: validateBottomNavigationItems,
  });
  readonly value = model<string | null>(null);
  readonly ariaLabel = input<string | undefined>();
  readonly itemSelected = output<KrnNavigationItem>();
  protected readonly columnCount = computed(() => Math.max(1, this.items().length));
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.primary.trim() || null,
  );

  constructor() {
    effect(() => {
      const value = this.value();
      if (value !== null && !this.items().some((item) => item.id === value && !item.disabled)) {
        this.value.set(null);
      }
    });
  }

  protected select(item: KrnNavigationItem): void {
    if (item.disabled) return;
    this.value.set(item.id);
    this.itemSelected.emit(item);
  }

  protected badgeText(badge: string | number): string {
    return typeof badge === 'number' && Number.isFinite(badge) && badge > 999
      ? '999+'
      : String(badge);
  }

  protected badgeAriaLabel(badge: string | number): string {
    return String(badge);
  }
}

@Component({
  selector: 'krn-table-of-contents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-of-contents.html',
  styleUrl: './table-of-contents.css',
})
export class KrnTableOfContents {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly items = input<readonly KrnTocItem[], readonly KrnTocItem[]>([], {
    transform: validateTocItems,
  });
  readonly activeId = model<string | null>(null);
  readonly observe = input(true, { transform: booleanAttribute });
  readonly title = input<string | undefined>();
  readonly ariaLabel = input<string | undefined>();
  readonly itemActivated = output<KrnTocItem>();
  protected readonly resolvedTitle = computed(
    () => this.title()?.trim() || this.translations.navigation.tableOfContentsTitle.trim() || null,
  );
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.tableOfContents.trim() || null,
  );

  constructor() {
    effect(() => {
      const activeId = this.activeId();
      if (activeId !== null && !this.items().some((item) => item.id === activeId)) {
        this.activeId.set(null);
      }
    });
    effect((onCleanup) => {
      const items = this.items();
      const IntersectionObserverConstructor = this.platform.window?.IntersectionObserver;
      if (!this.observe() || !this.platform.isBrowser || !IntersectionObserverConstructor) return;
      const intersections = new Map<Element, boolean>();
      let activationLine = 0;
      const observer = new IntersectionObserverConstructor(
        (entries) => {
          entries.forEach((entry) => {
            intersections.set(entry.target, entry.isIntersecting);
            activationLine = entry.rootBounds?.top ?? activationLine;
          });
          const visible = [...intersections]
            .filter(([, isIntersecting]) => isIntersecting)
            .map(([target]) => target)
            .sort(
              (a, b) =>
                Math.abs(a.getBoundingClientRect().top - activationLine) -
                Math.abs(b.getBoundingClientRect().top - activationLine),
            )[0];
          if (visible?.id) this.activeId.set(visible.id);
        },
        { rootMargin: '-15% 0px -70%', threshold: [0, 1] },
      );
      items.forEach((item) => {
        const element = this.platform.document.getElementById(item.id);
        if (element) observer.observe(element);
      });
      onCleanup(() => observer.disconnect());
    });
  }

  protected anchorHref(id: string): string {
    return sameDocumentHref(this.platform.document, id);
  }

  protected activate(event: MouseEvent, item: KrnTocItem): void {
    if (!navigateToAnchor(this.platform.document, item.id, event)) return;
    this.activeId.set(item.id);
    this.itemActivated.emit(item);
  }
}

@Component({
  selector: 'krn-back-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './back-button.html',
  styleUrl: './back-button.css',
})
export class KrnBackButton {
  private readonly location = inject(Location);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly href = input<string | null>(null);
  readonly label = input<string | undefined>();
  readonly activated = output<void>();
  protected readonly resolvedHref = computed(() => this.href()?.trim() || null);
  protected readonly resolvedLabel = computed(
    () => this.label()?.trim() || this.translations.navigation.back.trim(),
  );

  protected activateLink(event: MouseEvent): void {
    if (isPlainPrimaryActivation(event)) this.activated.emit();
  }

  protected goBack(): void {
    this.activated.emit();
    this.location.back();
  }
}

@Component({
  selector: 'krn-skip-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skip-link.html',
  styleUrl: './skip-link.css',
})
export class KrnSkipLink {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly targetId = input('main-content');
  readonly label = input<string | undefined>();
  readonly activated = output<void>();
  protected readonly resolvedTargetId = computed(() => this.targetId().trim() || 'main-content');
  protected readonly resolvedLabel = computed(
    () => this.label()?.trim() || this.translations.navigation.skipToMainContent.trim(),
  );

  protected href(): string {
    return sameDocumentHref(this.platform.document, this.resolvedTargetId());
  }

  protected activate(event: MouseEvent): void {
    if (navigateToAnchor(this.platform.document, this.resolvedTargetId(), event, true)) {
      this.activated.emit();
    }
  }
}
