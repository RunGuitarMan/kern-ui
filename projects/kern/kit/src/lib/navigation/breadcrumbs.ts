import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnBreadcrumbItem } from './navigation.types';

interface VisibleBreadcrumb extends KrnBreadcrumbItem {
  readonly source: KrnBreadcrumbItem;
  readonly index: number;
  readonly ellipsis?: true;
}

const DEFAULT_MAX_ITEMS = 5;

@Component({
  selector: 'krn-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs" [attr.aria-label]="resolvedAriaLabel()">
      <ol>
        @for (item of visibleItems(); track item.index; let last = $last) {
          <li>
            @if (item.ellipsis) {
              <button
                type="button"
                class="ellipsis"
                (click)="expanded.set(true)"
                [attr.aria-label]="resolvedShowAllLabel()"
              >
                <span aria-hidden="true">•••</span>
              </button>
            } @else if (item.index === currentIndex()) {
              <span class="current" aria-current="page">{{ item.label }}</span>
            } @else if (item.href && !item.disabled) {
              <a [href]="item.href" (click)="itemActivated.emit(item.source)">{{ item.label }}</a>
            } @else {
              <span [attr.aria-disabled]="item.disabled || null">{{ item.label }}</span>
            }
            @if (!last) {
              <span class="separator" aria-hidden="true">{{ separator() }}</span>
            }
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
    .breadcrumbs {
      color: var(--krn-color-text-muted);
      font-size: var(--krn-font-size-sm);
      line-height: var(--krn-line-height-body);
    }
    ol {
      display: flex;
      min-inline-size: 0;
      align-items: center;
      gap: var(--krn-space-0-5);
      margin: 0;
      padding: 0;
      overflow-x: auto;
      list-style: none;
      scrollbar-width: thin;
    }
    li {
      display: flex;
      min-inline-size: 0;
      align-items: center;
      white-space: nowrap;
    }
    a,
    button {
      color: inherit;
      font: inherit;
    }
    a {
      display: inline-flex;
      min-block-size: var(--krn-control-height-sm);
      align-items: center;
      padding-inline: var(--krn-space-2);
      border-radius: var(--krn-radius-sm);
      text-decoration: none;
      transition:
        color var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard),
        background var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard);
    }
    a:hover {
      color: var(--krn-color-text);
      background: var(--krn-color-surface-subtle);
    }
    a:focus-visible,
    button:focus-visible {
      border-radius: var(--krn-radius-sm);
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
    .current {
      max-inline-size: 24ch;
      overflow: hidden;
      padding-inline: var(--krn-space-2);
      color: var(--krn-color-text);
      font-weight: var(--krn-font-weight-semibold);
      text-overflow: ellipsis;
    }
    .separator {
      margin-inline: var(--krn-space-0-5);
      color: var(--krn-color-text-subtle);
      font-size: var(--krn-font-size-md);
      line-height: 1;
    }
    .ellipsis {
      display: grid;
      min-inline-size: var(--krn-control-height-sm);
      min-block-size: var(--krn-control-height-sm);
      padding: 0;
      border: 0;
      border-radius: var(--krn-radius-sm);
      background: transparent;
      place-items: center;
      cursor: pointer;
    }
    .ellipsis:hover {
      color: var(--krn-color-text);
      background: var(--krn-color-surface-subtle);
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) a {
        transition: none;
      }
    }
    @media (forced-colors: active) {
      a:focus-visible,
      button:focus-visible {
        outline-color: Highlight;
      }
    }
  `,
})
export class KrnBreadcrumbs {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly items = input<readonly KrnBreadcrumbItem[]>([]);
  readonly maxItems = input(5, { transform: numberAttribute });
  readonly separator = input('›');
  readonly ariaLabel = input(this.translations.navigation.breadcrumb);
  readonly moreLabel = input(this.translations.navigation.breadcrumbMore);
  readonly showAllLabel = input(this.translations.navigation.breadcrumbShowAll);
  readonly itemActivated = output<KrnBreadcrumbItem>();
  protected readonly expanded = signal(false);
  protected readonly resolvedMaxItems = computed(() => {
    const maxItems = this.maxItems();
    return Number.isFinite(maxItems) ? Math.max(0, Math.trunc(maxItems)) : DEFAULT_MAX_ITEMS;
  });
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.breadcrumb.trim() || null,
  );
  protected readonly resolvedShowAllLabel = computed(
    () =>
      this.showAllLabel()?.trim() ||
      this.translations.navigation.breadcrumbShowAll.trim() ||
      this.translations.navigation.breadcrumbMore.trim(),
  );
  protected readonly currentIndex = computed(() => this.items().length - 1);
  protected readonly ellipsis = computed<VisibleBreadcrumb>(() => ({
    label: this.moreLabel(),
    source: { label: this.moreLabel() },
    index: -1,
    ellipsis: true,
  }));
  protected readonly visibleItems = computed<readonly VisibleBreadcrumb[]>(() => {
    const items = this.items();
    const visibleItems = items.map((item, index) => ({ ...item, source: item, index }));
    const maxItems = this.resolvedMaxItems();
    if (this.expanded() || maxItems < 3 || items.length <= maxItems) {
      return visibleItems;
    }
    const tailCount = Math.max(1, maxItems - 2);
    const tailIndices = Array.from(
      { length: tailCount },
      (_, offset) => items.length - tailCount + offset,
    );
    return [visibleItems[0]!, this.ellipsis(), ...tailIndices.map((index) => visibleItems[index]!)];
  });

  constructor() {
    let previousItems = this.items();
    let previousMaxItems = this.resolvedMaxItems();

    effect(() => {
      const items = this.items();
      const maxItems = this.resolvedMaxItems();
      if (items !== previousItems || maxItems !== previousMaxItems) {
        this.expanded.set(false);
        previousItems = items;
        previousMaxItems = maxItems;
      }
    });
  }
}
