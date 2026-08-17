import type { ElementRef } from '@angular/core';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import type { KrnControlSize, KrnInputMode } from './form-types';
import {
  maxError,
  maxLengthError,
  mergeValidationErrors,
  minError,
  minLengthError,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
  useKrnFormControl,
} from './value-accessor';

const optionalNumber = (value: unknown): number | undefined => {
  const numeric =
    value === null || value === undefined || value === '' ? undefined : numberAttribute(value);

  return numeric !== undefined && Number.isFinite(numeric) ? numeric : undefined;
};

const positiveStep = (value: unknown): number => {
  const step = optionalNumber(value);

  return step !== undefined && step > 0 ? step : 1;
};

const optionalTextLength = (value: unknown): number | undefined => {
  const length = optionalNumber(value);

  return length !== undefined && Number.isFinite(length) && length >= 0
    ? Math.trunc(length)
    : undefined;
};

const textareaRows = (value: unknown): number => {
  const rows = optionalTextLength(value);

  return rows !== undefined && rows > 0 ? rows : 4;
};

const mergeAriaIds = (...values: readonly (string | null | undefined)[]): string | null => {
  const ids = values.flatMap((value) => value?.trim().split(/\s+/) ?? []).filter(Boolean);

  return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
};

const isElementTarget = (target: EventTarget | null): target is Element =>
  target !== null && 'closest' in target && typeof target.closest === 'function';

@Component({
  selector: 'krn-text-input',
  providers: [...provideKrnFormControl()],
  host: {
    '[attr.id]': 'null',
    '[attr.data-size]': 'size()',
  },
  templateUrl: './text-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTextInput {
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private composing = false;

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly autocomplete = input('');
  readonly inputMode = input<KrnInputMode>('text');
  readonly size = input<KrnControlSize>('md');
  readonly value = input<string | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly minLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly spellcheck = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();

  private readonly formControl = useKrnFormControl(this, '', {
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'text-input', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly labelledBy = computed(() =>
    mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    ),
  );
  protected readonly describedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(
      this.required,
      this.a11y.required,
      this.minLength,
      this.maxLength,
    );
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  select(): void {
    this.inputElement()?.nativeElement.select();
  }

  private validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minLengthError(value, this.minLength()),
      maxLengthError(value, this.maxLength()),
    );
  }

  protected updateText(event: Event): void {
    if (this.composing) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
  }

  protected startComposition(): void {
    this.composing = true;
  }

  protected endComposition(event: Event): void {
    this.composing = false;
    this.updateText(event);
  }

  protected focusFromShell(event: PointerEvent): void {
    const target = event.target;

    if (
      event.button !== 0 ||
      !isElementTarget(target) ||
      target.closest('input,button,a,select,textarea,[contenteditable],[tabindex]')
    ) {
      return;
    }

    event.preventDefault();
    this.focus();
  }
}

