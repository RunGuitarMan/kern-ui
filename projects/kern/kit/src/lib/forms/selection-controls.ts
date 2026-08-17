import type { ElementRef, Provider, TemplateRef } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { KrnOrientation } from '../actions/action-types';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type {
  KrnIdentityMatcher,
  KrnSegmentDisabledHandler,
  KrnSegmentOption,
  KrnSegmentOptionContext,
  KrnSegmentTrackBy,
} from './form-types';
import { createKrnId } from './form-field';
import {
  type KrnControlStateInputs,
  provideKrnFormControl,
  requiredError,
  requiredTrueError,
  useKrnControlA11y,
  useKrnFormControl,
} from './value-accessor';

interface KrnCheckboxGroupController {
  readonly isDisabled: () => boolean;
  readonly isReadOnly: () => boolean;
  has(value: string): boolean;
  markTouched(): void;
  toggle(value: string, checked: boolean): void;
}

const KRN_CHECKBOX_GROUP = new InjectionToken<KrnCheckboxGroupController>('KRN_CHECKBOX_GROUP');

const CHECKBOX_GROUP_PROVIDER: Provider = {
  provide: KRN_CHECKBOX_GROUP,
  useExisting: forwardRef(() => KrnCheckboxGroup),
};

const mergeAriaIds = (...values: readonly (string | null | undefined)[]): string | null => {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
};

@Component({
  selector: 'krn-checkbox-group',
  host: {
    '[attr.id]': 'null',
  },
  providers: [CHECKBOX_GROUP_PROVIDER, ...provideKrnFormControl()],
  templateUrl: './checkbox-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCheckboxGroup implements KrnCheckboxGroupController {
  private readonly fieldset = viewChild<ElementRef<HTMLFieldSetElement>>('fieldset');

  readonly id = input('');
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly orientation = input<KrnOrientation>('vertical');
  readonly value = input<readonly string[] | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input('');
  readonly valueChange = output<readonly string[]>();

  private readonly formControl = useKrnFormControl(this, [] as readonly string[], {
    normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
    validateValue: (value) => this.validateValue(value),
  });
  protected readonly controlValue = this.formControl.controlValue;
  protected readonly formDisabled = this.formControl.formDisabled;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'checkbox-group', {
    disabled: this.disabled,
    labelStrategy: 'group',
    readOnly: this.readOnly,
    required: this.required,
  } as KrnControlStateInputs & { readonly labelStrategy: 'group' });
  readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  readonly isReadOnly = computed(() => this.a11y.readOnly());
  protected readonly formFieldLabelledBy = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.() ?? null,
  );
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.formFieldLabelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.describedBy(), this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(this.required, this.a11y.required);
  }

  private normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
      : [];
  }

  private validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  has(value: string): boolean {
    return this.controlValue().includes(value);
  }

  markTouched(): void {
    this.formControl.touch();
  }

  toggle(value: string, checked: boolean): void {
    if (this.isDisabled() || this.isReadOnly()) {
      return;
    }
    const current = this.controlValue();
    const currentlyChecked = current.includes(value);
    if (currentlyChecked === checked) {
      return;
    }
    const next = checked ? [...current, value] : current.filter((item) => item !== value);
    this.formControl.commitValue(next);
    this.valueChange.emit(next);
  }

  focus(options?: FocusOptions): void {
    this.fieldset()
      ?.nativeElement.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:disabled)')
      ?.focus(options);
  }
}

