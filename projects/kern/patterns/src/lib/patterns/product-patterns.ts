import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';

import { KRN_PLATFORM, KrnIdService, krnIsElement, krnIsNode } from '@kern-ui/angular/cdk';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { KrnBadge, KrnCard, KrnDrawer } from '@kern-ui/angular/kit';

export interface KrnSearchResult {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly keywords?: readonly string[];
}

export interface KrnNotification {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly timestamp: string;
  readonly read: boolean;
  readonly tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

export interface KrnFilterOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
}

export interface KrnFilterDefinition {
  readonly id: string;
  readonly label: string;
  readonly options: readonly KrnFilterOption[];
}

@Component({
  selector: 'krn-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-open]': 'open() ? "" : null',
  },
  template: `
    <div class="root" (focusout)="onFocusOut($event)">
      <button
        type="button"
        class="trigger"
        [attr.aria-expanded]="open()"
        aria-haspopup="menu"
        (click)="toggleMenu()"
        (keydown)="onTriggerKeydown($event)"
      >
        <ng-content select="[krnUserAvatar]" />
        <span class="identity">
          <strong>{{ name() }}</strong>
          @if (detail()) {
            <small>{{ detail() }}</small>
          }
        </span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      @if (open()) {
        <div
          class="menu"
          role="menu"
          [attr.aria-label]="menuAriaLabel()"
          (click)="onMenuClick($event)"
          (keydown)="onMenuKeydown($event)"
        >
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      max-inline-size: 100%;
      color: var(--krn-color-text, #252932);
    }
    .root {
      position: relative;
      inline-size: fit-content;
      max-inline-size: 100%;
    }
    .trigger {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-block-size: 3.25rem;
      align-items: center;
      gap: 0.75rem;
      min-inline-size: min(17rem, calc(100vw - 2rem));
      max-inline-size: 20rem;
      padding: 0.5rem 0.625rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-md, 0.5rem);
      color: inherit;
      background: var(--krn-color-surface, #fff);
      font: inherit;
      text-align: start;
      cursor: pointer;
      transition:
        border-color var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease),
        background-color var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease);
    }
    .trigger:hover,
    :host([data-open]) .trigger {
      border-color: var(--krn-color-border-strong, #aeb4bd);
      background: var(--krn-color-surface-hover, #f2f3f5);
    }
    .trigger:focus-visible {
      border-color: var(--krn-color-focus, #4f6feb);
      box-shadow: var(--krn-focus-ring);
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
    .identity {
      display: grid;
      min-inline-size: 0;
    }
    strong,
    small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    strong {
      font-size: var(--krn-font-size-md, 0.9375rem);
      font-weight: 600;
      line-height: 1.25;
    }
    small {
      color: var(--krn-color-text-muted, #626a76);
      font-size: var(--krn-font-size-sm, 0.8125rem);
      line-height: 1.25;
    }
    .chevron {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 1.5px solid currentColor;
      border-block-end: 1.5px solid currentColor;
      rotate: 45deg;
      translate: 0 -0.125rem;
      transition:
        rotate var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease),
        translate var(--krn-motion-duration-interaction) var(--krn-ease-standard, ease);
    }
    :host([data-open]) .chevron {
      rotate: 225deg;
      translate: 0 0.125rem;
    }
    .menu {
      position: absolute;
      z-index: var(--krn-z-dropdown, 500);
      inset-block-start: calc(100% + 0.375rem);
      inset-inline-start: 0;
      display: grid;
      inline-size: max(100%, 15rem);
      max-inline-size: min(20rem, calc(100vw - 2rem));
      padding: 0.25rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-lg, 0.75rem);
      background: var(--krn-color-surface-overlay, #fff);
      box-shadow: var(--krn-shadow-overlay, 0 12px 32px rgb(20 24 32 / 0.14));
      animation: user-menu-in var(--krn-motion-duration-enter) var(--krn-ease-enter, ease-out);
      transform-origin: top left;
    }
    .menu ::ng-deep [role='menuitem'] {
      display: flex;
      inline-size: 100%;
      min-block-size: 2.5rem;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border: 0;
      border-radius: var(--krn-radius-sm, 0.375rem);
      color: inherit;
      background: transparent;
      font: 500 var(--krn-font-size-md, 0.9375rem) / 1.25 var(--krn-font-family-sans, sans-serif);
      text-align: start;
      cursor: pointer;
    }
    .menu ::ng-deep [role='menuitem']:is(:hover, :focus-visible) {
      background: var(--krn-color-surface-hover, #f2f3f5);
      outline: 0;
    }
    .menu ::ng-deep [role='menuitem']:focus-visible {
      box-shadow: inset 0 0 0 2px var(--krn-color-focus);
    }
    @keyframes user-menu-in {
      from {
        opacity: 0;
        scale: 0.98;
        translate: 0 -0.25rem;
      }
      to {
        opacity: 1;
        scale: 1;
        translate: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) .menu {
        animation: none;
      }
    }
  `,
})
export class KrnUserMenu {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly name = input.required<string>();
  readonly detail = input('');
  readonly menuAriaLabel = input(this.translations.patterns.userActions);
  readonly open = model(false);

