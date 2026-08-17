import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  Renderer2,
  signal,
  type ElementRef,
  type ModelSignal,
  type OutputEmitterRef,
  type Signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import type {
  KrnAutocompleteMode,
  KrnControlSize,
  KrnIdentityMatcher,
  KrnOptionDisabledHandler,
  KrnOptionFilter,
  KrnOptionStringifier,
  KrnOptionTrackBy,
  KrnOptionsState,
  KrnSelectOption,
  KrnSelectOptionContext,
} from './form-types';
import {
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
  useKrnFormControl,
} from './value-accessor';
import { KRN_PLATFORM, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import { KRN_ENGLISH_TRANSLATIONS, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import { krnInheritedLocale } from '../reactive-locale';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined || value === null ? undefined : booleanAttribute(value);

const nativeSelectPlaceholderKey = '__krn-native-select-placeholder__';

const mergeAriaIds = (...values: readonly (string | null | undefined)[]): string | null => {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
};

const consumeOpenEscape = (event: Event, open: boolean, close: () => void): void => {
  if (!open || event.defaultPrevented) return;
  event.preventDefault();
  event.stopPropagation();
  close();
};

const focusStayedWithin = (event: FocusEvent): boolean => {
  const current = event.currentTarget;
  const next = event.relatedTarget;
  const ownerDocument =
    current && 'ownerDocument' in current ? (current as Node).ownerDocument : null;
  const NodeConstructor = ownerDocument?.defaultView?.Node;
  return Boolean(
    NodeConstructor &&
    current instanceof NodeConstructor &&
    next instanceof NodeConstructor &&
    current.contains(next),
  );
};

@Component({
  selector: 'krn-native-select',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
    '[attr.data-size]': 'size()',
  },
  providers: [...provideKrnFormControl()],
  templateUrl: './native-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnNativeSelect<T = string> {
  private readonly select = viewChild<ElementRef<HTMLSelectElement>>('select');
  readonly id = input('');
  readonly name = input('');
  /** Controls the native select trigger height and content density. */
  readonly size = input<KrnControlSize>('md');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly options = input.required<readonly KrnSelectOption<T>[]>();
  readonly identityMatcher = input<KrnIdentityMatcher<T>>(Object.is);
  readonly trackBy = input<KrnOptionTrackBy<T>>((option) => option.value);
  readonly stringify = input<KrnOptionStringifier<T>>((option) => option.label);
  readonly disabledHandler = input<KrnOptionDisabledHandler<T>>(
    (option) => option.disabled ?? false,
  );
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
  protected readonly touch = this.formControl.touch;
  readonly writeValue = this.formControl.writeValue;
  readonly registerOnChange = this.formControl.registerOnChange;
  readonly registerOnTouched = this.formControl.registerOnTouched;
  readonly setDisabledState = this.formControl.setDisabledState;
  readonly validate = this.formControl.validate;
  readonly registerOnValidatorChange = this.formControl.registerOnValidatorChange;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'native-select', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly isReadOnly = computed(() => this.a11y.readOnly());
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly selectedNativeKey = computed(() => {
    const value = this.controlValue();
    if (value === null) {
      return nativeSelectPlaceholderKey;
    }
    const index = this.options().findIndex((option) => this.identityMatcher()(option.value, value));
    const option = this.options()[index];
    return option ? this.optionKey(option, index) : nativeSelectPlaceholderKey;
  });

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

  protected optionKey(_option: KrnSelectOption<T>, index: number): string {
    return `__krn-native-select-option-${index}__`;
  }

  protected selectNative(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.isDisabled() || this.isReadOnly()) {
      select.value = this.selectedNativeKey();
      return;
    }
    const cleared = select.value === nativeSelectPlaceholderKey;
    const optionIndex = this.options().findIndex(
      (candidate, index) => this.optionKey(candidate, index) === select.value,
    );
    const option = optionIndex >= 0 ? this.options()[optionIndex] : undefined;
    if (
      (!cleared && !option) ||
      (cleared && this.a11y.required()) ||
      (option && this.disabledHandler()(option))
    ) {
      select.value = this.selectedNativeKey();
      return;
    }
    const value = option?.value ?? null;
    if (this.formControl.commitUserValue(value)) {
      this.valueChange.emit(value);
    }
  }

  protected protectReadOnlyInteraction(event: Event): void {
    if (!this.isReadOnly()) {
      return;
    }
    if (event.type === 'keydown') {
      const keyboardEvent = event as KeyboardEvent;
      const passThroughShortcut =
        keyboardEvent.ctrlKey ||
        keyboardEvent.metaKey ||
        (keyboardEvent.altKey && !['ArrowDown', 'ArrowUp'].includes(keyboardEvent.key));
      const mutatesSelection =
        keyboardEvent.key.length === 1 ||
        [
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'End',
          'Enter',
          'F4',
          'Home',
          'PageDown',
          'PageUp',
        ].includes(keyboardEvent.key);
      if (passThroughShortcut || !mutatesSelection) {
        return;
      }
    }
    event.preventDefault();
    const select = this.select()?.nativeElement;
    if (select) {
      select.value = this.selectedNativeKey();
      if (event.type === 'pointerdown') {
        select.focus({ preventScroll: true });
      }
    }
  }

  focus(options?: FocusOptions): void {
    this.select()?.nativeElement.focus(options);
  }

  blur(): void {
    this.select()?.nativeElement.blur();
  }
}

@Component({
  selector: 'krn-select',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
    '[attr.data-size]': 'size()',
    '[attr.data-open]': 'open()',
  },
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, NgTemplateOutlet, Option],
  providers: [...provideKrnFormControl()],
  templateUrl: './select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSelect<T = string> {
  readonly #translations = inject(KRN_TRANSLATIONS);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  readonly id = input('');
  /** Controls the custom select trigger height and content density. */
  readonly size = input<KrnControlSize>('md');
  readonly placeholder = input<string | undefined>();
  protected readonly resolvedPlaceholder = krnInputFallback(
    this.placeholder,
    () => this.#translations.forms.selectOption,
  );
  readonly emptyText = input<string | undefined>();
  protected readonly resolvedEmptyText = krnInputFallback(
    this.emptyText,
    () => this.#translations.forms.noOptions,
  );
  readonly loadingText = input<string | undefined>();
  protected readonly resolvedLoadingText = krnInputFallback(
    this.loadingText,
    () =>
      this.#translations.forms.loadingOptions ??
      KRN_ENGLISH_TRANSLATIONS.forms.loadingOptions ??
      '',
  );
  readonly errorText = input<string | undefined>();
  protected readonly resolvedErrorText = krnInputFallback(
    this.errorText,
    () =>
      this.#translations.forms.optionsLoadFailed ??
      KRN_ENGLISH_TRANSLATIONS.forms.optionsLoadFailed ??
      '',
  );
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly options = input.required<readonly KrnSelectOption<T>[]>();
  /** Controls whether options are interactive or replaced by an announced loading/error state. */
  readonly optionsState = input<KrnOptionsState>('ready');
  readonly identityMatcher = input<KrnIdentityMatcher<T>>(Object.is);
  readonly trackBy = input<KrnOptionTrackBy<T>>((option) => option.value);
  readonly stringify = input<KrnOptionStringifier<T>>((option) => option.label);
  readonly disabledHandler = input<KrnOptionDisabledHandler<T>>(
    (option) => option.disabled ?? false,
  );
  readonly optionTemplate = input<TemplateRef<KrnSelectOptionContext<T>> | null>(null);
  readonly selectedTemplate = input<TemplateRef<KrnSelectOptionContext<T>> | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<T | null | undefined>(undefined);
  readonly open = model(false);
  readonly valueChange = output<T | null>();
  readonly selectionChange = output<KrnSelectOption<T> | null>();

  readonly #formControl = useKrnFormControl<T | null>(this, null, {
    normalizeIncomingValue: (value) => this.#normalizeIncomingValue(value),
    validateValue: (value) => this.#validateValue(value),
    valuesEqual: (current, next) => this.#valuesEqual(current, next),
  });
  protected readonly controlValue = this.#formControl.controlValue;
  protected readonly formDisabled = this.#formControl.formDisabled;
  readonly writeValue = this.#formControl.writeValue;
  readonly registerOnChange = this.#formControl.registerOnChange;
  readonly registerOnTouched = this.#formControl.registerOnTouched;
  readonly setDisabledState = this.#formControl.setDisabledState;
  readonly validate = this.#formControl.validate;
  readonly registerOnValidatorChange = this.#formControl.registerOnValidatorChange;

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'select', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly isReadOnly = computed(() => this.a11y.readOnly());
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly selectedOption = computed(
    () =>
      this.options().find((option) => {
        const value = this.controlValue();
        return value !== null && this.identityMatcher()(option.value, value);
      }) ?? null,
  );
  protected readonly selectedValues = computed(() => {
    const option = this.selectedOption();
    return option === null ? [] : [option.value];
  });

  constructor() {
    this.#formControl.bindStandaloneValue(this.value);
    effect(() => {
      if (this.open() && (this.isDisabled() || this.isReadOnly())) {
        this.open.set(false);
      }
    });
    this.#formControl.watchValidationInputs(this.required, this.a11y.required);
  }

  #normalizeIncomingValue(value: unknown): T | null {
    return value === null || value === undefined ? null : (value as T);
  }

  #validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  #valuesEqual(current: T | null, next: T | null): boolean {
    return current === null || next === null
      ? current === next
      : this.identityMatcher()(current, next);
  }

  protected setOpen(open: boolean): void {
    if (!this.isDisabled() && !this.isReadOnly()) {
      this.open.set(open);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.#formControl.touch();
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.close());
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    if (focusStayedWithin(event)) {
      return;
    }
    this.close();
  }

  protected selectValues(values: T[]): void {
    if (this.isDisabled() || this.isReadOnly() || this.optionsState() !== 'ready') {
      return;
    }
    const requested = values.at(-1) ?? null;
    const option =
      requested === null
        ? null
        : (this.options().find((candidate) => this.identityMatcher()(candidate.value, requested)) ??
          null);
    if (requested !== null && (option === null || this.disabledHandler()(option))) {
      return;
    }
    const value = option?.value ?? null;
    if (this.#formControl.commitUserValue(value)) {
      this.valueChange.emit(value);
      this.selectionChange.emit(option);
    }
    this.close();
  }

  protected isSelected(option: KrnSelectOption<T>): boolean {
    const value = this.controlValue();
    return value !== null && this.identityMatcher()(option.value, value);
  }

  protected optionContext(option: KrnSelectOption<T>): KrnSelectOptionContext<T> {
    return {
      $implicit: option,
      option,
      selected: this.isSelected(option),
    };
  }

  focus(options?: FocusOptions): void {
    this.trigger()?.nativeElement.focus(options);
  }
}

