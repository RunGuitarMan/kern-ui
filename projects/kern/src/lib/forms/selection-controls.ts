import type { ElementRef, Provider } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  InjectionToken,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { KrnOrientation } from '../actions/action-types';
import type { KrnSegmentOption } from './form-types';
import { createKrnId } from './form-field';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

interface KrnCheckboxGroupController {
  readonly disabled: () => boolean;
  readonly readOnly: () => boolean;
  has(value: string): boolean;
  toggle(value: string, checked: boolean): void;
}

const KRN_CHECKBOX_GROUP = new InjectionToken<KrnCheckboxGroupController>('KRN_CHECKBOX_GROUP');

const CHECKBOX_GROUP_PROVIDER: Provider = {
  provide: KRN_CHECKBOX_GROUP,
  useExisting: forwardRef(() => KrnCheckboxGroup),
};

@Component({
  selector: 'krn-checkbox-group',
  providers: [
    CHECKBOX_GROUP_PROVIDER,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnCheckboxGroup),
      multi: true,
    },
  ],
  template: `
    <fieldset
      class="krn-choice-group"
      [attr.aria-describedby]="describedBy() || a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.data-orientation]="orientation()"
      [disabled]="isDisabled()"
      [id]="a11y.id()"
    >
      @if (label()) {
        <legend class="krn-label">{{ label() }}</legend>
      }
      <ng-content />
    </fieldset>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCheckboxGroup
  extends KrnValueAccessor<readonly string[]>
  implements KrnCheckboxGroupController
{
  readonly id = input('');
  readonly label = input('');
  readonly orientation = input<KrnOrientation>('vertical');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input('');
  readonly valueChange = output<readonly string[]>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'checkbox-group');

  constructor() {
    super([]);
  }

  protected override normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  has(value: string): boolean {
    return this.controlValue().includes(value);
  }

  toggle(value: string, checked: boolean): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    const current = this.controlValue();
    const next = checked
      ? current.includes(value)
        ? current
        : [...current, value]
      : current.filter((item) => item !== value);
    this.commitValue(next);
    this.touch();
    this.valueChange.emit(next);
  }
}

@Component({
  selector: 'krn-checkbox',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnCheckbox),
      multi: true,
    },
  ],
  template: `
    <label
      class="krn-choice"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="isReadOnly()"
    >
      <input
        class="krn-choice__native"
        type="checkbox"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        [attr.aria-disabled]="isReadOnly() || null"
        [attr.data-indeterminate]="indeterminate()"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [indeterminate]="indeterminate()"
        [name]="name()"
        [required]="required()"
        [value]="value()"
        (blur)="touch()"
        (change)="changeChecked($event)"
      />
      <span class="krn-choice__mark" aria-hidden="true">
        @if (indeterminate()) {
          −
        } @else if (checked()) {
          ✓
        }
      </span>
      <span class="krn-choice__text">
        <span><ng-content /></span>
        @if (description()) {
          <span class="krn-choice__description">{{ description() }}</span>
        }
      </span>
    </label>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCheckbox extends KrnValueAccessor<boolean> {
  private readonly group = inject(KRN_CHECKBOX_GROUP, { optional: true });

  readonly id = input('');
  readonly name = input('');
  readonly value = input(createKrnId('checkbox-option'));
  readonly ariaLabel = input('');
  readonly description = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly checkedChange = output<boolean>();

  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || Boolean(this.group?.disabled()),
  );
  protected readonly isReadOnly = computed(
    () => this.readOnly() || Boolean(this.group?.readOnly()),
  );
  protected readonly checked = computed(() =>
    this.group ? this.group.has(this.value()) : this.controlValue(),
  );
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'checkbox');

  constructor() {
    super(false);
  }

  protected override normalizeIncomingValue(value: unknown): boolean {
    return Boolean(value);
  }

  protected changeChecked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isReadOnly()) {
      input.checked = this.checked();
      return;
    }
    const checked = input.checked;
    if (this.group) {
      this.group.toggle(this.value(), checked);
    } else {
      this.commitValue(checked);
    }
    this.checkedChange.emit(checked);
  }
}

interface KrnRadioGroupController {
  readonly name: () => string;
  readonly disabled: () => boolean;
  readonly readOnly: () => boolean;
  isSelected(value: string): boolean;
  select(value: string): void;
}

const KRN_RADIO_GROUP = new InjectionToken<KrnRadioGroupController>('KRN_RADIO_GROUP');

const RADIO_GROUP_PROVIDER: Provider = {
  provide: KRN_RADIO_GROUP,
  useExisting: forwardRef(() => KrnRadioGroup),
};