@Component({
  selector: 'krn-checkbox',
  host: {
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
  },
  providers: [...provideKrnFormControl()],
  templateUrl: './checkbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCheckbox {
  private readonly group = inject(KRN_CHECKBOX_GROUP, { optional: true });
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly indeterminateOverride = signal<boolean | null>(null);

  readonly id = input('');
  readonly name = input('');
  readonly value = input(createKrnId('checkbox-option'));
  readonly checked = input<boolean | undefined>(undefined, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly description = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly formControl = useKrnFormControl(this, false as boolean | null, {
    normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
    onAngularWrite: () => this.indeterminateOverride.set(null),
    validateValue: (value) => this.validateValue(value),
  });
  protected readonly controlValue = this.formControl.controlValue;
  protected readonly formDisabled = this.formControl.formDisabled;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

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
  protected readonly labelId = computed(() => `${this.a11y.id()}-label`);
  protected readonly descriptionId = computed(() => `${this.a11y.id()}-description`);
  protected readonly effectiveLabelledBy = computed(() => {
    const external = mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    );
    return external
      ? mergeAriaIds(external, this.labelId())
      : this.ariaLabel()
        ? null
        : this.labelId();
  });
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(
      this.ariaDescribedBy(),
      this.a11y.describedBy(),
      this.description() ? this.descriptionId() : null,
    ),
  );
  protected readonly renderedChecked = computed(() =>
    this.group ? this.group.has(this.value()) : this.controlValue() === true,
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );
  protected readonly isIndeterminate = computed(
    () =>
      this.indeterminateOverride() ??
      (this.indeterminate() || (!this.group && this.controlValue() === null)),
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.checked);
    this.formControl.watchValidationInputs(this.required, this.a11y.required);
    effect(() => {
      this.indeterminate();
      untracked(() => this.indeterminateOverride.set(null));
    });
  }

  private normalizeIncomingValue(value: unknown): boolean | null {
    return value === null ? null : Boolean(value);
  }

  private validateValue(value: unknown) {
    return requiredTrueError(value, this.a11y.required());
  }

  protected changeChecked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isReadOnly()) {
      input.checked = this.renderedChecked();
      input.indeterminate = this.isIndeterminate();
      return;
    }

    const next = input.checked;
    if (this.isIndeterminate()) {
      this.indeterminateOverride.set(false);
      this.indeterminateChange.emit(false);
    }

    if (this.group) {
      const previous = this.renderedChecked();
      this.group.toggle(this.value(), next);
      if (previous !== next) {
        this.checkedChange.emit(next);
      }
      return;
    }

    if (Object.is(this.controlValue(), next)) {
      return;
    }
    this.formControl.commitValue(next);
    this.checkedChange.emit(next);
  }

  protected blurred(): void {
    this.formControl.touch();
    this.group?.markTouched();
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }
}

interface KrnRadioGroupController {
  readonly name: () => string;
  readonly isDisabled: () => boolean;
  readonly isReadOnly: () => boolean;
  isSelected(value: string): boolean;
  markTouched(): void;
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
  providers: [RADIO_GROUP_PROVIDER, ...provideKrnFormControl()],
  templateUrl: './radio-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRadioGroup implements KrnRadioGroupController {
  private readonly generatedName = createKrnId('radio-group');
  private readonly fieldset = viewChild<ElementRef<HTMLFieldSetElement>>('fieldset');

  readonly id = input('');
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly customName = input('', { alias: 'name' });
  readonly orientation = input<KrnOrientation>('vertical');
  readonly value = input<string | null | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input('');
  readonly valueChange = output<string | null>();

  private readonly formControl = useKrnFormControl(this, null as string | null, {
    normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
    validateValue: (value) => this.validateValue(value),
  });
  protected readonly controlValue = this.formControl.controlValue;
  protected readonly formDisabled = this.formControl.formDisabled;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

