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

function navigateToAnchor(
  document: Document,
  targetId: string,
  event: MouseEvent,
  moveFocus = false,
): boolean {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return false;
  }
  const target = document.getElementById(targetId);
  if (!target) return true;
  event.preventDefault();
  const view = document.defaultView;
  view?.history.pushState(view.history.state, '', sameDocumentHref(document, targetId));
  target.scrollIntoView?.({ behavior: 'auto', block: 'start' });
  const HTMLElementConstructor = view?.HTMLElement;
  if (moveFocus && HTMLElementConstructor && target instanceof HTMLElementConstructor) {
    target.focus({ preventScroll: true });
  }
  return true;
}

@Component({
  selector: 'krn-bottom-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bottom-nav" [attr.aria-label]="resolvedAriaLabel()">
      @for (item of items(); track item.id) {
        @if (item.href && !item.disabled) {
          <a
            [href]="item.href"
            [attr.aria-current]="value() === item.id ? 'page' : null"
            (click)="select(item)"
          >
            @if (item.icon) {
              <span class="icon" aria-hidden="true">{{ item.icon }}</span>
            }
            <span>{{ item.label }}</span>
            @if (item.badge !== undefined) {
              <span class="badge" [attr.aria-label]="badgeAriaLabel(item.badge)">
                {{ badgeText(item.badge) }}
              </span>
            }
          </a>
        } @else {
          <button
            type="button"
            [disabled]="item.disabled"
            [attr.aria-current]="value() === item.id ? 'page' : null"
            (click)="select(item)"
          >
            @if (item.icon) {
              <span class="icon" aria-hidden="true">{{ item.icon }}</span>
            }
            <span>{{ item.label }}</span>
            @if (item.badge !== undefined) {
              <span class="badge" [attr.aria-label]="badgeAriaLabel(item.badge)">
                {{ badgeText(item.badge) }}
              </span>
            }
          </button>
        }
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
    .bottom-nav {
      display: grid;
      grid-template-columns: repeat(var(--krn-bottom-nav-count, 1), minmax(min(4.5rem, 100%), 1fr));
      overflow-x: auto;
      padding: var(--krn-space-1);
      border-block-start: var(--krn-border-width-1) solid var(--krn-color-border);
      background: var(--krn-color-surface);
      overscroll-behavior-inline: contain;
      scrollbar-width: thin;
    }
    .bottom-nav :is(a, button) {
      position: relative;
      display: grid;
      justify-items: center;
      gap: var(--krn-space-1);
      min-inline-size: 0;
      min-block-size: var(--krn-touch-target-min);
      padding: var(--krn-space-2);
      border: 0;
      border-radius: var(--krn-radius-sm);
      background: transparent;
      color: var(--krn-color-text-muted);
      font: inherit;
      font-size: var(--krn-font-size-xs);
      font-weight: var(--krn-font-weight-medium);
      line-height: var(--krn-line-height-tight);
      text-decoration: none;
      cursor: pointer;
      scroll-snap-align: center;
    }
    .bottom-nav :is(a, button) > span:not(.icon, .badge) {
      inline-size: 100%;
      overflow: hidden;
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bottom-nav :is(a, button):hover {
      background: var(--krn-color-surface-subtle);
      color: var(--krn-color-text);
    }
    .bottom-nav [aria-current='page'] {
      color: var(--krn-color-primary);
    }
    .bottom-nav [aria-current='page']::before {
      position: absolute;
      inset-block-start: 0;
      inline-size: var(--krn-space-4);
      block-size: calc(var(--krn-border-width-1) * 2);
      background: var(--krn-color-primary);
      content: '';
    }
    .bottom-nav :is(a, button):focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: calc(var(--krn-focus-ring-offset) * -1);
    }
    .bottom-nav button:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
    .icon {
      font-size: var(--krn-icon-size-md);
    }
    .badge {
      position: absolute;
      inset-block-start: var(--krn-space-1);
      inset-inline-start: calc(50% + var(--krn-space-2));
      min-inline-size: var(--krn-space-4);
      padding-inline: var(--krn-space-1);
      border-radius: var(--krn-radius-full);
      background: var(--krn-color-danger);
      color: var(--krn-color-on-danger);
      font-variant-numeric: tabular-nums;
      line-height: var(--krn-line-height-tight);
      white-space: nowrap;
    }
    @media (forced-colors: active) {
      .bottom-nav {
        border-block-start-color: CanvasText;
      }
      .bottom-nav [aria-current='page']::before {
        background: Highlight;
      }
      .bottom-nav :is(a, button):focus-visible {
        outline-color: Highlight;
      }
      .badge {
        border: 1px solid CanvasText;
      }
    }
  `,
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
  readonly ariaLabel = input(this.translations.navigation.primary);
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
  template: `
    <nav class="toc" [attr.aria-label]="resolvedAriaLabel()">
      <p class="title">{{ resolvedTitle() }}</p>
      <ol>
        @for (item of items(); track item.id) {
          <li [style.--toc-level]="item.level ?? 2">
            <a
              [href]="anchorHref(item.id)"
              [attr.aria-current]="activeId() === item.id ? 'location' : null"
              (click)="activate($event, item)"
              >{{ item.label }}</a
            >
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
    .toc {
      max-block-size: 100%;
      overflow: auto;
      border-inline-start: var(--krn-border-width-1) solid var(--krn-color-border);
      padding-inline-start: var(--krn-space-4);
      overscroll-behavior-block: contain;
      scrollbar-width: thin;
    }
    .title {
      margin: 0 0 var(--krn-space-3);
      color: var(--krn-color-text);
      font-size: var(--krn-font-size-sm);
      font-weight: var(--krn-font-weight-semibold);
    }
    ol {
      display: grid;
      gap: var(--krn-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      padding-inline-start: calc((var(--toc-level) - 2) * var(--krn-space-3));
    }
    a {
      position: relative;
      display: block;
      padding-block: var(--krn-space-1);
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-sm);
      line-height: var(--krn-line-height-body);
      text-decoration: none;
      overflow-wrap: anywhere;
    }
    a::before {
      position: absolute;
      inset-block: var(--krn-space-1);
      inset-inline-start: calc((var(--krn-space-4) + var(--krn-border-width-1)) * -1);
      inline-size: calc(var(--krn-border-width-1) * 2);
      background: transparent;
      content: '';
    }
    a:hover {
      color: var(--krn-color-text);
    }
    a[aria-current='location'] {
      color: var(--krn-color-text);
      font-weight: var(--krn-font-weight-medium);
    }
    a[aria-current='location']::before {
      background: var(--krn-color-primary);
    }
    a:focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
      border-radius: var(--krn-radius-xs);
    }
    @media (forced-colors: active) {
      .toc {
        border-inline-start-color: CanvasText;
      }
      a[aria-current='location']::before {
        background: Highlight;
      }
      a:focus-visible {
        outline-color: Highlight;
      }
    }
  `,
})
export class KrnTableOfContents {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly items = input<readonly KrnTocItem[], readonly KrnTocItem[]>([], {
    transform: validateTocItems,
  });
  readonly activeId = model<string | null>(null);
  readonly observe = input(true, { transform: booleanAttribute });
  readonly title = input(this.translations.navigation.tableOfContentsTitle);
  readonly ariaLabel = input(this.translations.navigation.tableOfContents);
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
  template: `
    @if (href()) {
      <a [href]="href()" (click)="activated.emit()"
        ><span aria-hidden="true">←</span><span>{{ label() }}</span></a
      >
    } @else {
      <button type="button" (click)="goBack()">
        <span aria-hidden="true">←</span><span>{{ label() }}</span>
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-block;
    }
    :is(a, button) {
      display: inline-flex;
      align-items: center;
      gap: var(--krn-space-2);
      min-block-size: var(--krn-control-height-sm);
      padding-inline: var(--krn-space-2);
      border: 0;
      border-radius: var(--krn-radius-sm);
      background: transparent;
      color: var(--krn-color-text-muted);
      font: inherit;
      font-weight: var(--krn-font-weight-medium);
      text-decoration: none;
      cursor: pointer;
    }
    :is(a, button):hover {
      background: var(--krn-color-surface-subtle);
      color: var(--krn-color-text);
    }
    :is(a, button):focus-visible {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
  `,
})
export class KrnBackButton {
  private readonly location = inject(Location);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly href = input<string | null>(null);
  readonly label = input(this.translations.navigation.back);
  readonly activated = output<void>();

  protected goBack(): void {
    this.activated.emit();
    this.location.back();
  }
}

@Component({
  selector: 'krn-skip-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="skip-link" [href]="href()" (click)="activate($event)">{{ label() }}</a>`,
  styles: `
    .skip-link {
      position: fixed;
      z-index: var(--krn-z-toast);
      inset-block-start: var(--krn-space-3);
      inset-inline-start: var(--krn-space-3);
      padding: var(--krn-space-2) var(--krn-space-4);
      border: var(--krn-border-width-1) solid var(--krn-color-border-strong);
      border-radius: var(--krn-radius-sm);
      box-shadow: var(--krn-shadow-md);
      background: var(--krn-color-surface-inverse);
      color: var(--krn-color-text-inverse);
      font-weight: var(--krn-font-weight-semibold);
      text-decoration: none;
      transform: translateY(calc(-100% - var(--krn-space-6)));
      transition: transform var(--krn-motion-duration-interaction) var(--krn-motion-ease-enter);
    }
    .skip-link:focus {
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .skip-link {
        transition: none;
      }
    }
  `,
})
export class KrnSkipLink {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly targetId = input('main-content');
  readonly label = input(this.translations.navigation.skipToMainContent);
  readonly activated = output<void>();

  protected href(): string {
    return sameDocumentHref(this.platform.document, this.targetId());
  }

  protected activate(event: MouseEvent): void {
    if (navigateToAnchor(this.platform.document, this.targetId(), event, true)) {
      this.activated.emit();
    }
  }
}