@Component({
  selector: 'krn-multi-select',
  host: {
    class: 'krn-select-host krn-multi-select-host',
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
  },
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, NgTemplateOutlet, Option],
  providers: [...provideKrnFormControl()],
  templateUrl: './multi-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnMultiSelect<T = string> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  readonly id = input('');
  readonly placeholder = input<string | undefined>();
  protected readonly resolvedPlaceholder = krnInputFallback(
    this.placeholder,
    () => this.translations.forms.selectOptions,
  );
  readonly emptyText = input<string | undefined>();
  protected readonly resolvedEmptyText = krnInputFallback(
    this.emptyText,
    () => this.translations.forms.noOptions,
  );
  readonly loadingText = input<string | undefined>();
  protected readonly resolvedLoadingText = krnInputFallback(
    this.loadingText,
    () =>
      this.translations.forms.loadingOptions ?? KRN_ENGLISH_TRANSLATIONS.forms.loadingOptions ?? '',
  );
  readonly errorText = input<string | undefined>();
  protected readonly resolvedErrorText = krnInputFallback(
    this.errorText,
    () =>
      this.translations.forms.optionsLoadFailed ??
      KRN_ENGLISH_TRANSLATIONS.forms.optionsLoadFailed ??
      '',
  );
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly options = input.required<readonly KrnSelectOption<T>[]>();
  /** Controls whether options are interactive or replaced by an announced loading/error state. */
  readonly optionsState = input<KrnOptionsState>('ready');
  readonly identityMatcher = input<KrnIdentityMatcher<T>>(Object.is);
  readonly trackBy = input<KrnOptionTrackBy<T>>((option) => option.value);
  readonly stringify = input<KrnOptionStringifier<T>>((option) => option.label);
  readonly disabledHandler = input<KrnOptionDisabledHandler<T>>(
    (option) => option.disabled ?? false,
  );
  readonly optionTemplate = input<TemplateRef<KrnSelectOptionContext<T>> | null>(null);
  readonly selectedTemplate = input<TemplateRef<KrnSelectOptionContext<T>> | null>(null);
  readonly maxVisible = input(2, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<readonly T[] | undefined>(undefined);
  readonly open = model(false);
  readonly valueChange = output<readonly T[]>();

  private readonly formControl = useKrnFormControl<readonly T[]>(this, [], {
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'multi-select', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly isReadOnly = computed(() => this.a11y.readOnly());
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );
  protected readonly visibleLimit = computed(() => {
    const limit = this.maxVisible();
    return Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : 0;
  });
  protected readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.isSelected(option)),
  );
  protected readonly visibleSelectedOptions = computed(() =>
    this.selectedOptions().slice(0, this.visibleLimit()),
  );
  protected readonly remainingCount = computed(() =>
    Math.max(0, this.selectedOptions().length - this.visibleLimit()),
  );
  protected readonly mutableValues = computed(() =>
    this.selectedOptions().map((option) => option.value),
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    effect(() => {
      if (this.open() && (this.isDisabled() || this.isReadOnly())) {
        this.open.set(false);
      }
    });
    this.formControl.watchValidationInputs(this.required, this.a11y.required);
  }

  private normalizeIncomingValue(value: unknown): readonly T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  private valuesEqual(current: readonly T[], next: readonly T[]): boolean {
    return (
      current.length === next.length &&
      current.every((value, index) => this.identityMatcher()(value, next[index]!))
    );
  }

  protected setOpen(open: boolean): void {
    if (!this.isDisabled() && !this.isReadOnly()) {
      this.open.set(open);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.formControl.touch();
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.close());
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    if (focusStayedWithin(event)) {
      return;
    }
    this.close();
  }

  protected selectValues(values: T[]): void {
    if (this.isDisabled() || this.isReadOnly() || this.optionsState() !== 'ready') {
      return;
    }
    if (
      values.some(
        (value) => !this.options().some((option) => this.identityMatcher()(option.value, value)),
      )
    ) {
      return;
    }
    const current = this.controlValue();
    const canonical = this.options().reduce<T[]>((result, option) => {
      const alreadyIncluded = result.some((value) => this.identityMatcher()(value, option.value));
      const requested = values.some((value) => this.identityMatcher()(option.value, value));
      const selected = current.some((value) => this.identityMatcher()(option.value, value));
      if (!alreadyIncluded && (this.disabledHandler()(option) ? selected : requested)) {
        result.push(option.value);
      }
      return result;
    }, []);
    if (this.formControl.commitUserValue(canonical)) {
      this.valueChange.emit(canonical);
    }
  }

  protected isSelected(option: KrnSelectOption<T>): boolean {
    return this.controlValue().some((value) => this.identityMatcher()(option.value, value));
  }

  protected optionContext(option: KrnSelectOption<T>): KrnSelectOptionContext<T> {
    return {
      $implicit: option,
      option,
      selected: this.isSelected(option),
    };
  }

  focus(options?: FocusOptions): void {
    this.trigger()?.nativeElement.focus(options);
  }
}