  readonly name = computed(() => this.customName() || this.generatedName);
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'radio-group', {
    disabled: this.disabled,
    labelStrategy: 'group',
    readOnly: this.readOnly,
    required: this.required,
  } as KrnControlStateInputs & { readonly labelStrategy: 'group' });
  readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  readonly isReadOnly = computed(() => this.a11y.readOnly());
  protected readonly formFieldLabelledBy = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.() ?? null,
  );
  protected readonly legendId = computed(() => `${this.a11y.id()}-legend`);
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(
      this.ariaLabelledBy(),
      this.formFieldLabelledBy(),
      this.label() && !this.formFieldLabelledBy() ? this.legendId() : null,
    ),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.describedBy(), this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(this.required, this.a11y.required);
  }

  private normalizeIncomingValue(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  isSelected(value: string): boolean {
    return this.controlValue() === value;
  }

  select(value: string): void {
    if (this.isDisabled() || this.isReadOnly() || this.isSelected(value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
  }

  markTouched(): void {
    this.formControl.touch();
  }

  focus(options?: FocusOptions): void {
    const fieldset = this.fieldset()?.nativeElement;
    const target =
      fieldset?.querySelector<HTMLInputElement>('input[type="radio"]:checked:not(:disabled)') ??
      fieldset?.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)');
    target?.focus(options);
  }
}

@Component({
  selector: 'krn-radio',
  host: {
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
  },
  templateUrl: './radio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnRadio {
  private readonly group = inject(KRN_RADIO_GROUP, { optional: true });
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly generatedId = createKrnId('radio');

  readonly id = input('');
  readonly value = input.required<string>();
  readonly name = input(this.generatedId);
  readonly checked = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly description = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly selected = output<string>();

  protected readonly isDisabled = computed(
    () => this.disabled() || Boolean(this.group?.isDisabled()),
  );
  protected readonly isReadOnly = computed(
    () => this.readOnly() || Boolean(this.group?.isReadOnly()),
  );
  protected readonly nativeId = computed(() => this.id() || this.generatedId);
  protected readonly effectiveName = computed(() => this.group?.name() || this.name());
  protected readonly labelId = computed(() => `${this.nativeId()}-label`);
  protected readonly descriptionId = computed(() => `${this.nativeId()}-description`);
  protected readonly effectiveLabelledBy = computed(() =>
    this.ariaLabelledBy()
      ? mergeAriaIds(this.ariaLabelledBy(), this.labelId())
      : this.ariaLabel()
        ? null
        : this.labelId(),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.description() ? this.descriptionId() : null),
  );
  protected readonly renderedChecked = computed(
    () => this.group?.isSelected(this.value()) ?? this.checked(),
  );

  protected select(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isDisabled()) {
      this.restoreCheckedState(input);
      return;
    }
    if (this.isReadOnly()) {
      this.restoreCheckedState(input);
      return;
    }
    if (!input.checked || Boolean(this.group?.isSelected(this.value()))) {
      return;
    }
    this.group?.select(this.value());
    this.selected.emit(this.value());
  }

  protected preventReadonly(event: Event): void {
    if (this.isReadOnly()) {
      event.preventDefault();
      this.restoreCheckedState(event.target as HTMLInputElement);
    }
  }

  protected blurred(): void {
    this.group?.markTouched();
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  private restoreCheckedState(input: HTMLInputElement): void {
    if (!this.group) {
      input.checked = this.renderedChecked();
      return;
    }

    input
      .closest('fieldset')
      ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      .forEach((radio) => {
        radio.checked = this.group!.isSelected(radio.value);
      });
  }
}

@Component({
  selector: 'krn-switch',
  host: {
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
  },
  providers: [...provideKrnFormControl()],
  templateUrl: './switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSwitch {
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('input');

  readonly id = input('');
  readonly name = input('');
  readonly checked = input<boolean | undefined>(undefined, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly description = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly checkedChange = output<boolean>();

  private readonly formControl = useKrnFormControl(this, false, {
    normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
    validateValue: (value) => this.validateValue(value),
  });
  protected readonly controlValue = this.formControl.controlValue;
  protected readonly formDisabled = this.formControl.formDisabled;
  protected readonly touch = this.formControl.touch;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'switch', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly isReadOnly = computed(() => this.a11y.readOnly());
  protected readonly labelId = computed(() => `${this.a11y.id()}-label`);
  protected readonly descriptionId = computed(() => `${this.a11y.id()}-description`);
  protected readonly effectiveLabelledBy = computed(() => {
    const external = mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    );
    return external
      ? mergeAriaIds(external, this.labelId())
      : this.ariaLabel()
        ? null
        : this.labelId();
  });
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(
      this.ariaDescribedBy(),
      this.a11y.describedBy(),
      this.description() ? this.descriptionId() : null,
    ),
  );
  protected readonly renderedChecked = computed(() => this.controlValue());
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.checked);
    this.formControl.watchValidationInputs(this.required, this.a11y.required);
  }

  private normalizeIncomingValue(value: unknown): boolean {
    return Boolean(value);
  }

  private validateValue(value: unknown) {
    return requiredTrueError(value, this.a11y.required());
  }

  protected changeValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isReadOnly()) {
      input.checked = this.renderedChecked();
      return;
    }
    const checked = input.checked;
    if (checked === this.renderedChecked()) {
      return;
    }
    this.formControl.commitValue(checked);
    this.checkedChange.emit(checked);
  }

  protected preventReadonly(event: Event): void {
    if (this.isReadOnly()) {
      event.preventDefault();
    }
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }
}