@Component({
  selector: 'krn-textarea',
  providers: [...provideKrnFormControl()],
  host: {
    '[attr.id]': 'null',
    '[attr.data-size]': 'size()',
  },
  templateUrl: './textarea.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTextarea {
  private readonly textareaElement = viewChild<ElementRef<HTMLTextAreaElement>>('textareaElement');
  private composing = false;

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly autocomplete = input('');
  readonly size = input<KrnControlSize>('md');
  readonly rows = input(4, { transform: textareaRows });
  readonly value = input<string | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly maxLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly spellcheck = input(true, { transform: booleanAttribute });
  readonly showCount = input(false, { transform: booleanAttribute });
  readonly autoResize = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();

  private readonly formControl = useKrnFormControl(this, '', {
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'textarea', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly labelledBy = computed(() =>
    mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    ),
  );
  protected readonly describedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    afterRenderEffect(() => {
      const autoResize = this.autoResize();
      if (autoResize) {
        this.controlValue();
        this.rows();
      }
      this.resizeToContent(autoResize);
    });
    afterRenderEffect((onCleanup) => {
      const textarea = this.textareaElement()?.nativeElement;
      const ResizeObserverConstructor = textarea?.ownerDocument.defaultView?.ResizeObserver;
      if (!this.autoResize() || !textarea || !ResizeObserverConstructor) {
        return;
      }

      let lastInlineSize: number | undefined;
      const observer = new ResizeObserverConstructor((entries) => {
        const inlineSize = entries.find((entry) => entry.target === textarea)?.contentRect.width;
        if (inlineSize === undefined || Object.is(inlineSize, lastInlineSize)) {
          return;
        }

        lastInlineSize = inlineSize;
        this.resizeToContent(true);
      });
      observer.observe(textarea);
      onCleanup(() => observer.disconnect());
    });
    this.formControl.watchValidationInputs(
      this.required,
      this.a11y.required,
      this.minLength,
      this.maxLength,
    );
  }

  focus(options?: FocusOptions): void {
    this.textareaElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.textareaElement()?.nativeElement.blur();
  }

  select(): void {
    this.textareaElement()?.nativeElement.select();
  }

  private validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minLengthError(value, this.minLength()),
      maxLengthError(value, this.maxLength()),
    );
  }

  protected updateText(event: Event): void {
    if (this.composing) {
      return;
    }

    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
  }

  protected startComposition(): void {
    this.composing = true;
  }

  protected endComposition(event: Event): void {
    this.composing = false;
    this.updateText(event);
  }

  protected focusFromShell(event: PointerEvent): void {
    const target = event.target;

    if (
      event.button !== 0 ||
      !isElementTarget(target) ||
      target.closest('input,button,a,select,textarea,[contenteditable],[tabindex]')
    ) {
      return;
    }

    event.preventDefault();
    this.focus();
  }

  private resizeToContent(autoResize: boolean): void {
    const textarea = this.textareaElement()?.nativeElement;
    if (!textarea) {
      return;
    }
    if (!autoResize) {
      textarea.style.removeProperty('height');
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}

@Component({
  selector: 'krn-password-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl()],
  templateUrl: './password-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnPasswordInput {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private composing = false;

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly autocomplete = input('current-password');
  readonly value = input<string | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly maxLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly showLabel = input<string | undefined>();
  protected readonly resolvedShowLabel = krnInputFallback(
    this.showLabel,
    () => this.translations.forms.showPassword,
  );
  readonly hideLabel = input<string | undefined>();
  protected readonly resolvedHideLabel = krnInputFallback(
    this.hideLabel,
    () => this.translations.forms.hidePassword,
  );
  readonly showText = input<string | undefined>();
  protected readonly resolvedShowText = krnInputFallback(
    this.showText,
    () => this.translations.forms.show,
  );
  readonly hideText = input<string | undefined>();
  protected readonly resolvedHideText = krnInputFallback(
    this.hideText,
    () => this.translations.forms.hide,
  );
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  protected readonly revealed = signal(false);

  private readonly formControl = useKrnFormControl(this, '', {
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

  protected readonly toggle = (value: boolean): boolean => !value;
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'password', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly labelledBy = computed(() =>
    mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    ),
  );
  protected readonly describedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(
      this.required,
      this.a11y.required,
      this.minLength,
      this.maxLength,
    );
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  select(): void {
    this.inputElement()?.nativeElement.select();
  }

  private validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minLengthError(value, this.minLength()),
      maxLengthError(value, this.maxLength()),
    );
  }

  protected updatePassword(event: Event): void {
    if (this.composing) {
      return;
    }

    const value = (event.target as HTMLInputElement).value;
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
  }

  protected startComposition(): void {
    this.composing = true;
  }

  protected endComposition(event: Event): void {
    this.composing = false;
    this.updatePassword(event);
  }

  protected focusFromShell(event: PointerEvent): void {
    const target = event.target;

    if (
      event.button !== 0 ||
      !isElementTarget(target) ||
      target.closest('input,button,a,select,textarea,[contenteditable],[tabindex]')
    ) {
      return;
    }

    event.preventDefault();
    this.focus();
  }

  protected retainInputFocus(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    this.focus();
  }
}

@Component({
  selector: 'krn-search-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl()],
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSearchInput {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private composing = false;

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input<string | undefined>();
  protected readonly resolvedPlaceholder = krnInputFallback(
    this.placeholder,
    () => this.translations.forms.search,
  );
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.forms.search,
  );
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly clearLabel = input<string | undefined>();
  protected readonly resolvedClearLabel = krnInputFallback(
    this.clearLabel,
    () => this.translations.forms.clearSearch,
  );
  readonly autocomplete = input('off');
  readonly enterKeyHint = input('search');
  readonly value = input<string | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly maxLength = input<number | undefined>(undefined, {
    transform: optionalTextLength,
  });
  readonly spellcheck = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly searchSubmitted = output<string>();

  private readonly formControl = useKrnFormControl(this, '', {
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'search', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly labelledBy = computed(() =>
    mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    ),
  );
  protected readonly describedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(
      this.required,
      this.a11y.required,
      this.minLength,
      this.maxLength,
    );
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  select(): void {
    this.inputElement()?.nativeElement.select();
  }

  private validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minLengthError(value, this.minLength()),
      maxLengthError(value, this.maxLength()),
    );
  }

  protected updateSearch(event: Event): void {
    if (this.composing) {
      return;
    }

    const value = (event.target as HTMLInputElement).value;
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
  }

  protected clear(): void {
    this.formControl.commitValue('');
    this.valueChange.emit('');
    this.focus();
  }

  protected submitSearch(event: Event): void {
    if (this.composing || (event as KeyboardEvent).isComposing) {
      return;
    }

    this.searchSubmitted.emit(this.controlValue());
  }

  protected startComposition(): void {
    this.composing = true;
  }

  protected endComposition(event: Event): void {
    this.composing = false;
    this.updateSearch(event);
  }

  protected focusFromShell(event: PointerEvent): void {
    const target = event.target;

    if (
      event.button !== 0 ||
      !isElementTarget(target) ||
      target.closest('input,button,a,select,textarea,[contenteditable],[tabindex]')
    ) {
      return;
    }

    event.preventDefault();
    this.focus();
  }

  protected retainInputFocus(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    this.focus();
  }
}

@Component({
  selector: 'krn-number-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl()],
  templateUrl: './number-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnNumberInput {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly autocomplete = input('off');
  readonly inputMode = input<KrnInputMode>('decimal');
  readonly value = input<number | null | undefined>(undefined);
  readonly increaseLabel = input<string | undefined>();
  protected readonly resolvedIncreaseLabel = krnInputFallback(
    this.increaseLabel,
    () => this.translations.forms.increaseValue,
  );
  readonly decreaseLabel = input<string | undefined>();
  protected readonly resolvedDecreaseLabel = krnInputFallback(
    this.decreaseLabel,
    () => this.translations.forms.decreaseValue,
  );
  readonly min = input<number | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly max = input<number | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly step = input(1, { transform: positiveStep });
  readonly showSteppers = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<number | null>();

  private readonly formControl = useKrnFormControl(this, null, {
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'number', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly labelledBy = computed(() =>
    mergeAriaIds(
      this.ariaLabelledBy(),
      (
        this.a11y as typeof this.a11y & {
          readonly labelledBy?: () => string | null;
        }
      ).labelledBy?.(),
    ),
  );
  protected readonly describedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly isFormFieldControl = computed(
    () =>
      (
        this.a11y as typeof this.a11y & {
          readonly isFormFieldControl?: () => boolean;
        }
      ).isFormFieldControl?.() ?? false,
  );
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly canIncrease = computed(() => {
    const value = this.controlValue();
    const max = this.max();

    return (
      !this.isDisabled() &&
      !this.a11y.readOnly() &&
      (value === null || max === undefined || value < max) &&
      !Object.is(value, this.nextStepValue(1))
    );
  });
  protected readonly canDecrease = computed(() => {
    const value = this.controlValue();
    const min = this.min();

    return (
      !this.isDisabled() &&
      !this.a11y.readOnly() &&
      (value === null || min === undefined || value > min) &&
      !Object.is(value, this.nextStepValue(-1))
    );
  });

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(this.required, this.a11y.required, this.min, this.max);
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }

  private normalizeIncomingValue(value: unknown): number | null {
    const numeric = Number(value);
    return value === null || value === undefined || value === ''
      ? null
      : Number.isFinite(numeric)
        ? numeric
        : null;
  }

  private validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minError(value, this.min()),
      maxError(value, this.max()),
    );
  }

  protected updateNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value === '' ? null : input.valueAsNumber;
    if (value !== null && !Number.isFinite(value)) {
      return;
    }
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
  }

  protected stepBy(direction: 1 | -1): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const value = this.nextStepValue(direction);
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.formControl.commitValue(value);
    this.valueChange.emit(value);
    this.focus();
  }

  protected focusFromShell(event: PointerEvent): void {
    const target = event.target;

    if (
      event.button !== 0 ||
      !isElementTarget(target) ||
      target.closest('input,button,a,select,textarea,[contenteditable],[tabindex]')
    ) {
      return;
    }

    event.preventDefault();
    this.focus();
  }

  protected retainInputFocus(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    // Preventing a touch pointerdown suppresses the compatibility click in
    // mobile WebKit. Mouse pointers can keep the input focused before click;
    // touch activation is focused by stepBy after the click commits.
    if (event.pointerType === 'mouse') {
      event.preventDefault();
      this.focus();
    }
  }

  private nextStepValue(direction: 1 | -1): number {
    const base = this.controlValue() ?? this.min() ?? 0;

    return this.clamp(this.addStep(base, direction));
  }

  private addStep(base: number, direction: 1 | -1): number {
    const [baseCoefficient, baseScale] = this.decimalParts(base);
    const [stepCoefficient, stepScale] = this.decimalParts(this.step());
    const scale = Math.max(baseScale, stepScale);
    const coefficient =
      baseCoefficient * 10n ** BigInt(scale - baseScale) +
      BigInt(direction) * stepCoefficient * 10n ** BigInt(scale - stepScale);
    const value = this.decimalNumber(coefficient, scale);

    return Number.isFinite(value) ? value : base;
  }

  private decimalParts(value: number): readonly [coefficient: bigint, scale: number] {
    const [rawMantissa, rawExponent = '0'] = value.toString().toLowerCase().split('e');
    const negative = rawMantissa.startsWith('-');
    const mantissa = negative ? rawMantissa.slice(1) : rawMantissa;
    const [integer, fraction = ''] = mantissa.split('.');
    const exponent = Number(rawExponent);
    const initialCoefficient = BigInt(`${integer}${fraction}`);
    const initialScale = fraction.length - exponent;
    const coefficient = negative ? -initialCoefficient : initialCoefficient;

    return initialScale < 0
      ? [coefficient * 10n ** BigInt(-initialScale), 0]
      : [coefficient, initialScale];
  }

  private decimalNumber(coefficient: bigint, scale: number): number {
    const negative = coefficient < 0n;
    const digits = (negative ? -coefficient : coefficient).toString().padStart(scale + 1, '0');
    const point = digits.length - scale;
    const decimal = scale === 0 ? digits : `${digits.slice(0, point)}.${digits.slice(point)}`;

    return Number(`${negative ? '-' : ''}${decimal}`);
  }

  private clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    return Math.min(
      max ?? Number.POSITIVE_INFINITY,
      Math.max(min ?? Number.NEGATIVE_INFINITY, value),
    );
  }
}