/**
 * @internalReviewWith kit:KrnAutocomplete
 */
@Directive({
  selector: 'input[krnEditableComboboxSemantics]',
  host: {
    '[attr.aria-autocomplete]': 'mode()',
    '[attr.aria-expanded]': 'expanded()',
  },
})
export class KrnEditableComboboxSemantics {
  readonly mode = input.required<KrnAutocompleteMode>({
    alias: 'krnEditableComboboxSemantics',
  });
  readonly expanded = input.required<boolean>({ alias: 'krnComboboxSemanticsExpanded' });
}

const COMBOBOX_IMPORTS = [
  Combobox,
  ComboboxPopup,
  ComboboxWidget,
  Listbox,
  Option,
  KrnEditableComboboxSemantics,
];

interface KrnEditableComboboxHost {
  readonly autocompleteModeInput: Signal<KrnAutocompleteMode | undefined>;
  readonly allowCustomValueInput: Signal<boolean | undefined>;
  readonly id: Signal<string>;
  readonly placeholder: Signal<string | undefined>;
  readonly emptyText: Signal<string | undefined>;
  readonly loadingText: Signal<string | undefined>;
  readonly errorText: Signal<string | undefined>;
  readonly ariaLabel: Signal<string>;
  readonly ariaLabelledBy: Signal<string>;
  readonly ariaDescribedBy: Signal<string>;
  readonly toggleLabel: Signal<string | undefined>;
  readonly name: Signal<string>;
  readonly options: Signal<readonly KrnSelectOption<string>[]>;
  readonly optionsState: Signal<KrnOptionsState>;
  readonly filterLocally: Signal<boolean>;
  readonly optionFilter: Signal<KrnOptionFilter<string> | null>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly value: Signal<string | undefined>;
  readonly open: ModelSignal<boolean>;
  readonly valueChange: OutputEmitterRef<string>;
  readonly queryChange: OutputEmitterRef<string>;
  readonly optionSelected: OutputEmitterRef<KrnSelectOption<string>>;
}