@Component({
  selector: 'krn-segmented-control',
  host: {
    '[attr.id]': 'null',
  },
  imports: [NgTemplateOutlet],
  providers: [...provideKrnFormControl()],
  templateUrl: './segmented-control.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSegmentedControl<T = string> {
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
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.forms.chooseOption,
  );
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly orientation = input<KrnOrientation>('horizontal');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<T | null | undefined>(undefined);
  readonly valueChange = output<T | null>();

  private readonly formControl = useKrnFormControl<T | null>(this, null, {
    normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
    validateValue: (value) => this.validateValue(value),
    valuesEqual: (current, next) => this.valuesEqual(current, next),
  });
  protected readonly controlValue = this.formControl.controlValue;
  protected readonly formDisabled = this.formControl.formDisabled;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'segmented', {
    disabled: this.disabled,
    labelStrategy: 'group',
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(this.required, this.a11y.required);
  }

  private normalizeIncomingValue(value: unknown): T | null {
    return value === null || value === undefined ? null : (value as T);
  }

  private validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  private valuesEqual(current: T | null, next: T | null): boolean {
    return current === null || next === null
      ? current === next
      : this.identityMatcher()(current, next);
  }

  protected tabIndexFor(value: T, index: number): number {
    if (this.isSelected(value)) {
      return this.tabIndex();
    }
    const hasSelection = this.options().some(
      (option) => this.isSelected(option.value) && !this.disabledHandler()(option),
    );
    return !hasSelection && index === this.firstEnabledIndex() ? this.tabIndex() : -1;
  }

  protected select(value: T): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const option = this.options().find((item) => this.identityMatcher()(item.value, value));
    if (!option || this.disabledHandler()(option)) {
      return;
    }
    if (this.formControl.commitUserValue(option.value)) {
      this.valueChange.emit(option.value);
    }
  }

  protected navigate(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();

    const options = this.options();
    if (options.length === 0) {
      return;
    }

    const target = event.target as Node | null;
    const focused = this.segmentButtons().findIndex(
      (button) =>
        button.nativeElement === event.target ||
        Boolean(target && button.nativeElement.contains(target)),
    );
    const selected = options.findIndex((option) => this.isSelected(option.value));
    const current = focused >= 0 ? focused : selected;
    const direction =
      event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1;
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
        if (!this.a11y.readOnly()) {
          this.select(option.value);
        }
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

  protected handleFocusOut(event: FocusEvent): void {
    const group = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (next && group.contains(next)) {
      return;
    }
    this.formControl.touch();
  }

  focus(options?: FocusOptions): void {
    const selected = this.options().findIndex(
      (option) => this.isSelected(option.value) && !this.disabledHandler()(option),
    );
    const index = selected >= 0 ? selected : this.firstEnabledIndex();
    this.segmentButtons()[index]?.nativeElement.focus(options);
  }

  blur(): void {
    for (const button of this.segmentButtons()) {
      button.nativeElement.blur();
    }
  }

  private firstEnabledIndex(): number {
    return Math.max(
      0,
      this.options().findIndex((option) => !this.disabledHandler()(option)),
    );
  }
}
