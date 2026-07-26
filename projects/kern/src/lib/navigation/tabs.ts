import type { TemplateRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { KrnNavigationOrientation, KrnTabItem } from './navigation.types';

let nextTabsId = 0;

@Component({
  selector: 'krn-tabs, krn-vertical-tabs',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tab-list"
      role="tablist"
      [class.vertical]="orientation() === 'vertical'"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-orientation]="orientation()"
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
            <span class="badge" [attr.aria-label]="item.badge + ' items'">{{ item.badge }}</span>
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
    :host{display:block;min-inline-size:0}.tab-list{position:relative;display:flex;align-items:flex-end;gap:var(--krn-space-1);border-block-end:var(--krn-border-width-1) solid var(--krn-color-border)}button{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:var(--krn-space-2);min-block-size:var(--krn-control-height-md);padding-inline:var(--krn-control-padding-inline);border:0;background:transparent;color:var(--krn-color-text-muted);font:inherit;font-weight:var(--krn-font-weight-medium);white-space:nowrap;cursor:pointer}button::after{position:absolute;inset-inline:var(--krn-space-2);inset-block-end:calc(var(--krn-border-width-1) * -1);block-size:calc(var(--krn-border-width-1) * 2);background:var(--krn-color-primary);content:"";opacity:0;transform:scaleX(.35);transition:opacity var(--krn-motion-duration-fast) var(--krn-motion-ease-standard),transform var(--krn-motion-duration-normal) var(--krn-motion-ease-enter)}button:hover:not(:disabled){color:var(--krn-color-text);background:var(--krn-color-surface-subtle)}button[aria-selected=true]{color:var(--krn-color-text)}button[aria-selected=true]::after{opacity:1;transform:scaleX(1)}button:focus-visible{z-index:1;outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:calc(var(--krn-focus-ring-offset) * -1);border-radius:var(--krn-radius-sm)}button:disabled{color:var(--krn-color-text-disabled);cursor:not-allowed}.badge{min-inline-size:var(--krn-space-5);padding-inline:var(--krn-space-1);border-radius:var(--krn-radius-full);background:var(--krn-color-surface-sunken);font-size:var(--krn-font-size-xs);font-variant-numeric:tabular-nums}.tab-panel{padding-block:var(--krn-space-5);outline:none}.tab-panel:focus-visible{border-radius:var(--krn-radius-sm);box-shadow:var(--krn-focus-ring-shadow)}.tab-list.vertical{align-items:stretch;flex-direction:column;border-block-end:0;border-inline-end:var(--krn-border-width-1) solid var(--krn-color-border)}.vertical button{justify-content:flex-start}.vertical button::after{inset-block:var(--krn-space-2);inset-inline:auto calc(var(--krn-border-width-1) * -1);inline-size:calc(var(--krn-border-width-1) * 2);block-size:auto;transform:scaleY(.35)}.vertical button[aria-selected=true]::after{transform:scaleY(1)}@media(prefers-reduced-motion:reduce){button::after{transition:none}}
  `,
})
export class KrnTabs {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly instanceId = `krn-tabs-${++nextTabsId}`;
  private readonly tabElements = viewChildren<ElementRef<HTMLButtonElement>>('tab');
  readonly items = input<readonly KrnTabItem[]>([]);
  readonly value = model<string | null>(null);
  readonly orientation = input<KrnNavigationOrientation>(
    this.host.nativeElement.localName === 'krn-vertical-tabs' ? 'vertical' : 'horizontal',
  );
  readonly ariaLabel = input('Sections');
  readonly valueChanged = output<string>();
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
    this.valueChanged.emit(item.id);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const direction =
      event.key === 'Home'
        ? -Infinity
        : event.key === 'End'
          ? Infinity
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? 1
            : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
              ? -1
              : 0;
    const relevantArrow =
      this.orientation() === 'horizontal'
        ? event.key === 'ArrowLeft' || event.key === 'ArrowRight'
        : event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (direction === 0 || (!relevantArrow && event.key !== 'Home' && event.key !== 'End')) return;
    event.preventDefault();
    const items = this.items();
    let next =
      direction === -Infinity
        ? 0
        : direction === Infinity
          ? items.length - 1
          : (currentIndex + direction + items.length) % items.length;
    while (items[next]?.disabled && next !== currentIndex) {
      next = (next + (direction < 0 ? -1 : 1) + items.length) % items.length;
    }
    const item = items[next];
    if (item && !item.disabled) {
      this.select(item);
      this.tabElements()[next]?.nativeElement.focus();
    }
  }
}

export { KrnTabs as KrnVerticalTabs };