@Component({
  selector: 'krn-radio-group',
  providers: [
    RADIO_GROUP_PROVIDER,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnRadioGroup),
      multi: true,
    },
  ],
  template: `
    <fieldset
      class="krn-choice-group"
      role="radiogroup"
      [attr.aria-describedby]="describedBy() || a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-readonly]="readOnly()"
      [attr.data-orientation]="orientation()"
      [disabled]="isDisabled()"
      [id]="a11y.id()"
    >
      @if (label()) {
        <legend class="krn-label">{{ label() }}</legend>
      }
      <ng-content />
    </fieldset>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRadioGroup
  extends KrnValueAccessor<string | null>
  implements KrnRadioGroupController
{
  private readonly generatedName = createKrnId('radio-group');

  readonly id = input('');
  readonly label = input('');
  readonly customName = input('', { alias: 'name' });
  readonly orientation = input<KrnOrientation>('vertical');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input('');
  readonly valueChange = output<string | null>();

  readonly name = computed(() => this.customName() || this.generatedName);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'radio-group');

  constructor() {
    super(null);
  }

  protected override normalizeIncomingValue(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  isSelected(value: string): boolean {
    return this.controlValue() === value;
  }

  select(value: string): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    this.commitValue(value);
    this.touch();
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-radio',
  template: `
    <label
      class="krn-choice"
      [attr.data-disabled]="isDisabled()"
      [attr.data-readonly]="isReadOnly()"
    >
      <input
        class="krn-choice__native"
        type="radio"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="isReadOnly() || null"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [name]="group?.name() || name()"
        [value]="value()"
        (change)="select($event)"
      />
      <span class="krn-choice__mark" aria-hidden="true"></span>
      <span class="krn-choice__text">
        <span><ng-content /></span>
        @if (description()) {
          <span class="krn-choice__description">{{ description() }}</span>
        }
      </span>
    </label>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRadio {
  protected readonly group = inject(KRN_RADIO_GROUP, { optional: true });

  readonly value = input.required<string>();
  readonly name = input(createKrnId('radio'));
  readonly ariaLabel = input('');
  readonly description = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly selected = output<string>();

  protected readonly isDisabled = computed(
    () => this.disabled() || Boolean(this.group?.disabled()),
  );
  protected readonly isReadOnly = computed(
    () => this.readOnly() || Boolean(this.group?.readOnly()),
  );
  protected readonly checked = computed(() => this.group?.isSelected(this.value()) ?? false);

  protected select(event: Event): void {
    if (this.isDisabled()) {
      return;
    }
    if (this.isReadOnly()) {
      (event.target as HTMLInputElement).checked = this.checked();
      return;
    }
    this.group?.select(this.value());
    this.selected.emit(this.value());
  }
}

@Component({
  selector: 'krn-switch',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnSwitch),
      multi: true,
    },
  ],
  template: `
    <label
      class="krn-choice krn-switch"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="readOnly()"
    >
      <input
        class="krn-choice__native"
        type="checkbox"
        role="switch"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="readOnly() || null"
        [checked]="controlValue()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [name]="name()"
        [required]="required()"
        (blur)="touch()"
        (change)="changeValue($event)"
      />
      <span class="krn-choice__mark" aria-hidden="true"></span>
      <span class="krn-choice__text">
        <span><ng-content /></span>
        @if (description()) {
          <span class="krn-choice__description">{{ description() }}</span>
        }
      </span>
    </label>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSwitch extends KrnValueAccessor<boolean> {
  readonly id = input('');
  readonly name = input('');
  readonly ariaLabel = input('');
  readonly description = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<boolean>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'switch');

  constructor() {
    super(false);
  }

  protected override normalizeIncomingValue(value: unknown): boolean {
    return Boolean(value);
  }

  protected changeValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.readOnly()) {
      input.checked = this.controlValue();
      return;
    }
    const value = input.checked;
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-segmented-control',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnSegmentedControl),
      multi: true,
    },
  ],
  template: `
    <div
      class="krn-segmented"
      role="radiogroup"
      [attr.aria-describedby]="a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-disabled]="isDisabled()"
      [attr.aria-readonly]="readOnly()"
      [attr.aria-required]="required()"
      [id]="a11y.id()"
      (keydown)="navigate($event)"
    >
      @for (option of options(); track option.value; let index = $index) {
        <button
          #segment
          type="button"
          role="radio"
          [attr.aria-checked]="controlValue() === option.value"
          [attr.tabindex]="tabIndexFor(option.value, index)"
          [disabled]="isDisabled() || option.disabled"
          (blur)="touch()"
          (click)="select(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSegmentedControl extends KrnValueAccessor<string | null> {
  readonly segmentButtons = viewChildren<ElementRef<HTMLButtonElement>>('segment');

  readonly id = input('');
  readonly options = input.required<readonly KrnSegmentOption<string>[]>();
  readonly ariaLabel = input('Choose an option');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string | null>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'segmented');

  constructor() {
    super(null);
  }

  protected override normalizeIncomingValue(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  protected tabIndexFor(value: string, index: number): number {
    if (this.controlValue() === value) {
      return 0;
    }
    const hasSelection = this.options().some(
      (option) => option.value === this.controlValue() && !option.disabled,
    );
    return !hasSelection && index === this.firstEnabledIndex() ? 0 : -1;
  }

  protected select(value: string): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    const option = this.options().find((item) => item.value === value);
    if (!option || option.disabled) {
      return;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  protected navigate(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();

    const options = this.options();
    if (options.length === 0) {
      return;
    }

    const current = options.findIndex((option) => option.value === this.controlValue());
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    let next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : current < 0
            ? this.firstEnabledIndex()
            : (current + direction + options.length) % options.length;

    for (let checked = 0; checked < options.length; checked += 1) {
      const option = options[next];
      if (option && !option.disabled) {
        this.select(option.value);
        this.segmentButtons()[next]?.nativeElement.focus();
        return;
      }
      next = (next + direction + options.length) % options.length;
    }
  }

  private firstEnabledIndex(): number {
    return Math.max(
      0,
      this.options().findIndex((option) => !option.disabled),
    );
  }
}
