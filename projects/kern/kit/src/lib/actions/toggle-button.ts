import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  type OnInit,
  Renderer2,
} from '@angular/core';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';
import { KRN_TOGGLE_BUTTON_OPTIONS } from './toggle-button-options';
import { KRN_TOGGLE_GROUP } from './toggle-group-controller';
import type { KrnToggleGroupItem } from './toggle-group-controller';

@Component({
  selector: 'button[krnToggleButton]',
  templateUrl: './toggle-button.html',
  host: {
    class: 'krn-action krn-toggle-action',
    type: 'button',
    '[attr.data-pressed]': 'isPressed()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.value]': 'value()',
    '[attr.tabindex]': 'tabIndex()',
    '[disabled]': 'isDisabled()',
    '(click)': 'toggle()',
    '(focus)': 'notifyGroupFocus()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnToggleButton implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly group = inject(KRN_TOGGLE_GROUP, { optional: true });
  private readonly options = inject(KRN_TOGGLE_BUTTON_OPTIONS);
  private readonly renderer = inject(Renderer2);

  /**
   * Stable native value used by `KrnToggleGroup` as the selection identity.
   *
   * It remains required because group selection is represented by serializable
   * string values rather than child indices or component identities.
   */
  readonly value = input.required<string>();
  readonly size = input<KrnSize>(this.options.size);
  readonly pressedVariant = input<KrnActionVariant>(this.options.pressedVariant);
  readonly pressedTone = input<KrnTone>(this.options.pressedTone);
  readonly unpressedVariant = input<KrnActionVariant>(this.options.unpressedVariant);
  readonly unpressedTone = input<KrnTone>(this.options.unpressedTone);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Standalone state model. Inside a Toggle Group, the group values are authoritative. */
  readonly pressed = model(false);

  protected readonly isPressed = computed(() =>
    this.group ? this.group.isSelected(this.value()) : this.pressed(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || Boolean(this.group?.disabled()),
  );
  protected readonly variant = computed(() =>
    this.isPressed() ? this.pressedVariant() : this.unpressedVariant(),
  );
  protected readonly tone = computed(() =>
    this.isPressed() ? this.pressedTone() : this.unpressedTone(),
  );

  private readonly groupItem: KrnToggleGroupItem = {
    element: this.elementRef.nativeElement,
    value: () => this.value(),
    disabled: () => this.isDisabled(),
  };
  private unregisterFromGroup: (() => void) | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.unregisterFromGroup?.());
  }

  ngOnInit(): void {
    this.unregisterFromGroup = this.group?.register(this.groupItem);
  }

  protected tabIndex(): 0 | -1 | null {
    return this.group?.tabIndexFor(this.groupItem) ?? null;
  }

  protected notifyGroupFocus(): void {
    this.group?.notifyFocus(this.groupItem);
  }

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.group) {
      this.group.toggle(this.value());
    } else {
      this.pressed.update((pressed) => !pressed);
    }

    this.syncAriaPressed();
  }

  /**
   * `aria-pressed` is component-owned derived state. Reassert it during every
   * browser and server check so a competing consumer attribute cannot leave
   * visual state, model state, and accessibility state out of sync.
   */
  protected ngDoCheck(): void {
    this.syncAriaPressed();
  }

  private syncAriaPressed(): void {
    const pressed = String(this.isPressed());
    if (this.elementRef.nativeElement.getAttribute('aria-pressed') !== pressed) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-pressed', pressed);
    }
  }
}
