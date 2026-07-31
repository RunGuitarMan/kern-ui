import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  input,
  inject,
  model,
  Renderer2,
  signal,
} from '@angular/core';
import type { Provider } from '@angular/core';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import type { KrnOrientation } from './action-types';
import { KRN_TOGGLE_GROUP } from './toggle-group-controller';
import type { KrnToggleGroupController, KrnToggleGroupItem } from './toggle-group-controller';
import { KRN_TOGGLE_GROUP_OPTIONS } from './toggle-group-options';

const LEGACY_ARIA_LABEL_BEFORE_ATTRIBUTE = 'data-krn-legacy-aria-label-before';

function readSerializedAriaLabel(host: HTMLElement): string | null | undefined {
  const serialized = host.getAttribute(LEGACY_ARIA_LABEL_BEFORE_ATTRIBUTE);
  if (serialized === null) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(serialized);
    return typeof value === 'string' || value === null ? value : undefined;
  } catch {
    return undefined;
  }
}

const TOGGLE_GROUP_PROVIDER: Provider = {
  provide: KRN_TOGGLE_GROUP,
  deps: [/* @__PURE__ */ forwardRef(() => KrnToggleGroup)],
  useFactory: (group: KrnToggleGroup): KrnToggleGroupController =>
    group as unknown as KrnToggleGroupController,
};

@Component({
  selector: 'div[krnToggleGroup], krn-toggle-group',
  providers: [TOGGLE_GROUP_PROVIDER],
  host: {
    class: 'krn-action-group krn-toggle-group',
    role: 'toolbar',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-multiple]': 'multiple()',
    '[attr.data-orientation]': 'orientation()',
    '(keydown)': 'navigate($event)',
  },
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnToggleGroup {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly options = inject(KRN_TOGGLE_GROUP_OPTIONS);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly renderer = inject(Renderer2);
  private readonly activeItem = signal<KrnToggleGroupItem | null>(null);
  private readonly itemVersion = signal(0);
  private items: KrnToggleGroupItem[] = [];
  private legacyAriaLabelOwned = (() => {
    const state = {
      active: false,
      before: null as string | null,
      destroyRef: inject(DestroyRef),
      destroyRegistered: false,
      last: null as string | null,
      observer: null as MutationObserver | null,
    };

    return state;
  })();

  /** Defines both the visual layout axis and the toolbar Arrow-key axis. */
  readonly orientation = input<KrnOrientation>(this.options.orientation);
  /** Allows multiple pressed values; false exposes at most one effective pressed value. */
  readonly multiple = input(this.options.multiple, { transform: booleanAttribute });
  /** Disables every registered native toggle and all group-owned value transitions. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Controlled stable string values; user transitions always emit a fresh frozen array. */
  readonly values = model<readonly string[]>([]);

  /**
   * Deprecated compatibility bridge for native accessible-name attributes.
   *
   * @deprecated Set native `aria-label` or `aria-labelledby` on the group host.
   * Server rendering expects a stable migration input; change it only after hydration.
   */
  readonly ariaLabel = input<string | null | undefined>(undefined);

  private readonly effectiveValues = computed<readonly string[]>(() => {
    const requested: unknown = this.values();
    const unique = Array.isArray(requested)
      ? [...new Set(requested.filter((value): value is string => typeof value === 'string'))]
      : [];
    return this.multiple() ? unique : unique.slice(0, 1);
  });

  private readonly syncLegacyAriaLabel = effect(() => {
    const ariaLabel = this.ariaLabel();
    const host = this.elementRef.nativeElement;
    const serializedBefore = readSerializedAriaLabel(host);

    if (
      (ariaLabel !== undefined || serializedBefore !== undefined) &&
      !this.legacyAriaLabelOwned.observer
    ) {
      const Observer = this.platform.window?.MutationObserver;

      if (Observer) {
        const observer = new Observer((records) => {
          if (this.legacyAriaLabelOwned.active && records.length > 0) {
            this.legacyAriaLabelOwned.before = host.getAttribute('aria-label');
            this.renderer.setAttribute(
              host,
              LEGACY_ARIA_LABEL_BEFORE_ATTRIBUTE,
              JSON.stringify(this.legacyAriaLabelOwned.before),
            );
          }
        });

        observer.observe(host, {
          attributeFilter: ['aria-label'],
          attributes: true,
        });
        this.legacyAriaLabelOwned.observer = observer;
        if (!this.legacyAriaLabelOwned.destroyRegistered) {
          this.legacyAriaLabelOwned.destroyRef.onDestroy(() =>
            this.legacyAriaLabelOwned.observer?.disconnect(),
          );
          this.legacyAriaLabelOwned.destroyRegistered = true;
        }
      }
    }

    const pendingNativeWrites = this.legacyAriaLabelOwned.observer?.takeRecords() ?? [];

    if (!this.legacyAriaLabelOwned.active && serializedBefore !== undefined) {
      this.legacyAriaLabelOwned.active = true;
      this.legacyAriaLabelOwned.before = serializedBefore;
      this.legacyAriaLabelOwned.last = host.getAttribute('aria-label');
    }

    if (
      this.legacyAriaLabelOwned.active &&
      (pendingNativeWrites.length > 0 ||
        (!this.legacyAriaLabelOwned.observer &&
          host.getAttribute('aria-label') !== this.legacyAriaLabelOwned.last))
    ) {
      this.legacyAriaLabelOwned.before = host.getAttribute('aria-label');
      this.renderer.setAttribute(
        host,
        LEGACY_ARIA_LABEL_BEFORE_ATTRIBUTE,
        JSON.stringify(this.legacyAriaLabelOwned.before),
      );
    }

    if (ariaLabel === undefined) {
      if (this.legacyAriaLabelOwned.active) {
        if (this.legacyAriaLabelOwned.before === null) {
          this.renderer.removeAttribute(host, 'aria-label');
        } else {
          this.renderer.setAttribute(host, 'aria-label', this.legacyAriaLabelOwned.before);
        }
        this.legacyAriaLabelOwned.observer?.takeRecords();
        this.legacyAriaLabelOwned.observer?.disconnect();
        this.legacyAriaLabelOwned.observer = null;
        this.renderer.removeAttribute(host, LEGACY_ARIA_LABEL_BEFORE_ATTRIBUTE);
        this.legacyAriaLabelOwned.active = false;
        this.legacyAriaLabelOwned.before = null;
        this.legacyAriaLabelOwned.last = null;
      }
      return;
    }

    if (!this.legacyAriaLabelOwned.active) {
      this.legacyAriaLabelOwned.before = host.getAttribute('aria-label');
      this.renderer.setAttribute(
        host,
        LEGACY_ARIA_LABEL_BEFORE_ATTRIBUTE,
        JSON.stringify(this.legacyAriaLabelOwned.before),
      );
    }
    this.legacyAriaLabelOwned.active = true;
    if (ariaLabel) {
      this.renderer.setAttribute(host, 'aria-label', ariaLabel);
      this.legacyAriaLabelOwned.last = ariaLabel;
    } else {
      this.renderer.removeAttribute(host, 'aria-label');
      this.legacyAriaLabelOwned.last = null;
    }
    this.legacyAriaLabelOwned.observer?.takeRecords();
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
