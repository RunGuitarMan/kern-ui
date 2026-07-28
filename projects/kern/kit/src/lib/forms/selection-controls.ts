import type { ElementRef, Provider, TemplateRef } from '@angular/core';
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
import { NgTemplateOutlet } from '@angular/common';
import type { KrnOrientation } from '../actions/action-types';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type {
  KrnIdentityMatcher,
  KrnSegmentDisabledHandler,
  KrnSegmentOption,
  KrnSegmentOptionContext,
  KrnSegmentTrackBy,
} from './form-types';
import { createKrnId } from './form-field';
import {
  KrnValueAccessor,
  provideKrnFormControl,
  requiredError,
  requiredTrueError,
  useKrnControlA11y,
} from './value-accessor';

interface KrnCheckboxGroupController {
  readonly isDisabled: () => boolean;
  readonly isReadOnly: () => boolean;
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
  host: {
    '[attr.id]': 'null',
  },
  providers: [CHECKBOX_GROUP_PROVIDER, ...provideKrnFormControl(() => KrnCheckboxGroup)],
  template: `
    <fieldset
      class="krn-choice-group"
      [attr.aria-describedby]="describedBy() || a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-readonly]="isReadOnly()"
      [attr.aria-required]="a11y.required()"
      [attr.data-orientation]="orientation()"
      [disabled]="isDisabled()"
      [id]="a11y.id()"
    >
      @if (label()) {
        <legend class="krn-label">{{ label() }}</legend>
      }
      <div class="krn-choice-group__options">
        <ng-content />
      </div>
    </fieldset>
  `,
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'checkbox-group', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  readonly isReadOnly = computed(() => this.a11y.readOnly());

  constructor() {
    super([]);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  has(value: string): boolean {
    return this.controlValue().includes(value);
  }

  toggle(value: string, checked: boolean): void {
    if (this.isDisabled() || this.isReadOnly()) {
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
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnCheckbox)],
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
        [required]="a11y.required()"
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'checkbox', {
    disabled: this.disabled,
    inheritField: !this.group,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(
    () => this.a11y.disabled() || this.formDisabled() || Boolean(this.group?.isDisabled()),
  );
  protected readonly isReadOnly = computed(
    () => this.a11y.readOnly() || Boolean(this.group?.isReadOnly()),
  );
  protected readonly checked = computed(() =>
    this.group ? this.group.has(this.value()) : this.controlValue(),
  );

  constructor() {
    super(false);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): boolean {
    return Boolean(value);
  }

  protected override validateValue(value: unknown) {
    return requiredTrueError(value, this.a11y.required());
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
  readonly isDisabled: () => boolean;
  readonly isReadOnly: () => boolean;
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
  host: {
    '[attr.id]': 'null',
  },
  providers: [RADIO_GROUP_PROVIDER, ...provideKrnFormControl(() => KrnRadioGroup)],
  template: `
    <fieldset
      class="krn-choice-group"
      role="radiogroup"
      [attr.aria-describedby]="describedBy() || a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-readonly]="isReadOnly()"
      [attr.aria-required]="a11y.required()"
      [attr.data-orientation]="orientation()"
      [disabled]="isDisabled()"
      [id]="a11y.id()"
    >
      @if (label()) {
        <legend class="krn-label">{{ label() }}</legend>
      }
      <div class="krn-choice-group__options">
        <ng-content />
      </div>
    </fieldset>
  `,
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
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'radio-group', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  readonly isReadOnly = computed(() => this.a11y.readOnly());

  constructor() {
    super(null);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  isSelected(value: string): boolean {
    return this.controlValue() === value;
  }

  select(value: string): void {
    if (this.isDisabled() || this.isReadOnly()) {
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
    () => this.disabled() || Boolean(this.group?.isDisabled()),
  );
  protected readonly isReadOnly = computed(
    () => this.readOnly() || Boolean(this.group?.isReadOnly()),
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
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnSwitch)],
  template: `
    <label
      class="krn-choice krn-switch"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <input
        class="krn-choice__native"
        type="checkbox"
        role="switch"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="a11y.readOnly() || null"
        [checked]="controlValue()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [name]="name()"
        [required]="a11y.required()"
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'switch', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super(false);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): boolean {
    return Boolean(value);
  }

  protected override validateValue(value: unknown) {
    return requiredTrueError(value, this.a11y.required());
  }

  protected changeValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
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
  host: {
    '[attr.id]': 'null',
  },
  imports: [NgTemplateOutlet],
  providers: [...provideKrnFormControl(() => KrnSegmentedControl)],
  template: `
    <div
      class="krn-segmented"
      role="radiogroup"
      [attr.aria-describedby]="a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-disabled]="isDisabled()"
      [attr.aria-readonly]="a11y.readOnly()"
      [attr.aria-required]="a11y.required()"
      [id]="a11y.id()"
      (keydown)="navigate($event)"
    >
      @for (option of options(); track trackBy()(option, $index); let index = $index) {
        <button
          #segment
          type="button"
          role="radio"
          [attr.aria-checked]="isSelected(option.value)"
          [attr.tabindex]="tabIndexFor(option.value, index)"
          [disabled]="isDisabled() || disabledHandler()(option)"
          (blur)="touch()"
          (click)="select(option.value)"
        >
          @if (optionTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template"
              [ngTemplateOutletContext]="optionContext(option)"
            />
          } @else {
            {{ option.label }}
          }
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSegmentedControl<T = string> extends KrnValueAccessor<T | null> {
  private readonly segmentButtons = viewChildren<ElementRef<HTMLButtonElement>>('segment');
  private readonly translations = inject(KRN_TRANSLATIONS);

  readonly id = input('');
  readonly options = input.required<readonly KrnSegmentOption<T>[]>();
  readonly identityMatcher = input<KrnIdentityMatcher<T>>(Object.is);
  readonly trackBy = input<KrnSegmentTrackBy<T>>((option) => option.value);
  readonly disabledHandler = input<KrnSegmentDisabledHandler<T>>(
    (option) => option.disabled ?? false,
  );
  readonly optionTemplate = input<TemplateRef<KrnSegmentOptionContext<T>> | null>(null);
  readonly ariaLabel = input(this.translations.forms.chooseOption);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<T | null>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'segmented', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super(null);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): T | null {
    return value === null || value === undefined ? null : (value as T);
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected tabIndexFor(value: T, index: number): number {
    if (this.isSelected(value)) {
      return 0;
    }
    const hasSelection = this.options().some(
      (option) => this.isSelected(option.value) && !this.disabledHandler()(option),
    );
    return !hasSelection && index === this.firstEnabledIndex() ? 0 : -1;
  }

  protected select(value: T): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const option = this.options().find((item) => this.identityMatcher()(item.value, value));
    if (!option || this.disabledHandler()(option)) {
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

    const current = options.findIndex((option) => this.isSelected(option.value));
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
      if (option && !this.disabledHandler()(option)) {
        this.select(option.value);
        this.segmentButtons()[next]?.nativeElement.focus();
        return;
      }
      next = (next + direction + options.length) % options.length;
    }
  }

  protected isSelected(value: T): boolean {
    const selected = this.controlValue();
    return selected !== null && this.identityMatcher()(value, selected);
  }

  protected optionContext(option: KrnSegmentOption<T>): KrnSegmentOptionContext<T> {
    return {
      $implicit: option,
      option,
      selected: this.isSelected(option.value),
    };
  }

  private firstEnabledIndex(): number {
    return Math.max(
      0,
      this.options().findIndex((option) => !this.disabledHandler()(option)),
    );
  }
}