interface KrnEditableComboboxView {
  readonly combobox: Signal<Combobox | undefined>;
  readonly input: Signal<ElementRef<HTMLInputElement> | undefined>;
}

/** Internal signal controller shared by the two public editable-combobox variants. */
class KrnEditableComboboxController {
  private readonly host: KrnEditableComboboxHost;
  private readonly view: KrnEditableComboboxView;
  private readonly defaultAutocompleteMode: KrnAutocompleteMode;
  private readonly defaultAllowCustomValue: boolean;
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = krnInheritedLocale();
  private readonly platform = inject(KRN_PLATFORM);
  private readonly renderer = inject(Renderer2);
  readonly inputFocused = signal(false);
  private readonly queryEditing = signal(false);
  private inlineRenderRevision = 0;
  private pendingEnterClose: KrnScheduledHandle | null = null;
  private renderedAutocompleteMode: KrnAutocompleteMode | undefined;
  readonly autocompleteMode: Signal<KrnAutocompleteMode>;
  readonly hasAutocompletePopup: Signal<boolean>;
  readonly allowCustomValue: Signal<boolean>;
  readonly query = signal('');
  private readonly formControl: ReturnType<typeof useKrnFormControl<string>>;
  readonly controlValue: ReturnType<typeof signal<string>>;
  readonly formDisabled: ReturnType<typeof signal<boolean>>;
  readonly writeValue: (value: unknown) => void;
  readonly registerOnChange: (fn: (value: string) => void) => void;
  readonly registerOnTouched: (fn: () => void) => void;
  readonly setDisabledState: (disabled: boolean) => void;
  readonly validate: ReturnType<typeof useKrnFormControl<string>>['validate'];
  readonly registerOnValidatorChange: (fn: () => void) => void;
  readonly a11y: ReturnType<typeof useKrnControlA11y>;
  readonly isDisabled: Signal<boolean>;
  readonly isReadOnly: Signal<boolean>;
  readonly effectiveLabelledBy: Signal<string | null>;
  readonly effectiveDescribedBy: Signal<string | null>;
  readonly filteredOptions: Signal<readonly KrnSelectOption<string>[]>;
  private readonly inlineSuggestedOption: Signal<KrnSelectOption<string> | undefined>;
  readonly inlineSuggestion: Signal<string | undefined>;
  readonly selectedValues: Signal<string[]>;

