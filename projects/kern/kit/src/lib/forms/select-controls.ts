import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import type {
  KrnAutocompleteMode,
  KrnIdentityMatcher,
  KrnOptionDisabledHandler,
  KrnOptionStringifier,
  KrnOptionTrackBy,
  KrnSelectOption,
  KrnSelectOptionContext,
} from './form-types';
import {
  KrnValueAccessor,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
} from './value-accessor';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined || value === null ? undefined : booleanAttribute(value);

const nativeSelectPlaceholderKey = '__krn-native-select-placeholder__';

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
  },
  providers: [...provideKrnFormControl(() => KrnNativeSelect)],
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <select
        class="krn-select-native"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-readonly]="a11y.readOnly()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [name]="name()"
        [required]="a11y.required()"
        [value]="selectedNativeKey()"
        (blur)="touch()"
        (change)="selectNative($event)"
      >
        <option
          value="__krn-native-select-placeholder__"
          [disabled]="a11y.required()"
          [hidden]="!placeholder()"
          [attr.selected]="selectedNativeKey() === '__krn-native-select-placeholder__' ? '' : null"
        >
          {{ placeholder() }}
        </option>
        @for (option of options(); track trackBy()(option, $index)) {
          <option
            [disabled]="disabledHandler()(option)"
            [attr.selected]="selectedNativeKey() === optionKey(option, $index) ? '' : null"
            [value]="optionKey(option, $index)"
          >
            {{ stringify()(option) }}
          </option>
        }
      </select>
      <span class="krn-control-affix" aria-hidden="true">
        <span class="krn-select-chevron"></span>
      </span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnNativeSelect<T = string> extends KrnValueAccessor<T | null> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
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
  readonly valueChange = output<T | null>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'native-select', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
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
    super(null);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): T | null {
    return value === null || value === undefined ? null : (value as T);
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected optionKey(_option: KrnSelectOption<T>, index: number): string {
    return `__krn-native-select-option-${index}__`;
  }

  protected selectNative(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.a11y.readOnly()) {
      select.value = this.selectedNativeKey();
      return;
    }
    const optionIndex = this.options().findIndex(
      (candidate, index) => this.optionKey(candidate, index) === select.value,
    );
    const option = optionIndex >= 0 ? this.options()[optionIndex] : undefined;
    const value = option ? option.value : null;
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-select',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
  },
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, NgTemplateOutlet, Option],
  providers: [...provideKrnFormControl(() => KrnSelect)],
  template: `
    <div
      class="krn-combobox"
      (focusout)="closeOnFocusOut($event)"
      (keydown.escape)="onEscape($event)"
    >
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="a11y.readOnly()"
      >
        <button
          #combo="ngCombobox"
          ngCombobox
          class="krn-select-trigger"
          type="button"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-readonly]="a11y.readOnly()"
          [attr.aria-required]="a11y.required()"
          [attr.disabled]="isDisabled() ? '' : null"
          [disabled]="isDisabled()"
          [expanded]="open()"
          [id]="a11y.id()"
          (expandedChange)="setOpen($event)"
        >
          @if (selectedOption(); as selected) {
            <span class="krn-select-value">
              @if (selectedTemplate(); as template) {
                <ng-container
                  [ngTemplateOutlet]="template"
                  [ngTemplateOutletContext]="optionContext(selected)"
                />
              } @else {
                {{ stringify()(selected) }}
              }
            </span>
          } @else {
            <span class="krn-select-placeholder">{{ placeholder() }}</span>
          }
          <span class="krn-select-chevron" aria-hidden="true"></span>
        </button>
      </span>

      <ng-template ngComboboxPopup popupType="listbox" [combobox]="combo">
        <ul
          #listbox="ngListbox"
          ngComboboxWidget
          ngListbox
          class="krn-listbox"
          focusMode="activedescendant"
          selectionMode="explicit"
          [activeDescendant]="listbox.activeDescendant()"
          [disabled]="isDisabled()"
          [value]="selectedValues()"
          (valueChange)="selectValues($event)"
        >
          @for (option of options(); track trackBy()(option, $index)) {
            <li
              ngOption
              class="krn-option"
              [disabled]="disabledHandler()(option)"
              [label]="stringify()(option)"
              [value]="option.value"
            >
              <span class="krn-option__copy">
                @if (optionTemplate(); as template) {
                  <ng-container
                    [ngTemplateOutlet]="template"
                    [ngTemplateOutletContext]="optionContext(option)"
                  />
                } @else {
                  <span>{{ stringify()(option) }}</span>
                  @if (option.description) {
                    <span class="krn-option__description">
                      {{ option.description }}
                    </span>
                  }
                }
              </span>
              @if (isSelected(option)) {
                <span class="krn-option__check" aria-hidden="true">✓</span>
              }
            </li>
          } @empty {
            <li class="krn-option" aria-disabled="true">{{ emptyText() }}</li>
          }
        </ul>
      </ng-template>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSelect<T = string> extends KrnValueAccessor<T | null> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly placeholder = input(this.translations.forms.selectOption);
  readonly emptyText = input(this.translations.forms.noOptions);
  readonly ariaLabel = input('');
  readonly options = input.required<readonly KrnSelectOption<T>[]>();
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
  readonly open = model(false);
  readonly valueChange = output<T | null>();
  readonly selectionChange = output<KrnSelectOption<T> | null>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'select', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
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
    super(null);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): T | null {
    return value === null || value === undefined ? null : (value as T);
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected setOpen(open: boolean): void {
    if (!this.isDisabled() && !this.a11y.readOnly()) {
      this.open.set(open);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.touch();
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
    if (this.a11y.readOnly()) {
      return;
    }
    const value = values.at(-1) ?? null;
    this.commitValue(value);
    this.valueChange.emit(value);
    this.selectionChange.emit(
      value === null
        ? null
        : (this.options().find((option) => this.identityMatcher()(option.value, value)) ?? null),
    );
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
}

@Component({
  selector: 'krn-multi-select',
  host: {
    class: 'krn-select-host krn-multi-select-host',
    '[attr.id]': 'null',
  },
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, NgTemplateOutlet, Option],
  providers: [...provideKrnFormControl(() => KrnMultiSelect)],
  template: `
    <div
      class="krn-combobox"
      (focusout)="closeOnFocusOut($event)"
      (keydown.escape)="onEscape($event)"
    >
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="a11y.readOnly()"
      >
        <button
          #combo="ngCombobox"
          ngCombobox
          class="krn-select-trigger krn-select-trigger--multiple"
          type="button"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-readonly]="a11y.readOnly()"
          [attr.aria-required]="a11y.required()"
          [attr.disabled]="isDisabled() ? '' : null"
          [disabled]="isDisabled()"
          [expanded]="open()"
          [id]="a11y.id()"
          (expandedChange)="setOpen($event)"
        >
          @if (selectedOptions().length) {
            <span class="krn-token-row">
              @for (option of visibleSelectedOptions(); track trackBy()(option, $index)) {
                <span class="krn-token">
                  @if (selectedTemplate(); as template) {
                    <ng-container
                      [ngTemplateOutlet]="template"
                      [ngTemplateOutletContext]="optionContext(option)"
                    />
                  } @else {
                    {{ stringify()(option) }}
                  }
                </span>
              }
              @if (remainingCount() > 0) {
                <span class="krn-token">+{{ remainingCount() }}</span>
              }
            </span>
          } @else {
            <span class="krn-select-placeholder">{{ placeholder() }}</span>
          }
          <span class="krn-select-chevron" aria-hidden="true"></span>
        </button>
      </span>

      <ng-template ngComboboxPopup popupType="listbox" [combobox]="combo">
        <ul
          #listbox="ngListbox"
          ngComboboxWidget
          ngListbox
          class="krn-listbox"
          focusMode="activedescendant"
          selectionMode="explicit"
          [activeDescendant]="listbox.activeDescendant()"
          [disabled]="isDisabled()"
          [multi]="true"
          [value]="mutableValues()"
          (valueChange)="selectValues($event)"
        >
          @for (option of options(); track trackBy()(option, $index)) {
            <li
              ngOption
              class="krn-option"
              [disabled]="disabledHandler()(option)"
              [label]="stringify()(option)"
              [value]="option.value"
            >
              <span class="krn-option__copy">
                @if (optionTemplate(); as template) {
                  <ng-container
                    [ngTemplateOutlet]="template"
                    [ngTemplateOutletContext]="optionContext(option)"
                  />
                } @else {
                  <span>{{ stringify()(option) }}</span>
                  @if (option.description) {
                    <span class="krn-option__description">
                      {{ option.description }}
                    </span>
                  }
                }
              </span>
              @if (isSelected(option)) {
                <span class="krn-option__check" aria-hidden="true">✓</span>
              }
            </li>
          } @empty {
            <li class="krn-option" aria-disabled="true">{{ emptyText() }}</li>
          }
        </ul>
      </ng-template>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnMultiSelect<T = string> extends KrnValueAccessor<readonly T[]> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly placeholder = input(this.translations.forms.selectOptions);
  readonly emptyText = input(this.translations.forms.noOptions);
  readonly ariaLabel = input('');
  readonly options = input.required<readonly KrnSelectOption<T>[]>();
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
  readonly open = model(false);
  readonly valueChange = output<readonly T[]>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'multi-select', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.isSelected(option)),
  );
  protected readonly visibleSelectedOptions = computed(() =>
    this.selectedOptions().slice(0, this.maxVisible()),
  );
  protected readonly remainingCount = computed(() =>
    Math.max(0, this.selectedOptions().length - this.maxVisible()),
  );
  protected readonly mutableValues = computed(() =>
    this.selectedOptions().map((option) => option.value),
  );

  constructor() {
    super([]);
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): readonly T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected setOpen(open: boolean): void {
    if (!this.isDisabled() && !this.a11y.readOnly()) {
      this.open.set(open);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.touch();
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
    if (this.a11y.readOnly()) {
      return;
    }
    const unique = values.filter(
      (value, index) =>
        values.findIndex((candidate) => this.identityMatcher()(candidate, value)) === index,
    );
    this.commitValue(unique);
    this.valueChange.emit(unique);
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
}

const COMBOBOX_IMPORTS = [Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option];

/**
 * Base contract for editable KERN combobox implementations.
 *
 * @publicApi
 * @experimental
 */
@Directive()
export abstract class KrnEditableComboboxBase extends KrnValueAccessor<string> {
  private readonly comboboxDirective = viewChild<Combobox>('combo');
  private readonly locale = inject(KRN_LOCALE);
  private readonly translations = inject(KRN_TRANSLATIONS);
  protected readonly defaultAutocompleteMode: KrnAutocompleteMode = 'list';
  protected readonly defaultAllowCustomValue: boolean = false;
  protected readonly autocompleteModeInput = input<KrnAutocompleteMode | undefined>(undefined, {
    alias: 'autocompleteMode',
  });
  protected readonly allowCustomValueInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'allowCustomValue',
    transform: optionalBooleanAttribute,
  });

  readonly id = input('');
  readonly placeholder = input(this.translations.forms.startTyping);
  readonly emptyText = input(this.translations.forms.noMatches);
  readonly ariaLabel = input('');
  readonly toggleLabel = input(this.translations.forms.showOptions);
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  protected readonly autocompleteMode = computed(
    () => this.autocompleteModeInput() ?? this.defaultAutocompleteMode,
  );
  protected readonly allowCustomValue = computed(
    () => this.allowCustomValueInput() ?? this.defaultAllowCustomValue,
  );
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly valueChange = output<string>();
  readonly optionSelected = output<KrnSelectOption<string>>();
  protected readonly query = signal('');

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'combobox', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly filteredOptions = computed(() => {
    const query = this.normalizeForSearch(this.query().trim());
    if (!query) {
      return this.options();
    }
    return this.options().filter((option) =>
      this.normalizeForSearch(`${option.label} ${option.description ?? ''}`).includes(query),
    );
  });
  protected readonly inlineSuggestion = computed(() => {
    const mode = this.autocompleteMode();
    if (mode !== 'inline' && mode !== 'both') {
      return undefined;
    }

    const query = this.normalizeForSearch(this.query().trim());
    return this.options().find(
      (option) => !option.disabled && this.normalizeForSearch(option.label).startsWith(query),
    )?.label;
  });
  protected readonly selectedValues = computed(() => {
    const value = this.controlValue();
    return this.options().some((option) => option.value === value) ? [value] : [];
  });

  protected constructor() {
    super('');
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override normalizeIncomingValue(value: unknown): string {
    const normalized = typeof value === 'string' ? value : '';
    const option = this.options().find((item) => item.value === normalized);
    this.query.set(option?.label ?? normalized);
    return normalized;
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected updateQuery(query: string): void {
    if (this.a11y.readOnly()) {
      return;
    }
    this.query.set(query);
    this.open.set(true);
    if (this.allowCustomValue()) {
      this.commitValue(query);
      this.valueChange.emit(query);
    }
  }

  protected selectValues(values: string[]): void {
    if (this.a11y.readOnly()) {
      return;
    }
    const value = values.at(-1);
    const option = this.options().find((item) => item.value === value);
    if (!option) {
      return;
    }
    this.query.set(option.label);
    this.commitValue(option.value);
    this.valueChange.emit(option.value);
    this.optionSelected.emit(option);
    this.open.set(false);
  }

  protected commitQuery(): void {
    if (this.a11y.readOnly()) {
      return;
    }
    const exact = this.filteredOptions().find(
      (option) =>
        this.normalizeForSearch(option.label) === this.normalizeForSearch(this.query().trim()),
    );
    if (exact) {
      if (this.controlValue() === exact.value) {
        this.query.set(exact.label);
        this.open.set(false);
      } else {
        this.selectValues([exact.value]);
      }
    } else if (this.allowCustomValue()) {
      const query = this.query();
      if (this.controlValue() !== query) {
        this.commitValue(query);
        this.valueChange.emit(query);
      }
      this.open.set(false);
    } else {
      this.restoreCommittedQuery();
      this.open.set(false);
    }
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    if (focusStayedWithin(event)) {
      return;
    }
    this.commitQuery();
    this.touch();
  }

  private normalizeForSearch(value: string): string {
    return value.toLocaleLowerCase(this.locale);
  }

  protected setOpen(open: boolean): void {
    const next = open && !this.isDisabled() && !this.a11y.readOnly();
    if (!next && !this.allowCustomValue()) {
      this.restoreCommittedQuery();
    }
    this.open.set(next);
  }

  protected openOptions(): void {
    this.setOpen(true);
  }

  protected cancelQuery(): void {
    if (!this.allowCustomValue()) {
      this.restoreCommittedQuery();
    }
    this.open.set(false);
  }

  protected onEscape(event: Event): void {
    consumeOpenEscape(event, this.open(), () => this.cancelQuery());
  }

  protected toggleOptions(input: HTMLInputElement): void {
    this.setOpen(!this.open());
    input.focus();
  }

  private restoreCommittedQuery(): void {
    const option = this.options().find((item) => item.value === this.controlValue());
    const query = option?.label ?? (this.allowCustomValue() ? this.controlValue() : '');
    this.query.set(query);
    this.comboboxDirective()?.value.set(query);
  }
}

@Component({
  selector: 'krn-combobox',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
  },
  imports: COMBOBOX_IMPORTS,
  providers: [...provideKrnFormControl(() => KrnCombobox)],
  templateUrl: './editable-combobox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnCombobox extends KrnEditableComboboxBase {
  constructor() {
    super();
  }
}

@Component({
  selector: 'krn-autocomplete',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
  },
  imports: COMBOBOX_IMPORTS,
  providers: [...provideKrnFormControl(() => KrnAutocomplete)],
  templateUrl: './editable-combobox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnAutocomplete extends KrnEditableComboboxBase {
  protected override readonly defaultAutocompleteMode: KrnAutocompleteMode = 'both';
  protected override readonly defaultAllowCustomValue = true;

  constructor() {
    super();
  }
}