  protected toggleMenu(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.focusMenuItem(0);
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    this.open.set(true);
    this.focusMenuItem(event.key === 'ArrowDown' ? 0 : -1);
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeAndFocus();
      return;
    }
    const items = this.menuItems();
    const current = items.indexOf(this.platform.document.activeElement as HTMLElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1) % items.length
            : event.key === 'ArrowUp'
              ? (current - 1 + items.length) % items.length
              : -1;
    if (next < 0) {
      return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  protected onMenuClick(event: MouseEvent): void {
    if (krnIsElement(this.platform, event.target) && event.target.closest('[role="menuitem"]')) {
      this.closeAndFocus();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (
      krnIsNode(this.platform, event.relatedTarget) &&
      krnIsNode(this.platform, event.currentTarget) &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    this.open.set(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeOnOutsidePointer(event: PointerEvent): void {
    if (
      this.open() &&
      krnIsNode(this.platform, event.target) &&
      !this.host.nativeElement.contains(event.target)
    ) {
      this.open.set(false);
    }
  }

  private closeAndFocus(): void {
    this.open.set(false);
    const focus = (): void =>
      this.host.nativeElement.querySelector<HTMLButtonElement>('.trigger')?.focus();
    this.platform.queueMicrotask(focus);
  }

  private menuItems(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.menu [role="menuitem"]:not([disabled])',
      ),
    );
  }

  private focusMenuItem(index: number): void {
    const focusRequestedItem = (): void => {
      const items = this.menuItems();
      items[index < 0 ? items.length - 1 : index]?.focus();
    };

    if (this.menuItems().length) {
      focusRequestedItem();
      return;
    }

    afterNextRender({ write: focusRequestedItem }, { injector: this.injector });
  }
}

@Component({
  selector: 'krn-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge],
  template: `
    <section [attr.aria-label]="ariaLabel()">
      <header>
        <span>
          <strong>{{ heading() }}</strong>
          <krn-badge [tone]="unreadCount() ? 'brand' : 'neutral'">{{
            unreadLabel()(unreadCount())
          }}</krn-badge>
        </span>
        @if (unreadCount()) {
          <button type="button" (click)="markAllRead.emit()">{{ markAllReadLabel() }}</button>
        }
      </header>
      @if (notifications().length) {
        <ol>
          @for (notification of notifications(); track notification.id) {
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
                  <time>{{ notification.timestamp }}</time>
                </span>
                @if (!notification.read) {
                  <span class="sr-only">{{ unreadStateLabel() }}</span>
                }
              </button>
            </li>
          }
        </ol>
      } @else {
        <div class="empty" role="status">{{ emptyLabel() }}</div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      color: var(--krn-color-text, #252932);
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
  `,
})
export class KrnNotificationCenter {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly heading = input(this.translations.patterns.notifications);
  readonly ariaLabel = input(this.translations.patterns.notificationCenter);
  readonly unreadLabel = input(this.translations.patterns.unreadCount);
  readonly unreadStateLabel = input(this.translations.patterns.unread);
  readonly markAllReadLabel = input(this.translations.patterns.markAllRead);
  readonly emptyLabel = input(this.translations.patterns.notificationsEmpty);
  readonly notifications = input<readonly KrnNotification[]>([]);
  readonly markAllRead = output<void>();
  readonly notificationSelected = output<KrnNotification>();
  protected readonly unreadCount = computed(
    () => this.notifications().filter((item) => !item.read).length,
  );
}

@Component({
  selector: 'krn-global-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="searchbox">
      <span aria-hidden="true">⌕</span>
      <input
        type="search"
        role="combobox"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="resultsId()"
        [attr.aria-activedescendant]="activeResultId()"
        [value]="query()"
        [placeholder]="placeholder()"
        (input)="onInput($event)"
        (focus)="open.set(true)"
        (keydown)="onKeydown($event)"
      />
      @if (query()) {
        <button type="button" [attr.aria-label]="clearLabel()" (click)="clear()">×</button>
      }
    </div>
    @if (open() && query()) {
      <div
        class="results"
        [id]="resultsId()"
        role="listbox"
        [attr.aria-label]="resultsLabel()(ariaLabel())"
      >
        @if (filteredResults().length) {
          @for (result of filteredResults(); track result.id; let index = $index) {
            <button
              type="button"
              role="option"
              [id]="resultOptionId(result.id)"
              [attr.aria-selected]="index === activeIndex()"
              (pointerenter)="activeIndex.set(index)"
              (click)="choose(result)"
            >
              <span>
                <strong>{{ result.label }}</strong>
                @if (result.description) {
                  <small>{{ result.description }}</small>
                }
              </span>
              @if (result.group) {
                <em>{{ result.group }}</em>
              }
            </button>
          }
        } @else {
          <p role="status">{{ emptyResultsLabel()(query()) }}</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      inline-size: min(100%, 38rem);
      color: var(--krn-color-text, #252932);
    }
    .searchbox {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-block-size: var(--krn-control-size, 2.5rem);
      align-items: center;
      gap: 0.625rem;
      padding-inline: 0.75rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      background: var(--krn-color-surface, #fff);
    }
    .searchbox:focus-within {
      border-color: var(--krn-color-focus, #4f6feb);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--krn-color-focus, #4f6feb), transparent 78%);
    }
    input {
      min-inline-size: 0;
      border: 0;
      outline: 0;
      color: inherit;
      background: transparent;
      font: inherit;
    }
    .searchbox button {
      border: 0;
      color: var(--krn-color-text-muted, #626a76);
      background: transparent;
      font-size: 1.125rem;
      cursor: pointer;
    }
    .results {
      position: absolute;
      z-index: var(--krn-z-dropdown, 500);
      inset-block-start: calc(100% + 0.375rem);
      inset-inline: 0;
      display: grid;
      max-block-size: 24rem;
      overflow: auto;
      padding: 0.375rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-overlay, 0.75rem);
      background: var(--krn-color-surface-overlay, #fff);
      box-shadow: var(--krn-shadow-overlay, 0 12px 32px rgb(20 24 32 / 0.14));
    }
    .results button {
      display: flex;
      min-block-size: 3rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0.625rem;
      border: 0;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .results button[aria-selected='true'] {
      box-shadow: inset 3px 0 0 var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    .results span {
      display: grid;
      min-inline-size: 0;
    }
    .results small,
    .results em {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-style: normal;
    }
    .results p {
      padding: 1rem;
      color: var(--krn-color-text-muted, #626a76);
      text-align: center;
    }
  `,
})
export class KrnGlobalSearch {
  private readonly ids = inject(KrnIdService);
  private readonly locale = inject(KRN_LOCALE);
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input(this.translations.patterns.globalSearch);
  readonly placeholder = input(this.translations.patterns.searchPlaceholder);
  readonly clearLabel = input(this.translations.patterns.clearSearch);
  readonly resultsLabel = input(this.translations.patterns.resultLabel);
  readonly emptyResultsLabel = input(this.translations.patterns.noSearchResults);
  readonly results = input<readonly KrnSearchResult[]>([]);
  readonly maxResults = input(8, { transform: numberAttribute });
  readonly resultsId = input(this.ids.next('global-search-results'));
  readonly query = model('');
  readonly open = model(false);
  readonly activeIndex = model(0);
  readonly resultSelected = output<KrnSearchResult>();
  protected readonly filteredResults = computed(() => {
    const query = this.query().trim().toLocaleLowerCase(this.locale);
    if (!query) return [];
    return this.results()
      .filter((result) =>
        [result.label, result.description ?? '', ...(result.keywords ?? [])]
          .join(' ')
          .toLocaleLowerCase(this.locale)
          .includes(query),
      )
      .slice(0, this.maxResults());
  });
  protected readonly activeResultId = computed(() => {
    const result = this.filteredResults()[this.activeIndex()];
    return result ? this.resultOptionId(result.id) : null;
  });
  protected resultOptionId(id: string): string {
    return this.ids.fromKey(this.resultsId(), id);
  }

  protected onInput(event: Event): void {
    this.query.set((event.currentTarget as HTMLInputElement).value);
    this.activeIndex.set(0);
    this.open.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const results = this.filteredResults();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      const result = results[this.activeIndex()];
      if (result) {
        event.preventDefault();
        this.choose(result);
      }
    } else if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  protected choose(result: KrnSearchResult): void {
    this.query.set(result.label);
    this.open.set(false);
    this.resultSelected.emit(result);
  }

  protected clear(): void {
    this.query.set('');
    this.open.set(false);
  }
}

@Component({
  selector: 'krn-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge],
  template: `
    <div class="filters" [attr.aria-label]="ariaLabel()" role="group">
      @for (filter of filters(); track filter.id) {
        <label>
          <span>{{ filter.label }}</span>
          <select [value]="values()[filter.id] ?? ''" (change)="setFilter(filter.id, $event)">
            <option value="">{{ allLabel() }}</option>
            @for (option of filter.options; track option.value) {
              <option [value]="option.value">
                {{ option.label }}{{ option.count === undefined ? '' : ' · ' + option.count }}
              </option>
            }
          </select>
        </label>
      }
      @if (activeCount()) {
        <krn-badge tone="brand">{{ activeLabel()(activeCount()) }}</krn-badge>
        <button type="button" (click)="clear()">{{ clearAllLabel() }}</button>
      }
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      color: var(--krn-color-text, #252932);
    }
    .filters {
      display: flex;
      min-block-size: 3.5rem;
      align-items: end;
      gap: 0.625rem;
      padding: 0.625rem;
      overflow-x: auto;
      border-block: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      background: var(--krn-color-surface, #fff);
    }
    label {
      display: grid;
      flex: 0 0 auto;
      gap: 0.125rem;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.6875rem;
      font-weight: 650;
      text-transform: uppercase;
    }
    select {
      min-block-size: 2rem;
      padding-inline: 0.5rem 1.75rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
      font: var(--krn-font-body-sm, 500 0.8125rem/1.25rem sans-serif);
      text-transform: none;
    }
    select:focus-visible,
    button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    button {
      min-block-size: 2rem;
      border: 0;
      color: var(--krn-color-brand-text, #1d4ed8);
      background: transparent;
      font: inherit;
      font-weight: 620;
      cursor: pointer;
      white-space: nowrap;
    }
  `,
})
export class KrnFilterBar {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input(this.translations.patterns.filters);
  readonly allLabel = input(this.translations.patterns.all);
  readonly activeLabel = input(this.translations.patterns.activeFilters);
  readonly clearAllLabel = input(this.translations.patterns.clearAll);
  readonly filters = input<readonly KrnFilterDefinition[]>([]);
  readonly values = model<Readonly<Partial<Record<string, string>>>>({});
  protected readonly activeCount = computed(
    () => Object.values(this.values()).filter(Boolean).length,
  );

  protected setFilter(id: string, event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    this.values.update((current) => ({ ...current, [id]: value }));
  }

  protected clear(): void {
    this.values.set({});
  }
}

@Component({
  selector: 'krn-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      <div class="index">{{ index() }}</div>
      <div class="copy">
        @if (eyebrow()) {
          <span class="eyebrow">{{ eyebrow() }}</span>
        }
        <h1>{{ heading() }}</h1>
        @if (description()) {
          <p>{{ description() }}</p>
        }
        <ng-content select="[krnPageHeaderMeta]" />
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }
    .frame {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr) auto;
      gap: var(--krn-space-4, 1rem);
      align-items: center;
      padding-block: var(--krn-space-8, 2rem);
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      color: var(--krn-color-text, #252932);
    }
    .index {
      align-self: start;
      padding-block-start: 0.375rem;
      color: var(--krn-color-text-subtle, #737373);
      font:
        500 0.6875rem/1 var(--krn-font-family-mono, ui-monospace),
        monospace;
      letter-spacing: 0.02em;
    }
    .copy {
      display: grid;
      max-inline-size: 52rem;
      gap: 0.375rem;
    }
    .eyebrow {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-weight: 550;
      letter-spacing: 0.01em;
    }
    h1,
    p {
      margin: 0;
    }
    h1 {
      font-family: var(--krn-font-family-sans, sans-serif);
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 600;
      letter-spacing: -0.045em;
      line-height: 1.08;
    }
    p {
      max-inline-size: 65ch;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 1rem;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: end;
    }
    @container (max-width: 42rem) {
      .frame {
        grid-template-columns: 1fr;
      }
      .index {
        border-inline-end: 0;
      }
      .actions {
        justify-content: start;
      }
    }
  `,
})
export class KrnPageHeader {
  readonly index = input('01');
  readonly eyebrow = input('');
  readonly heading = input.required<string>();
  readonly description = input('');
}

@Component({
  selector: 'krn-settings-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnDrawer],
  host: {
    '[attr.data-open]': 'open() ? "" : null',
  },
  template: `
    <ng-template #content>
      <ng-content />
    </ng-template>
    <ng-template #actions>
      <ng-content select="[krnSettingsActions]" />
    </ng-template>
    <krn-drawer
      [open]="open()"
      (openChange)="open.set($event)"
      [title]="heading()"
      [closeLabel]="closeLabel()"
      [ariaLabel]="heading()"
      [contentTemplate]="content"
      [actionsTemplate]="actions"
    />
  `,
})
export class KrnSettingsPanel {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly heading = input(this.translations.patterns.settings);
  readonly closeLabel = input(this.translations.patterns.closeSettings);
  readonly open = model(false);
}

@Component({
  selector: 'krn-crud-toolbar, krn-bulk-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'toolbar',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-bulk]': 'selectedCount() ? "" : null',
  },
  template: `
    <div class="primary">
      @if (selectedCount()) {
        <strong>{{ selectedLabel()(selectedCount()) }}</strong>
      } @else {
        <ng-content select="[krnToolbarTitle]" />
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      min-block-size: 3.5rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-inline: 0.75rem;
      border-block: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
    }
    :host([data-bulk]) {
      border-color: var(--krn-color-brand-border, #dc7352);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    .primary,
    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .actions {
      flex-wrap: wrap;
      justify-content: end;
    }
  `,
})
export class KrnCrudToolbar {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input(this.translations.patterns.actions);
  readonly selectedCount = input(0, { transform: numberAttribute });
  readonly selectedLabel = input(this.translations.patterns.selectedCount);
}

export { KrnCrudToolbar as KrnBulkActions, KrnCrudToolbar as KrnCRUDToolbar };

@Component({
  selector: 'krn-master-detail-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-detail-open]': 'detailOpen() ? "" : null',
  },
  template: `
    <aside class="master" [attr.aria-label]="masterLabel()">
      <ng-content select="[krnMaster]" />
    </aside>
    <main class="detail" [attr.aria-label]="detailLabel()">
      <ng-content select="[krnDetail]" />
    </main>
  `,
  styles: `
    :host {
      display: grid;
      min-block-size: 20rem;
      grid-template-columns: minmax(15rem, 0.38fr) minmax(0, 1fr);
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-surface, #fff);
    }
    .master {
      min-inline-size: 0;
      overflow: auto;
      border-inline-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
    }
    .detail {
      min-inline-size: 0;
      overflow: auto;
    }
    @container (max-width: 42rem) {
      :host {
        grid-template-columns: 1fr;
      }
      :host([data-detail-open]) .master {
        display: none;
      }
      :host(:not([data-detail-open])) .detail {
        display: none;
      }
      .master {
        border-inline-end: 0;
      }
    }
  `,
})
export class KrnMasterDetailLayout {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly masterLabel = input(this.translations.patterns.masterList);
  readonly detailLabel = input(this.translations.patterns.detail);
  readonly detailOpen = model(false);
}

@Component({
  selector: 'krn-dashboard-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnCard],
  template: `
    <krn-card [eyebrow]="eyebrow()" [heading]="heading()">
      <ng-content />
      <div krnCardFooter><ng-content select="[krnWidgetFooter]" /></div>
    </krn-card>
  `,
  styles: `
    :host,
    krn-card {
      display: block;
      block-size: 100%;
    }
  `,
})
export class KrnDashboardWidget {
  readonly eyebrow = input('');
  readonly heading = input.required<string>();
}

@Component({
  selector: 'krn-mobile-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      position: sticky;
      z-index: var(--krn-z-sticky, 300);
      inset-block-end: 0;
      display: grid;
      grid-auto-columns: minmax(3.5rem, 1fr);
      grid-auto-flow: column;
      min-block-size: 3.75rem;
      padding: 0.375rem max(0.375rem, env(safe-area-inset-right))
        max(0.375rem, env(safe-area-inset-bottom)) max(0.375rem, env(safe-area-inset-left));
      border-block-start: 1px solid var(--krn-color-border, #cdd1d7);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
    }
    :host ::ng-deep a,
    :host ::ng-deep button {
      display: grid;
      min-block-size: 3rem;
      place-items: center;
      border: 0;
      border-radius: var(--krn-radius-control, 0.375rem);
      color: var(--krn-color-text-muted, #626a76);
      background: transparent;
      font: 600 0.6875rem/1rem var(--krn-font-family-ui, sans-serif);
      text-decoration: none;
    }
    :host ::ng-deep [aria-current='page'] {
      box-shadow: inset 0 3px 0 var(--krn-color-brand-solid, #4f6feb);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
  `,
})
export class KrnMobileNavigation {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input(this.translations.patterns.mobileNavigation);
}

@Component({
  selector: 'krn-responsive-application-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-navigation-open]': 'navigationOpen() ? "" : null',
  },
  template: `
    <header><ng-content select="[krnAppHeader]" /></header>
    <aside><ng-content select="[krnAppNavigation]" /></aside>
    <main [id]="mainId()" tabindex="-1"><ng-content /></main>
    <footer><ng-content select="[krnAppMobileNavigation]" /></footer>
  `,
  styles: `
    :host {
      display: grid;
      min-block-size: 100dvb;
      grid-template: auto minmax(0, 1fr) / auto minmax(0, 1fr);
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-canvas, #faf9f7);
    }
    header {
      z-index: var(--krn-z-sticky, 300);
      grid-column: 1 / -1;
    }
    aside {
      min-inline-size: var(--krn-app-sidebar-width, 15rem);
      overflow: auto;
      border-inline-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      background: var(--krn-color-surface, #fff);
    }
    main {
      min-inline-size: 0;
      overflow: auto;
    }
    footer {
      display: none;
    }
    @media (max-width: 48rem) {
      :host {
        grid-template: auto minmax(0, 1fr) auto / minmax(0, 1fr);
      }
      aside {
        position: fixed;
        z-index: var(--krn-z-drawer, 700);
        inset-block: var(--krn-app-header-height, 3.5rem) 0;
        inset-inline-start: 0;
        inline-size: min(20rem, 88vi);
        translate: -102% 0;
        transition: translate var(--krn-motion-duration-enter)
          var(--krn-ease-enter, cubic-bezier(0.16, 1, 0.3, 1));
      }
      :host-context([dir='rtl']) aside {
        translate: 102% 0;
      }
      :host([data-navigation-open]) aside {
        translate: 0;
      }
      main {
        grid-row: 2;
      }
      footer {
        display: block;
        grid-row: 3;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) aside {
        transition: none;
      }
    }
  `,
})
export class KrnResponsiveApplicationShell {
  readonly navigationOpen = model(false);
  readonly mainId = input('main-content');
}