  constructor(
    host: KrnEditableComboboxHost,
    view: KrnEditableComboboxView,
    defaultAutocompleteMode: KrnAutocompleteMode,
    defaultAllowCustomValue: boolean,
  ) {
    this.host = host;
    this.view = view;
    this.defaultAutocompleteMode = defaultAutocompleteMode;
    this.defaultAllowCustomValue = defaultAllowCustomValue;
    this.autocompleteMode = computed(
      () => this.host.autocompleteModeInput() ?? this.defaultAutocompleteMode,
    );
    this.hasAutocompletePopup = computed(() => {
      const mode = this.autocompleteMode();
      return mode === 'list' || mode === 'both';
    });
    this.allowCustomValue = computed(
      () => this.host.allowCustomValueInput() ?? this.defaultAllowCustomValue,
    );
    this.formControl = useKrnFormControl(this, '', {
      normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
      validateValue: (value) => this.validateValue(value),
    });
    this.controlValue = this.formControl.controlValue;
    this.formDisabled = this.formControl.formDisabled;
    this.writeValue = this.formControl.writeValue;
    this.registerOnChange = this.formControl.registerOnChange;
    this.registerOnTouched = this.formControl.registerOnTouched;
    this.setDisabledState = this.formControl.setDisabledState;
    this.validate = this.formControl.validate;
    this.registerOnValidatorChange = this.formControl.registerOnValidatorChange;
    this.a11y = useKrnControlA11y(this, this.host.id, this.host.invalid, 'combobox', {
      disabled: this.host.disabled,
      readOnly: this.host.readOnly,
      required: this.host.required,
    });
    this.isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
    this.isReadOnly = computed(() => this.a11y.readOnly());
    this.effectiveLabelledBy = computed(() =>
      mergeAriaIds(this.host.ariaLabelledBy(), this.a11y.labelledBy()),
    );
    this.effectiveDescribedBy = computed(() =>
      mergeAriaIds(this.host.ariaDescribedBy(), this.a11y.describedBy()),
    );
    this.filteredOptions = computed(() => {
      const rawQuery = this.query().trim();
      if (!rawQuery || !this.host.filterLocally()) {
        return this.host.options();
      }
      const optionFilter = this.host.optionFilter();
      if (optionFilter) {
        return this.host.options().filter((option) => optionFilter(option, rawQuery));
      }
      const query = this.normalizeForSearch(rawQuery);
      return this.host
        .options()
        .filter((option) =>
          this.normalizeForSearch(`${option.label} ${option.description ?? ''}`).includes(query),
        );
    });
    this.inlineSuggestedOption = computed(() => {
      if (this.host.optionsState() !== 'ready') {
        return undefined;
      }
      const mode = this.autocompleteMode();
      if (mode !== 'inline' && mode !== 'both') {
        return undefined;
      }
      const rawQuery = this.query();
      if (!rawQuery.trim()) {
        return undefined;
      }
      const query = this.normalizeForSearch(rawQuery);
      return this.filteredOptions().find(
        (option) => !option.disabled && this.normalizeForSearch(option.label).startsWith(query),
      );
    });
    this.inlineSuggestion = computed(() => this.inlineSuggestedOption()?.label);
    this.selectedValues = computed(() => {
      const value = this.controlValue();
      return this.host.options().some((option) => option.value === value) ? [value] : [];
    });
    this.formControl.bindStandaloneValue(this.host.value);
    this.formControl.watchValidationInputs(this.host.required, this.a11y.required);
    const openSubscription = this.host.open.subscribe(() => this.cancelPendingEnterClose());
    this.destroyRef.onDestroy(() => {
      openSubscription.unsubscribe();
      this.cancelPendingEnterClose();
    });
    effect(() => {
      this.host.open();
      this.cancelPendingEnterClose();
    });
    effect(() => {
      if (
        this.host.open() &&
        (this.isDisabled() || this.isReadOnly() || !this.hasAutocompletePopup())
      ) {
        this.setOpen(false);
      }
    });
    effect(() => {
      const value = this.controlValue();
      const option = this.host.options().find((item) => item.value === value);
      const restoreConstrainedPopup =
        !this.host.open() && this.hasAutocompletePopup() && !this.allowCustomValue();
      if (
        (!this.queryEditing() || restoreConstrainedPopup) &&
        option &&
        this.query() !== option.label
      ) {
        this.queryEditing.set(false);
        this.setQuery(option.label);
      }
    });
    afterRenderEffect({
      write: () => {
        const input = this.view.input()?.nativeElement;
        const mode = this.autocompleteMode();
        const hasPopup = this.hasAutocompletePopup();
        const suggestion = this.inlineSuggestion();
        const expanded = this.host.open() && hasPopup;
        if (!input) {
          return;
        }
        this.renderer.setAttribute(input, 'aria-autocomplete', mode);
        this.renderer.setAttribute(input, 'aria-expanded', String(expanded));
        const leavingInline = this.renderedAutocompleteMode === 'inline' && mode !== 'inline';
        this.renderedAutocompleteMode = mode;
        if (mode !== 'inline' && !leavingInline) {
          this.inlineRenderRevision += 1;
          return;
        }
        const query = this.query();
        const canSuggest =
          mode === 'inline' &&
          this.inputFocused() &&
          !this.isDisabled() &&
          !this.isReadOnly() &&
          suggestion !== undefined &&
          this.normalizeForSearch(suggestion).startsWith(this.normalizeForSearch(query));
        const revision = ++this.inlineRenderRevision;
        this.platform.queueMicrotask(() => {
          if (this.destroyRef.destroyed || revision !== this.inlineRenderRevision) {
            return;
          }
          this.renderer.setProperty(input, 'value', canSuggest ? suggestion : query);
          if (canSuggest) {
            input.setSelectionRange(query.length, suggestion.length);
          }
        });
      },
    });
  }

  private normalizeIncomingValue(value: unknown): string {
    const normalized = typeof value === 'string' ? value : '';
    const option = this.host.options().find((item) => item.value === normalized);
    this.queryEditing.set(false);
    this.setQuery(option?.label ?? normalized);
    return normalized;
  }

  private validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  updateQuery(query: string): void {
    if (query === this.query()) {
      return;
    }
    if (this.isDisabled() || this.isReadOnly()) {
      return;
    }
    this.queryEditing.set(true);
    this.setQuery(query);
    this.host.queryChange.emit(query);
    this.host.open.set(this.hasAutocompletePopup());
    if (this.allowCustomValue() && this.formControl.commitUserValue(query)) {
      this.host.valueChange.emit(query);
    }
  }

