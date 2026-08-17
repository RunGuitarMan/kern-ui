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
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
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
