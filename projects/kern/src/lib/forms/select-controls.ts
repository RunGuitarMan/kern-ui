import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { KrnAutocompleteMode, KrnSelectOption } from './form-types';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined || value === null ? undefined : booleanAttribute(value);

@Component({
  selector: 'krn-native-select',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnNativeSelect),
      multi: true,
    },
  ],
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="readOnly()"
    >
      <select
        class="krn-select-native"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-readonly]="readOnly()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [name]="name()"
        [required]="required()"
        [value]="controlValue() ?? ''"
        (blur)="touch()"
        (change)="selectNative($event)"
      >
        @if (placeholder()) {
          <option value="" [disabled]="required()">{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option [disabled]="option.disabled" [value]="option.value">
            {{ option.label }}
          </option>
        }
      </select>
      <span class="krn-control-affix" aria-hidden="true">
        <span class="krn-select-chevron"></span>
      </span>
    </span>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnNativeSelect extends KrnValueAccessor<string | null> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string | null>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'native-select');

  constructor() {
    super(null);
  }

  protected override normalizeIncomingValue(value: unknown): string | null {
    return typeof value === 'string' && value ? value : null;
  }

  protected selectNative(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.readOnly()) {
      select.value = this.controlValue() ?? '';
      return;
    }
    const value = select.value || null;
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
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnSelect),
      multi: true,
    },
  ],
  template: `
    <div class="krn-combobox" (focusout)="closeOnFocusOut($event)" (keydown.escape)="close()">
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="readOnly()"
      >
        <button
          #combo="ngCombobox"
          ngCombobox
          class="krn-select-trigger"
          type="button"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-readonly]="readOnly()"
          [attr.aria-required]="required()"
          [attr.disabled]="isDisabled() ? '' : null"
          [disabled]="isDisabled()"
          [expanded]="open()"
          [id]="a11y.id()"
          (expandedChange)="setOpen($event)"
        >
          @if (selectedOption(); as selected) {
            <span class="krn-select-value">{{ selected.label }}</span>
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
          @for (option of options(); track option.value) {
            <li
              ngOption
              class="krn-option"
              [disabled]="option.disabled"
              [label]="option.label"
              [value]="option.value"
            >
              <span class="krn-option__copy">
                <span>{{ option.label }}</span>
                @if (option.description) {
                  <span class="krn-option__description">
                    {{ option.description }}
                  </span>
                }
              </span>
              @if (controlValue() === option.value) {
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
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSelect extends KrnValueAccessor<string | null> {
  readonly id = input('');
  readonly placeholder = input('Select an option');
  readonly emptyText = input('No options');
  readonly ariaLabel = input('');
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly valueChange = output<string | null>();
  readonly selectionChange = output<KrnSelectOption<string> | null>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'select');
  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.controlValue()) ?? null,
  );
  protected readonly selectedValues = computed(() => {
    const value = this.controlValue();
    return value === null ? [] : [value];
  });

  constructor() {
    super(null);
  }

  protected override normalizeIncomingValue(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  protected setOpen(open: boolean): void {
    if (!this.isDisabled() && !this.readOnly()) {
      this.open.set(open);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.touch();
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    const current = event.currentTarget;
    const next = event.relatedTarget;
    if (current instanceof Node && next instanceof Node && current.contains(next)) {
      return;
    }
    this.close();
  }

  protected selectValues(values: string[]): void {
    if (this.readOnly()) {
      return;
    }
    const value = values.at(-1) ?? null;
    this.commitValue(value);
    this.valueChange.emit(value);
    this.selectionChange.emit(this.options().find((option) => option.value === value) ?? null);
    this.close();
  }
}

@Component({
  selector: 'krn-multi-select',
  host: {
    class: 'krn-select-host krn-multi-select-host',
    '[attr.id]': 'null',
  },
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnMultiSelect),
      multi: true,
    },
  ],
  template: `
    <div class="krn-combobox" (focusout)="closeOnFocusOut($event)" (keydown.escape)="close()">
      <span
        class="krn-control-shell"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="readOnly()"
      >
        <button
          #combo="ngCombobox"
          ngCombobox
          class="krn-select-trigger krn-select-trigger--multiple"
          type="button"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-readonly]="readOnly()"
          [attr.aria-required]="required()"
          [attr.disabled]="isDisabled() ? '' : null"
          [disabled]="isDisabled()"
          [expanded]="open()"
          [id]="a11y.id()"
          (expandedChange)="setOpen($event)"
        >
          @if (selectedOptions().length) {
            <span class="krn-token-row">
              @for (option of visibleSelectedOptions(); track option.value) {
                <span class="krn-token">{{ option.label }}</span>
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
          @for (option of options(); track option.value) {
            <li
              ngOption
              class="krn-option"
              [disabled]="option.disabled"
              [label]="option.label"
              [value]="option.value"
            >
              <span class="krn-option__copy">
                <span>{{ option.label }}</span>
                @if (option.description) {
                  <span class="krn-option__description">
                    {{ option.description }}
                  </span>
                }
              </span>
              @if (controlValue().includes(option.value)) {
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
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnMultiSelect extends KrnValueAccessor<readonly string[]> {
  readonly id = input('');
  readonly placeholder = input('Select options');
  readonly emptyText = input('No options');
  readonly ariaLabel = input('');
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  readonly maxVisible = input(2);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly valueChange = output<readonly string[]>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'multi-select');
  protected readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.controlValue().includes(option.value)),
  );
  protected readonly visibleSelectedOptions = computed(() =>
    this.selectedOptions().slice(0, this.maxVisible()),
  );
  protected readonly remainingCount = computed(() =>
    Math.max(0, this.selectedOptions().length - this.maxVisible()),
  );
  protected readonly mutableValues = computed(() => [...this.controlValue()]);

  constructor() {
    super([]);
  }

  protected override normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  protected setOpen(open: boolean): void {
    if (!this.isDisabled() && !this.readOnly()) {
      this.open.set(open);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.touch();
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    const current = event.currentTarget;
    const next = event.relatedTarget;
    if (current instanceof Node && next instanceof Node && current.contains(next)) {
      return;
    }
    this.close();
  }

  protected selectValues(values: string[]): void {
    if (this.readOnly()) {
      return;
    }
    const unique = [...new Set(values)];
    this.commitValue(unique);
    this.valueChange.emit(unique);
  }
}

const COMBOBOX_IMPORTS = [Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option];

@Directive()
abstract class KrnEditableComboboxBase extends KrnValueAccessor<string> {
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
  readonly placeholder = input('Start typing');
  readonly emptyText = input('No matches');
  readonly ariaLabel = input('');
  readonly toggleLabel = input('Show options');
  readonly options = input.required<readonly KrnSelectOption<string>[]>();
  readonly autocompleteMode = computed(
    () => this.autocompleteModeInput() ?? this.defaultAutocompleteMode,
  );
  readonly allowCustomValue = computed(
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
  readonly query = signal('');

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'combobox');
  protected readonly filteredOptions = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) {
      return this.options();
    }
    return this.options().filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLocaleLowerCase().includes(query),
    );
  });
  protected readonly inlineSuggestion = computed(() => {
    const mode = this.autocompleteMode();
    if (mode !== 'inline' && mode !== 'both') {
      return undefined;
    }

    const query = this.query().trim().toLocaleLowerCase();
    return this.options().find(
      (option) => !option.disabled && option.label.toLocaleLowerCase().startsWith(query),
    )?.label;
  });
  protected readonly selectedValues = computed(() => {
    const value = this.controlValue();
    return this.options().some((option) => option.value === value) ? [value] : [];
  });

  protected constructor() {
    super('');
  }

  protected override normalizeIncomingValue(value: unknown): string {
    const normalized = typeof value === 'string' ? value : '';
    const option = this.options().find((item) => item.value === normalized);
    this.query.set(option?.label ?? normalized);
    return normalized;
  }

  protected updateQuery(query: string): void {
    if (this.readOnly()) {
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
    if (this.readOnly()) {
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
    if (this.readOnly()) {
      return;
    }
    const exact = this.filteredOptions().find(
      (option) => option.label.toLocaleLowerCase() === this.query().trim().toLocaleLowerCase(),
    );
    if (exact) {
      this.selectValues([exact.value]);
    } else if (this.allowCustomValue()) {
      this.commitValue(this.query());
      this.valueChange.emit(this.query());
      this.open.set(false);
    }
  }

  protected closeOnFocusOut(event: FocusEvent): void {
    const current = event.currentTarget;
    const next = event.relatedTarget;
    if (current instanceof Node && next instanceof Node && current.contains(next)) {
      return;
    }
    this.open.set(false);
    this.touch();
  }

  protected setOpen(open: boolean): void {
    this.open.set(open && !this.isDisabled() && !this.readOnly());
  }

  protected openOptions(): void {
    this.setOpen(true);
  }

  protected toggleOptions(input: HTMLInputElement): void {
    this.setOpen(!this.open());
    input.focus();
  }
}

@Component({
  selector: 'krn-combobox',
  host: {
    class: 'krn-select-host',
    '[attr.id]': 'null',
  },
  imports: COMBOBOX_IMPORTS,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnCombobox),
      multi: true,
    },
  ],
  templateUrl: './editable-combobox.html',
  styleUrl: './forms.css',
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnAutocomplete),
      multi: true,
    },
  ],
  templateUrl: './editable-combobox.html',
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnAutocomplete extends KrnEditableComboboxBase {
  protected override readonly defaultAutocompleteMode: KrnAutocompleteMode = 'both';
  protected override readonly defaultAllowCustomValue = true;

  constructor() {
    super();
  }
}
