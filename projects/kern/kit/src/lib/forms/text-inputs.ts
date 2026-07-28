import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnControlSize, KrnInputMode } from './form-types';
import {
  KrnValueAccessor,
  maxError,
  maxLengthError,
  mergeValidationErrors,
  minError,
  minLengthError,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
} from './value-accessor';

const optionalNumber = (value: unknown): number | undefined =>
  value === null || value === undefined || value === '' ? undefined : numberAttribute(value);

@Component({
  selector: 'krn-text-input',
  providers: [...provideKrnFormControl(() => KrnTextInput)],
  host: {
    '[attr.id]': 'null',
    '[attr.data-size]': 'size()',
  },
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <span class="krn-control-affix">
        <ng-content select="[krnPrefix]" />
      </span>
      <input
        class="krn-input"
        type="text"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.autocomplete]="autocomplete() || null"
        [attr.inputmode]="inputMode()"
        [attr.maxlength]="maxLength() ?? null"
        [attr.minlength]="minLength() ?? null"
        [attr.name]="name() || null"
        [attr.spellcheck]="spellcheck()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateText($event)"
      />
      <span class="krn-control-affix">
        <ng-content select="[krnSuffix]" />
      </span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTextInput extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly autocomplete = input('');
  readonly inputMode = input<KrnInputMode>('text');
  readonly size = input<KrnControlSize>('md');
  readonly maxLength = input<number | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly minLength = input<number | undefined>(undefined, {
    transform: optionalNumber,
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'text-input', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super('');
    this.watchValidationInputs(this.required, this.a11y.required, this.minLength, this.maxLength);
  }

  protected override validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minLengthError(value, this.minLength()),
      maxLengthError(value, this.maxLength()),
    );
  }

  protected updateText(event: Event): void {
    const input = event.target as HTMLInputElement;
    const maxLength = this.maxLength();
    const value =
      maxLength === undefined ? input.value : input.value.slice(0, Math.max(0, maxLength));
    if (input.value !== value) {
      input.value = value;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-textarea',
  providers: [...provideKrnFormControl(() => KrnTextarea)],
  host: {
    '[attr.id]': 'null',
    '[attr.data-size]': 'size()',
  },
  template: `
    <span
      class="krn-control-shell krn-control-shell--textarea"
      [attr.data-auto-resize]="autoResize()"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <textarea
        class="krn-textarea"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.autocomplete]="autocomplete() || null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.name]="name() || null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [rows]="rows()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateText($event)"
      ></textarea>
      @if (showCount() && maxLength() !== undefined) {
        <span class="krn-textarea-footer">
          <span class="krn-textarea-count" aria-live="polite">
            {{ controlValue().length }} / {{ maxLength() }}
          </span>
        </span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTextarea extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly autocomplete = input('');
  readonly size = input<KrnControlSize>('md');
  readonly rows = input(4, { transform: numberAttribute });
  readonly maxLength = input<number | undefined>(undefined, {
    transform: optionalNumber,
  });
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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'textarea', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super('');
    this.watchValidationInputs(this.required, this.a11y.required, this.maxLength);
  }

  protected override validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      maxLengthError(value, this.maxLength()),
    );
  }

  protected updateText(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const maxLength = this.maxLength();
    const value =
      maxLength === undefined ? textarea.value : textarea.value.slice(0, Math.max(0, maxLength));
    if (textarea.value !== value) {
      textarea.value = value;
    }
    if (this.autoResize()) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-password-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnPasswordInput)],
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <input
        class="krn-input"
        [type]="revealed() ? 'text' : 'password'"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.autocomplete]="autocomplete()"
        [attr.name]="name() || null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updatePassword($event)"
      />
      <button
        class="krn-inline-action"
        type="button"
        [attr.aria-label]="revealed() ? hideLabel() : showLabel()"
        [attr.aria-pressed]="revealed()"
        [disabled]="isDisabled()"
        (click)="revealed.update(toggle)"
      >
        {{ revealed() ? hideText() : showText() }}
      </button>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnPasswordInput extends KrnValueAccessor<string> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly autocomplete = input('current-password');
  readonly showLabel = input(this.translations.forms.showPassword);
  readonly hideLabel = input(this.translations.forms.hidePassword);
  readonly showText = input(this.translations.forms.show);
  readonly hideText = input(this.translations.forms.hide);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  protected readonly revealed = signal(false);

  protected readonly toggle = (value: boolean): boolean => !value;
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'password', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super('');
    this.watchValidationInputs(this.required, this.a11y.required);
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected updatePassword(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-search-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnSearchInput)],
  template: `
    <span
      class="krn-control-shell"
      role="search"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <span class="krn-control-affix" aria-hidden="true">⌕</span>
      <input
        class="krn-input"
        type="search"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel()"
        [attr.autocomplete]="autocomplete()"
        [attr.name]="name() || null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateSearch($event)"
        (keydown.enter)="submitSearch()"
      />
      @if (controlValue() && !a11y.readOnly()) {
        <button
          class="krn-inline-action"
          type="button"
          [attr.aria-label]="clearLabel()"
          [disabled]="isDisabled()"
          (click)="clear()"
        >
          ×
        </button>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSearchInput extends KrnValueAccessor<string> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input(this.translations.forms.search);
  readonly ariaLabel = input(this.translations.forms.search);
  readonly clearLabel = input(this.translations.forms.clearSearch);
  readonly autocomplete = input('off');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly searchSubmitted = output<string>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'search', {
    disabled: this.disabled,
    readOnly: this.readOnly,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super('');
    this.watchValidationInputs(this.a11y.required);
  }

  protected override validateValue(value: unknown) {
    return requiredError(value, this.a11y.required());
  }

  protected updateSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  protected clear(): void {
    this.commitValue('');
    this.valueChange.emit('');
    this.searchSubmitted.emit('');
  }

  protected submitSearch(): void {
    this.searchSubmitted.emit(this.controlValue());
  }
}

@Component({
  selector: 'krn-number-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnNumberInput)],
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <input
        class="krn-input"
        type="number"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.max]="max() ?? null"
        [attr.min]="min() ?? null"
        [attr.name]="name() || null"
        [attr.step]="step()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [value]="controlValue() ?? ''"
        (blur)="touch()"
        (input)="updateNumber($event)"
      />
      @if (showSteppers() && !a11y.readOnly()) {
        <span class="krn-stepper">
          <button
            type="button"
            [attr.aria-label]="increaseLabel()"
            [disabled]="isDisabled()"
            (click)="stepBy(1)"
          >
            +
          </button>
          <button
            type="button"
            [attr.aria-label]="decreaseLabel()"
            [disabled]="isDisabled()"
            (click)="stepBy(-1)"
          >
            −
          </button>
        </span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnNumberInput extends KrnValueAccessor<number | null> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly increaseLabel = input(this.translations.forms.increaseValue);
  readonly decreaseLabel = input(this.translations.forms.decreaseValue);
  readonly min = input<number | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly max = input<number | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly step = input(1, { transform: numberAttribute });
  readonly showSteppers = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<number | null>();

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'number', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super(null);
    this.watchValidationInputs(this.required, this.a11y.required, this.min, this.max);
  }

  protected override normalizeIncomingValue(value: unknown): number | null {
    const numeric = Number(value);
    return value === null || value === undefined || value === ''
      ? null
      : Number.isFinite(numeric)
        ? numeric
        : null;
  }

  protected override validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      minError(value, this.min()),
      maxError(value, this.max()),
    );
  }

  protected updateNumber(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? null : this.clamp(Number(raw));
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  protected stepBy(direction: 1 | -1): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const base = this.controlValue() ?? this.min() ?? 0;
    const value = this.clamp(base + this.step() * direction);
    this.commitValue(value);
    this.valueChange.emit(value);
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
