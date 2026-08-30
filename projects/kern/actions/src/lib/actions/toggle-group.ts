import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  inject,
  model,
  signal,
} from '@angular/core';
import type { Provider } from '@angular/core';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import type { KrnOrientation, KrnSize } from './action-types';
import { KRN_TOGGLE_GROUP } from './toggle-group-controller';
import type { KrnToggleGroupController, KrnToggleGroupItem } from './toggle-group-controller';
import { KRN_TOGGLE_GROUP_OPTIONS } from './toggle-group-options';

const TOGGLE_GROUP_PROVIDER: Provider = {
  provide: KRN_TOGGLE_GROUP,
  deps: [/* @__PURE__ */ forwardRef(() => KrnToggleGroup)],
  useFactory: (group: KrnToggleGroup): KrnToggleGroupController =>
    group as unknown as KrnToggleGroupController,
};

@Component({
  selector: 'div[krnToggleGroup]',
  providers: [TOGGLE_GROUP_PROVIDER],
  host: {
    class: 'krn-action-group krn-toggle-group',
    role: 'toolbar',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-multiple]': 'multiple()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-connected]': 'connected()',
    '[attr.data-size]': 'size()',
    '(keydown)': 'navigate($event)',
  },
  templateUrl: './toggle-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnToggleGroup {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly options = inject(KRN_TOGGLE_GROUP_OPTIONS);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly activeItem = signal<KrnToggleGroupItem | null>(null);
  private readonly itemVersion = signal(0);
  private items: KrnToggleGroupItem[] = [];

  /** Defines both the visual layout axis and the toolbar Arrow-key axis. */
  readonly orientation = input<KrnOrientation>(this.options.orientation);
  /** Controls the density of every direct toggle without repeating size on each item. */
  readonly size = input<KrnSize>('sm');
  /** Joins direct toggles into a single segmented control surface. */
  readonly connected = input(true, { transform: booleanAttribute });
  /** Allows multiple pressed values; false exposes at most one effective pressed value. */
  readonly multiple = input(this.options.multiple, { transform: booleanAttribute });
  /** Disables every registered native toggle and all group-owned value transitions. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Controlled stable string values; user transitions always emit a fresh frozen array. */
  readonly values = model<readonly string[]>([]);

  private readonly effectiveValues = computed<readonly string[]>(() => {
    const requested: unknown = this.values();
    const unique = Array.isArray(requested)
      ? [...new Set(requested.filter((value): value is string => typeof value === 'string'))]
      : [];
    return this.multiple() ? unique : unique.slice(0, 1);
  });

  private isSelected(value: string): boolean {
    return this.effectiveValues().includes(value);
  }

  private toggle(value: string): void {
    if (this.disabled()) {
      return;
    }

    const current = this.effectiveValues();
    const next = this.multiple()
      ? current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      : current.includes(value)
        ? []
        : [value];

    const requested: unknown = this.values();
    const currentInput = Array.isArray(requested) ? requested : [];
    if (
      next.length === currentInput.length &&
      next.every((item, index) => item === currentInput[index])
    ) {
      return;
    }

    this.values.set(Object.freeze([...next]));
  }

  private register(item: KrnToggleGroupItem): () => void {
    if (!this.items.includes(item)) {
      this.items = [...this.items, item];
      this.itemVersion.update((version) => version + 1);
    }

    return () => {
      if (!this.items.includes(item)) {
        return;
      }

      this.items = this.items.filter((candidate) => candidate !== item);
      if (this.activeItem() === item) {
        this.activeItem.set(null);
      }
      this.itemVersion.update((version) => version + 1);
    };
  }

  private tabIndexFor(item: KrnToggleGroupItem): 0 | -1 {
    return this.entryItem() === item ? 0 : -1;
  }

  private notifyFocus(item: KrnToggleGroupItem): void {
    if (this.items.includes(item) && !item.disabled()) {
      this.activeItem.set(item);
    }
  }

  protected navigate(event: KeyboardEvent): void {
    if (
      this.disabled() ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const horizontal = this.orientation() === 'horizontal';
    const relevantArrow = horizontal
      ? event.key === 'ArrowLeft' || event.key === 'ArrowRight'
      : event.key === 'ArrowUp' || event.key === 'ArrowDown';

    if (!relevantArrow && event.key !== 'Home' && event.key !== 'End') {
      return;
    }

    const enabled = this.orderedItems().filter((item) => !item.disabled());
    const current = enabled.findIndex((item) => item.element === event.target);
    if (current < 0 || enabled.length === 0) {
      return;
    }

    const rightToLeft =
      horizontal &&
      this.platform.window?.getComputedStyle(this.elementRef.nativeElement).direction === 'rtl';
    const forward = rightToLeft ? -1 : 1;
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? forward
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -forward
          : 0;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabled.length - 1
          : (current + delta + enabled.length) % enabled.length;
    const next = enabled[nextIndex];

    if (!next) {
      return;
    }

    event.preventDefault();
    this.activeItem.set(next);
    next.element.focus();
  }

  private entryItem(): KrnToggleGroupItem | null {
    this.itemVersion();
    const enabled = this.orderedItems().filter((item) => !item.disabled());
    const active = this.activeItem();

    if (active && enabled.includes(active)) {
      return active;
    }

    return enabled.find((item) => this.isSelected(item.value())) ?? enabled[0] ?? null;
  }

  private orderedItems(): readonly KrnToggleGroupItem[] {
    return [...this.items].sort((left, right) => {
      if (
        left.element === right.element ||
        typeof left.element.compareDocumentPosition !== 'function'
      ) {
        return 0;
      }

      const position = left.element.compareDocumentPosition(right.element);
      if (position & 4) {
        return -1;
      }
      if (position & 2) {
        return 1;
      }
      return 0;
    });
  }
}