  selectValues(values: string[]): void {
    if (this.isDisabled() || this.isReadOnly() || this.host.optionsState() !== 'ready') {
      return;
    }
    const value = values.at(-1);
    const option = this.host.options().find((item) => item.value === value);
    if (values.length === 0) {
      return;
    }
    if (!option || option.disabled) {
      return;
    }
    this.queryEditing.set(false);
    this.setQuery(option.label);
    if (this.formControl.commitUserValue(option.value)) {
      this.host.valueChange.emit(option.value);
      this.host.optionSelected.emit(option);
    }
    this.setOpen(false);
  }

  commitQuery(event?: Event): void {
    if (event && this.autocompleteMode() === 'inline' && this.acceptInlineSuggestion()) {
      return;
    }
    if (event && this.host.open()) {
      event.preventDefault();
      this.cancelPendingEnterClose();
      const pendingClose = this.platform.schedule(() => {
        if (this.pendingEnterClose === pendingClose) {
          this.pendingEnterClose = null;
          this.setOpen(false);
        }
      });
      if (pendingClose === null) {
        this.setOpen(false);
        return;
      }
      this.pendingEnterClose = pendingClose;
      return;
    }
    if (this.isDisabled() || this.isReadOnly()) {
      return;
    }
    if (this.host.optionsState() !== 'ready') {
      this.setOpen(false);
      return;
    }
    const exact = this.filteredOptions().find(
      (option) =>
        !option.disabled &&
        this.normalizeForSearch(option.label) === this.normalizeForSearch(this.query().trim()),
    );
    if (exact) {
      if (this.controlValue() === exact.value) {
        this.queryEditing.set(false);
        this.setQuery(exact.label);
        this.host.open.set(false);
      } else {
        this.selectValues([exact.value]);
      }
    } else if (this.allowCustomValue()) {
      const query = this.query();
      if (this.controlValue() !== query) {
        this.formControl.commitValue(query);
        this.host.valueChange.emit(query);
      }
      this.queryEditing.set(false);
      this.host.open.set(false);
    } else {
      this.restoreCommittedQuery();
      this.host.open.set(false);
    }
  }

  closeOnFocusOut(event: FocusEvent): void {
    if (focusStayedWithin(event)) {
      return;
    }
    this.commitQuery();
    this.formControl.touch();
  }

  private normalizeForSearch(value: string): string {
    return value.toLocaleLowerCase(this.locale());
  }

  setOpen(open: boolean): void {
    this.cancelPendingEnterClose();
    const next = open && this.hasAutocompletePopup() && !this.isDisabled() && !this.isReadOnly();
    this.view.combobox()?.expanded.set(next);
    if (!next && !this.allowCustomValue()) {
      this.restoreCommittedQuery();
    } else if (!next) {
      this.queryEditing.set(false);
    }
    this.host.open.set(next);
  }

  openOptions(): void {
    this.setOpen(true);
  }

  cancelQuery(): void {
    if (!this.allowCustomValue()) {
      this.restoreCommittedQuery();
    }
    this.host.open.set(false);
  }

  onEscape(event: Event): void {
    consumeOpenEscape(event, this.host.open(), () => this.cancelQuery());
  }

  toggleOptions(input: HTMLInputElement): void {
    this.setOpen(!this.host.open());
    input.focus();
  }

  acceptInlineCompletion(input: HTMLInputElement): void {
    const option = this.inlineSuggestedOption();
    const end = option?.label.length;
    if (
      option &&
      this.query().length < option.label.length &&
      input.value === option.label &&
      input.selectionStart === end &&
      input.selectionEnd === end
    ) {
      this.acceptInlineSuggestion();
    }
  }

  closeSelectedOption(option: KrnSelectOption<string>): void {
    if (
      this.host.optionsState() === 'ready' &&
      !this.isDisabled() &&
      !this.isReadOnly() &&
      !option.disabled &&
      option.value === this.controlValue()
    ) {
      this.setOpen(false);
    }
  }

  private restoreCommittedQuery(): void {
    const option = this.host.options().find((item) => item.value === this.controlValue());
    const query = option?.label ?? (this.allowCustomValue() ? this.controlValue() : '');
    this.queryEditing.set(false);
    this.setQuery(query);
  }

  private setQuery(query: string): void {
    this.query.set(query);
    this.view.combobox()?.value.set(query);
  }

  private cancelPendingEnterClose(): void {
    if (this.pendingEnterClose !== null) {
      this.platform.cancelScheduled(this.pendingEnterClose);
      this.pendingEnterClose = null;
    }
  }

  private acceptInlineSuggestion(): boolean {
    const option = this.inlineSuggestedOption();
    if (!option || this.isDisabled() || this.isReadOnly()) {
      return false;
    }
    this.selectValues([option.value]);
    return true;
  }

  focus(options?: FocusOptions): void {
    this.view.input()?.nativeElement.focus(options);
  }

  blur(): void {
    this.view.input()?.nativeElement.blur();
  }

  select(): void {
    this.view.input()?.nativeElement.select();
  }

  setSelectionRange(start: number, end: number, direction?: SelectionDirection): void {
    this.view.input()?.nativeElement.setSelectionRange(start, end, direction);
  }
}

