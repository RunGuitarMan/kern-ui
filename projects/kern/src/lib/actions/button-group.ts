import type {
  Provider} from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  InjectionToken,
  input,
  model,
  output,
  inject,
} from '@angular/core';
import type { KrnOrientation, KrnSize } from './action-types';

interface KrnToggleGroupController {
  isSelected(value: string): boolean;
  toggle(value: string): void;
  readonly disabled: () => boolean;
}

const KRN_TOGGLE_GROUP = new InjectionToken<KrnToggleGroupController>('KRN_TOGGLE_GROUP');

const TOGGLE_GROUP_PROVIDER: Provider = {
  provide: KRN_TOGGLE_GROUP,
  useExisting: forwardRef(() => KrnToggleGroup),
};

@Component({
  selector: 'krn-button-group',
  host: {
    class: 'krn-action-group',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.data-orientation]': 'orientation()',
  },
  template: `<ng-content />`,
  styleUrl: './actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnButtonGroup {
  readonly ariaLabel = input('');
  readonly orientation = input<KrnOrientation>('horizontal');
}

@Component({
  selector: 'krn-toggle-group',
  providers: [TOGGLE_GROUP_PROVIDER],
  host: {
    class: 'krn-action-group',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.data-orientation]': 'orientation()',
  },
  template: `<ng-content />`,
  styleUrl: './actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnToggleGroup implements KrnToggleGroupController {
  readonly ariaLabel = input.required<string>();
  readonly orientation = input<KrnOrientation>('horizontal');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly values = model<readonly string[]>([]);
  readonly selectionChange = output<readonly string[]>();

  isSelected(value: string): boolean {
    return this.values().includes(value);
  }

  toggle(value: string): void {
    if (this.disabled()) {
      return;
    }

    const current = this.values();
    const next = this.multiple()
      ? current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      : current.includes(value)
        ? []
        : [value];

    this.values.set(next);
    this.selectionChange.emit(next);
  }
}

@Component({
  selector: 'krn-toggle-button',
  template: `
    <button
      class="krn-action"
      type="button"
      [attr.aria-pressed]="isPressed()"
      [attr.data-size]="size()"
      [attr.data-tone]="isPressed() ? 'brand' : 'neutral'"
      [attr.data-variant]="isPressed() ? 'soft' : 'ghost'"
      [disabled]="isDisabled()"
      (click)="toggle()"
    >
      <span class="krn-action__label"><ng-content /></span>
    </button>
  `,
  styleUrl: './actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnToggleButton {
  private readonly group = inject(KRN_TOGGLE_GROUP, { optional: true });

  readonly value = input.required<string>();
  readonly size = input<KrnSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pressed = model(false);
  readonly toggled = output<boolean>();

  protected readonly isPressed = computed(() =>
    this.group ? this.group.isSelected(this.value()) : this.pressed(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || Boolean(this.group?.disabled()),
  );

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }
    if (this.group) {
      this.group.toggle(this.value());
    } else {
      this.pressed.update((pressed) => !pressed);
    }
    this.toggled.emit(this.isPressed());
  }
}
