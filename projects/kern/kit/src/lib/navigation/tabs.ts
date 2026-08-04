import type { TemplateRef } from '@angular/core';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { KRN_PLATFORM, KrnIdService } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnNavigationOrientation, KrnTabItem } from './navigation.types';

interface TabScrollAdjustment {
  readonly list: HTMLElement | null;
  readonly left: number;
}

@Component({
  selector: 'krn-tabs, krn-vertical-tabs',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #tabList
      class="tab-list"
      role="tablist"
      [class.vertical]="resolvedOrientation() === 'vertical'"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-orientation]="resolvedOrientation()"
    >
      @for (item of items(); track item.id; let index = $index) {
        <button
          #tab
          type="button"
          role="tab"
          [id]="tabId(item)"
          [disabled]="item.disabled"
          [attr.aria-selected]="selectedId() === item.id"
          [attr.aria-controls]="panelId(item)"
          [attr.tabindex]="selectedId() === item.id ? 0 : -1"
          (click)="select(item)"
          (keydown)="onKeydown($event, index)"
        >
          <span>{{ item.label }}</span>
          @if (item.badge !== undefined) {
            <span
              class="badge"
              [attr.aria-label]="translations.navigation.tabItemCount(item.badge)"
            >
              {{ item.badge }}
            </span>
          }
        </button>
      }
    </div>
    @if (selectedItem(); as item) {
      <section
        class="tab-panel"
        role="tabpanel"
        tabindex="0"
        [id]="panelId(item)"
        [attr.aria-labelledby]="tabId(item)"
      >
        @if (item.content) {
          <ng-container [ngTemplateOutlet]="asTemplate(item.content)" />
        } @else {
          <ng-content />
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    :host([hidden]) {
      display: none;
    }
    .tab-list {
      position: relative;
      display: flex;
      max-inline-size: 100%;
      align-items: flex-end;
      gap: var(--krn-space-1);
      overflow-x: auto;
      border-block-end: var(--krn-border-width-1) solid var(--krn-color-border);
      overscroll-behavior-inline: contain;
      scrollbar-width: thin;
    }
    button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--krn-space-2);
      min-block-size: var(--krn-control-height-md);
      padding-inline: var(--krn-control-padding-inline);
      border: 0;
      background: transparent;
      color: var(--krn-color-text-muted);
      font: inherit;
      font-weight: var(--krn-font-weight-medium);
      white-space: nowrap;
      cursor: pointer;
    }
    button::after {
      position: absolute;
      inset-inline: var(--krn-space-2);
      inset-block-end: calc(var(--krn-border-width-1) * -1);
      block-size: calc(var(--krn-border-width-1) * 2);
      background: var(--krn-color-primary);
      content: '';
      opacity: 0;
      transform: scaleX(0.35);
      transition:
        opacity var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard),
        transform var(--krn-motion-duration-selection) var(--krn-motion-ease-enter);
    }
    button:hover:not(:disabled) {
      color: var(--krn-color-text);
      background: var(--krn-color-surface-subtle);
    }
    button[aria-selected='true'] {
      color: var(--krn-color-text);
    }
    button[aria-selected='true']::after {
      opacity: 1;
      transform: scaleX(1);
    }
    button:focus-visible {
      z-index: 1;
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: calc(var(--krn-focus-ring-offset) * -1);
      border-radius: var(--krn-radius-sm);
    }
    button:disabled {
      color: var(--krn-color-text-disabled);
      cursor: not-allowed;
    }
    .badge {
      min-inline-size: var(--krn-space-5);
      padding-inline: var(--krn-space-1);
      border-radius: var(--krn-radius-full);
      background: var(--krn-color-surface-sunken);
      font-size: var(--krn-font-size-xs);
      font-variant-numeric: tabular-nums;
    }
    .tab-panel {
      padding-block: var(--krn-space-5);
      outline: none;
    }
    .tab-panel:focus-visible {
      border-radius: var(--krn-radius-sm);
      box-shadow: var(--krn-focus-ring-shadow);
    }
    .tab-list.vertical {
      align-items: stretch;
      flex-direction: column;
      overflow: visible;
      border-block-end: 0;
      border-inline-end: var(--krn-border-width-1) solid var(--krn-color-border);
    }
    .vertical button {
      justify-content: flex-start;
    }
    .vertical button::after {
      inset-block: var(--krn-space-2);
      inset-inline: auto calc(var(--krn-border-width-1) * -1);
      inline-size: calc(var(--krn-border-width-1) * 2);
      block-size: auto;
      transform: scaleY(0.35);
    }
    .vertical button[aria-selected='true']::after {
      transform: scaleY(1);
    }
    @media (prefers-reduced-motion: reduce) {
      :host-context(html:not([data-krn-motion='full'])) button::after {
        transition: none;
      }
    }
    @media (forced-colors: active) {
      button[aria-selected='true']::after {
        background: Highlight;
      }
      button:focus-visible {
        outline-color: Highlight;
      }
      .tab-list,
      .tab-list.vertical {
        border-color: CanvasText;
      }
    }
  `,
})
export class KrnTabs {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ids = inject(KrnIdService);
  private readonly platform = inject(KRN_PLATFORM);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  private readonly instanceId = this.ids.next('tabs');
  private readonly tabList = viewChild<ElementRef<HTMLElement>>('tabList');
  private readonly tabElements = viewChildren<ElementRef<HTMLButtonElement>>('tab');
  private readonly tabListResizeRevision = signal(0);
  readonly items = input<readonly KrnTabItem[]>([]);
  readonly value = model<string | null>(null);
  readonly orientation = input<KrnNavigationOrientation>(
    this.host.nativeElement.localName === 'krn-vertical-tabs' ? 'vertical' : 'horizontal',
  );
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedOrientation = computed<KrnNavigationOrientation>(() =>
    this.orientation() === 'vertical' ? 'vertical' : 'horizontal',
  );
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.sections.trim() || null,
  );
  protected readonly selectedId = computed(() => {
    const requested = this.value();
    const items = this.items();
    return items.some((item) => item.id === requested && !item.disabled)
      ? requested
      : (items.find((item) => !item.disabled)?.id ?? null);
  });
  protected readonly selectedItem = computed(
    () => this.items().find((item) => item.id === this.selectedId()) ?? null,
  );

  constructor() {
    afterRenderEffect({
      write: (onCleanup) => {
        const list = this.tabList()?.nativeElement;
        const ResizeObserverConstructor = list?.ownerDocument.defaultView?.ResizeObserver;
        if (!list || !ResizeObserverConstructor) {
          return;
        }

        const observer = new ResizeObserverConstructor(() => {
          this.tabListResizeRevision.update((revision) => revision + 1);
        });
        observer.observe(list);
        onCleanup(() => observer.disconnect());
      },
    });
    afterRenderEffect({
      earlyRead: (): TabScrollAdjustment => {
        this.tabListResizeRevision();
        const selectedId = this.selectedId();
        const selectedIndex = this.items().findIndex(
          (item) => item.id === selectedId && !item.disabled,
        );
        const list = this.tabList()?.nativeElement ?? null;
        const selectedTab = this.tabElements()[selectedIndex]?.nativeElement;
        if (this.resolvedOrientation() !== 'horizontal' || !list || !selectedTab) {
          return { list, left: 0 };
        }

        const listRect = list.getBoundingClientRect();
        const tabRect = selectedTab.getBoundingClientRect();
        const left =
          tabRect.left < listRect.left
            ? tabRect.left - listRect.left
            : tabRect.right > listRect.right
              ? tabRect.right - listRect.right
              : 0;
        return { list, left };
      },
      write: (adjustment) => {
        const { list, left } = adjustment();
        if (list && Math.abs(left) > 0.5) {
          list.scrollBy?.({ behavior: 'auto', left });
        }
      },
    });
  }

  protected tabId(item: KrnTabItem): string {
    return `${this.instanceId}-tab-${item.id}`;
  }

  protected panelId(item: KrnTabItem): string {
    return `${this.instanceId}-panel-${item.id}`;
  }

  protected asTemplate(template: TemplateRef<unknown>): TemplateRef<unknown> {
    return template;
  }

  protected select(item: KrnTabItem): void {
    if (item.disabled) return;
    this.value.set(item.id);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const orientation = this.resolvedOrientation();
    const rightToLeft =
      orientation === 'horizontal' &&
      this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const forward = rightToLeft ? -1 : 1;
    const relevantArrow =
      orientation === 'horizontal'
        ? event.key === 'ArrowLeft' || event.key === 'ArrowRight'
        : event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (!relevantArrow && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const items = this.items();
    if (items.length === 0) return;

    let next = currentIndex;
    if (event.key === 'Home') {
      next = items.findIndex((item) => !item.disabled);
    } else if (event.key === 'End') {
      for (let index = items.length - 1; index >= 0; index -= 1) {
        if (!items[index]?.disabled) {
          next = index;
          break;
        }
      }
    } else {
      const direction =
        event.key === 'ArrowRight'
          ? forward
          : event.key === 'ArrowLeft'
            ? -forward
            : event.key === 'ArrowDown'
              ? 1
              : -1;
      do {
        next = (next + direction + items.length) % items.length;
      } while (items[next]?.disabled && next !== currentIndex);
    }
    const item = items[next];
    if (item && !item.disabled) {
      this.select(item);
      this.tabElements()[next]?.nativeElement.focus();
    }
  }
}

export { KrnTabs as KrnVerticalTabs };