@Component({
  selector: 'krn-combobox',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
  },
  imports: COMBOBOX_IMPORTS,
  providers: [...provideKrnFormControl()],
  templateUrl: './editable-combobox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCombobox {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly autocompleteModeInput = input<KrnAutocompleteMode | undefined>(undefined, {
    alias: 'autocompleteMode',
  });
  readonly allowCustomValueInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'allowCustomValue',
    transform: optionalBooleanAttribute,
  });
  readonly id = input('');
  readonly placeholder = input<string | undefined>();
  protected readonly resolvedPlaceholder = krnInputFallback(
    this.placeholder,
    () => this.translations.forms.startTyping,
  );
  readonly emptyText = input<string | undefined>();
  protected readonly resolvedEmptyText = krnInputFallback(
    this.emptyText,
    () => this.translations.forms.noMatches,
  );
  readonly loadingText = input<string | undefined>();
  protected readonly resolvedLoadingText = krnInputFallback(
    this.loadingText,
    () =>
      this.translations.forms.loadingOptions ?? KRN_ENGLISH_TRANSLATIONS.forms.loadingOptions ?? '',
  );
  readonly errorText = input<string | undefined>();
  protected readonly resolvedErrorText = krnInputFallback(
    this.errorText,
    () =>
      this.translations.forms.optionsLoadFailed ??
      KRN_ENGLISH_TRANSLATIONS.forms.optionsLoadFailed ??
      '',
  );
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly toggleLabel = input<string | undefined>();
  protected readonly resolvedToggleLabel = krnInputFallback(
    this.toggleLabel,
    () => this.translations.forms.showOptions,
  );
  readonly name = input('');
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  /** Controls whether options are interactive or replaced by an announced loading/error state. */
  readonly optionsState = input<KrnOptionsState>('ready');
  /** Set to false when the consumer filters options remotely in response to queryChange. */
  readonly filterLocally = input(true, { transform: booleanAttribute });
  /** Overrides the default case-insensitive local option filter. */
  readonly optionFilter = input<KrnOptionFilter<string> | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<string | undefined>(undefined);
  readonly open = model(false);
  readonly valueChange = output<string>();
  /** Emits every user query so remote option sources can load and replace options. */
  readonly queryChange = output<string>();
  readonly optionSelected = output<KrnSelectOption<string>>();

  private readonly comboboxDirective = viewChild<Combobox>('combo');
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('comboInput');
  readonly #controller = new KrnEditableComboboxController(
    this,
    { combobox: this.comboboxDirective, input: this.inputElement },
    'list',
    false,
  );
  protected readonly inputFocused = this.#controller.inputFocused;
  protected readonly autocompleteMode = this.#controller.autocompleteMode;
  protected readonly hasAutocompletePopup = this.#controller.hasAutocompletePopup;
  protected readonly allowCustomValue = this.#controller.allowCustomValue;
  protected readonly query = this.#controller.query;
  protected readonly controlValue = this.#controller.controlValue;
  protected readonly formDisabled = this.#controller.formDisabled;
  readonly writeValue = this.#controller.writeValue;
  readonly registerOnChange = this.#controller.registerOnChange;
  readonly registerOnTouched = this.#controller.registerOnTouched;
  readonly setDisabledState = this.#controller.setDisabledState;
  readonly validate = this.#controller.validate;
  readonly registerOnValidatorChange = this.#controller.registerOnValidatorChange;
  protected readonly a11y = this.#controller.a11y;
  protected readonly isDisabled = this.#controller.isDisabled;
  protected readonly isReadOnly = this.#controller.isReadOnly;
  protected readonly effectiveLabelledBy = this.#controller.effectiveLabelledBy;
  protected readonly effectiveDescribedBy = this.#controller.effectiveDescribedBy;
  protected readonly filteredOptions = this.#controller.filteredOptions;
  protected readonly inlineSuggestion = this.#controller.inlineSuggestion;
  protected readonly selectedValues = this.#controller.selectedValues;

  protected updateQuery(query: string): void {
    this.#controller.updateQuery(query);
  }

  protected selectValues(values: string[]): void {
    this.#controller.selectValues(values);
  }

  protected commitQuery(event?: Event): void {
    this.#controller.commitQuery(event);
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    this.#controller.closeOnFocusOut(event);
  }

  protected setOpen(open: boolean): void {
    this.#controller.setOpen(open);
  }

  protected openOptions(): void {
    this.#controller.openOptions();
  }

  protected cancelQuery(): void {
    this.#controller.cancelQuery();
  }

  protected onEscape(event: Event): void {
    this.#controller.onEscape(event);
  }

  protected toggleOptions(input: HTMLInputElement): void {
    this.#controller.toggleOptions(input);
  }

  protected acceptInlineCompletion(input: HTMLInputElement): void {
    this.#controller.acceptInlineCompletion(input);
  }

  protected closeSelectedOption(option: KrnSelectOption<string>): void {
    this.#controller.closeSelectedOption(option);
  }

  focus(options?: FocusOptions): void {
    this.#controller.focus(options);
  }

  blur(): void {
    this.#controller.blur();
  }

  select(): void {
    this.#controller.select();
  }

  setSelectionRange(start: number, end: number, direction?: SelectionDirection): void {
    this.#controller.setSelectionRange(start, end, direction);
  }
}

@Component({
  selector: 'krn-autocomplete',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
    '[attr.tabindex]': 'null',
  },
  imports: COMBOBOX_IMPORTS,
  providers: [...provideKrnFormControl()],
  templateUrl: './editable-combobox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnAutocomplete {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly autocompleteModeInput = input<KrnAutocompleteMode | undefined>(undefined, {
    alias: 'autocompleteMode',
  });
  readonly allowCustomValueInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'allowCustomValue',
    transform: optionalBooleanAttribute,
  });
  readonly id = input('');
  readonly placeholder = input<string | undefined>();
  protected readonly resolvedPlaceholder = krnInputFallback(
    this.placeholder,
    () => this.translations.forms.startTyping,
  );
  readonly emptyText = input<string | undefined>();
  protected readonly resolvedEmptyText = krnInputFallback(
    this.emptyText,
    () => this.translations.forms.noMatches,
  );
  readonly loadingText = input<string | undefined>();
  protected readonly resolvedLoadingText = krnInputFallback(
    this.loadingText,
    () =>
      this.translations.forms.loadingOptions ?? KRN_ENGLISH_TRANSLATIONS.forms.loadingOptions ?? '',
  );
  readonly errorText = input<string | undefined>();
  protected readonly resolvedErrorText = krnInputFallback(
    this.errorText,
    () =>
      this.translations.forms.optionsLoadFailed ??
      KRN_ENGLISH_TRANSLATIONS.forms.optionsLoadFailed ??
      '',
  );
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly toggleLabel = input<string | undefined>();
  protected readonly resolvedToggleLabel = krnInputFallback(
    this.toggleLabel,
    () => this.translations.forms.showOptions,
  );
  readonly name = input('');
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  /** Controls whether options are interactive or replaced by an announced loading/error state. */
  readonly optionsState = input<KrnOptionsState>('ready');
  /** Set to false when the consumer filters options remotely in response to queryChange. */
  readonly filterLocally = input(true, { transform: booleanAttribute });
  /** Overrides the default case-insensitive local option filter. */
  readonly optionFilter = input<KrnOptionFilter<string> | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<string | undefined>(undefined);
  readonly open = model(false);
  readonly valueChange = output<string>();
  /** Emits every user query so remote option sources can load and replace options. */
  readonly queryChange = output<string>();
  readonly optionSelected = output<KrnSelectOption<string>>();

  private readonly comboboxDirective = viewChild<Combobox>('combo');
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('comboInput');
  readonly #controller = new KrnEditableComboboxController(
    this,
    { combobox: this.comboboxDirective, input: this.inputElement },
    'both',
    true,
  );
  protected readonly inputFocused = this.#controller.inputFocused;
  protected readonly autocompleteMode = this.#controller.autocompleteMode;
  protected readonly hasAutocompletePopup = this.#controller.hasAutocompletePopup;
  protected readonly allowCustomValue = this.#controller.allowCustomValue;
  protected readonly query = this.#controller.query;
  protected readonly controlValue = this.#controller.controlValue;
  protected readonly formDisabled = this.#controller.formDisabled;
  readonly writeValue = this.#controller.writeValue;
  readonly registerOnChange = this.#controller.registerOnChange;
  readonly registerOnTouched = this.#controller.registerOnTouched;
  readonly setDisabledState = this.#controller.setDisabledState;
  readonly validate = this.#controller.validate;
  readonly registerOnValidatorChange = this.#controller.registerOnValidatorChange;
  protected readonly a11y = this.#controller.a11y;
  protected readonly isDisabled = this.#controller.isDisabled;
  protected readonly isReadOnly = this.#controller.isReadOnly;
  protected readonly effectiveLabelledBy = this.#controller.effectiveLabelledBy;
  protected readonly effectiveDescribedBy = this.#controller.effectiveDescribedBy;
  protected readonly filteredOptions = this.#controller.filteredOptions;
  protected readonly inlineSuggestion = this.#controller.inlineSuggestion;
  protected readonly selectedValues = this.#controller.selectedValues;

  protected updateQuery(query: string): void {
    this.#controller.updateQuery(query);
  }

  protected selectValues(values: string[]): void {
    this.#controller.selectValues(values);
  }

  protected commitQuery(event?: Event): void {
    this.#controller.commitQuery(event);
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    this.#controller.closeOnFocusOut(event);
  }

  protected setOpen(open: boolean): void {
    this.#controller.setOpen(open);
  }

  protected openOptions(): void {
    this.#controller.openOptions();
  }

  protected cancelQuery(): void {
    this.#controller.cancelQuery();
  }

  protected onEscape(event: Event): void {
    this.#controller.onEscape(event);
  }

  protected toggleOptions(input: HTMLInputElement): void {
    this.#controller.toggleOptions(input);
  }

  protected acceptInlineCompletion(input: HTMLInputElement): void {
    this.#controller.acceptInlineCompletion(input);
  }

  protected closeSelectedOption(option: KrnSelectOption<string>): void {
    this.#controller.closeSelectedOption(option);
  }

  focus(options?: FocusOptions): void {
    this.#controller.focus(options);
  }

  blur(): void {
    this.#controller.blur();
  }

  select(): void {
    this.#controller.select();
  }

  setSelectionRange(start: number, end: number, direction?: SelectionDirection): void {
    this.#controller.setSelectionRange(start, end, direction);
  }
}
