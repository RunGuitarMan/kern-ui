import type { ElementRef } from '@angular/core';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
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
      (pointerdown)="focusFromShell($event)"
    >
      <span class="krn-control-affix">
        <ng-content select="[krnPrefix]" />
      </span>
      <input
        #inputElement
        class="krn-input"
        type="text"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="labelledBy() ? null : ariaLabel() || null"
        [attr.aria-labelledby]="labelledBy()"
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
        (compositionend)="endComposition($event)"
        (compositionstart)="startComposition()"
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
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private angularOwnsValue = false;
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
    super('');
    effect(() => {
      const value = this.value();
      if (value !== undefined && !this.angularOwnsValue) {
        this.controlValue.set(this.normalizeIncomingValue(value));
      }
    });
    this.watchValidationInputs(this.required, this.a11y.required, this.minLength, this.maxLength);
  }

  override writeValue(value: unknown): void {
    this.angularOwnsValue = true;
    super.writeValue(value);
  }

  override registerOnChange(fn: (value: string) => void): void {
    this.angularOwnsValue = true;
    super.registerOnChange(fn);
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

  protected override validateValue(value: unknown) {
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
    this.commitValue(value);
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
      !(target instanceof Element) ||
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
      (pointerdown)="focusFromShell($event)"
    >
      <textarea
        #textareaElement
        class="krn-textarea"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="labelledBy() ? null : ariaLabel() || null"
        [attr.aria-labelledby]="labelledBy()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.minlength]="minLength() ?? null"
        [attr.name]="name() || null"
        [attr.spellcheck]="spellcheck()"
        [attr.data-krn-form-field-control]="isFormFieldControl() ? '' : null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [rows]="rows()"
        [value]="controlValue()"
        (blur)="touch()"
        (compositionend)="endComposition($event)"
        (compositionstart)="startComposition()"
        (input)="updateText($event)"
      ></textarea>
      @if (showCount() && maxLength() !== undefined) {
        <span class="krn-textarea-footer">
          <span class="krn-textarea-count"> {{ controlValue().length }} / {{ maxLength() }} </span>
        </span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTextarea extends KrnValueAccessor<string> {
  private readonly textareaElement = viewChild<ElementRef<HTMLTextAreaElement>>('textareaElement');
  private angularOwnsValue = false;
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
    super('');
    effect(() => {
      const value = this.value();
      if (value !== undefined && !this.angularOwnsValue) {
        this.controlValue.set(this.normalizeIncomingValue(value));
      }
    });
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
    this.watchValidationInputs(this.required, this.a11y.required, this.minLength, this.maxLength);
  }

  override writeValue(value: unknown): void {
    this.angularOwnsValue = true;
    super.writeValue(value);
  }

  override registerOnChange(fn: (value: string) => void): void {
    this.angularOwnsValue = true;
    super.registerOnChange(fn);
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

  protected override validateValue(value: unknown) {
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
    this.commitValue(value);
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
      !(target instanceof Element) ||
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
  providers: [...provideKrnFormControl(() => KrnPasswordInput)],
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
      (pointerdown)="focusFromShell($event)"
    >
      <input
        #inputElement
        class="krn-input"
        [type]="revealed() ? 'text' : 'password'"
        autocapitalize="none"
        spellcheck="false"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="labelledBy() ? null : ariaLabel() || null"
        [attr.aria-labelledby]="labelledBy()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.minlength]="minLength() ?? null"
        [attr.name]="name() || null"
        [attr.data-krn-form-field-control]="isFormFieldControl() ? '' : null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [value]="controlValue()"
        (blur)="touch()"
        (compositionend)="endComposition($event)"
        (compositionstart)="startComposition()"
        (input)="updatePassword($event)"
      />
      <button
        class="krn-inline-action"
        type="button"
        [attr.aria-controls]="a11y.id()"
        [attr.aria-label]="revealed() ? hideLabel() : showLabel()"
        [disabled]="isDisabled()"
        (click)="revealed.update(toggle)"
        (pointerdown)="retainInputFocus($event)"
      >
        {{ revealed() ? hideText() : showText() }}
      </button>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnPasswordInput extends KrnValueAccessor<string> {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private angularOwnsValue = false;
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
    super('');
    effect(() => {
      const value = this.value();
      if (value !== undefined && !this.angularOwnsValue) {
        this.controlValue.set(this.normalizeIncomingValue(value));
      }
    });
    this.watchValidationInputs(this.required, this.a11y.required, this.minLength, this.maxLength);
  }

  override writeValue(value: unknown): void {
    this.angularOwnsValue = true;
    super.writeValue(value);
  }

  override registerOnChange(fn: (value: string) => void): void {
    this.angularOwnsValue = true;
    super.registerOnChange(fn);
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

  protected override validateValue(value: unknown) {
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
    this.commitValue(value);
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
      !(target instanceof Element) ||
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
  providers: [...provideKrnFormControl(() => KrnSearchInput)],
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
      (pointerdown)="focusFromShell($event)"
    >
      <span class="krn-control-affix" aria-hidden="true">⌕</span>
      <input
        #inputElement
        class="krn-input"
        type="search"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="labelledBy() ? null : ariaLabel() || null"
        [attr.aria-labelledby]="labelledBy()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.enterkeyhint]="enterKeyHint() || null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.minlength]="minLength() ?? null"
        [attr.name]="name() || null"
        [attr.spellcheck]="spellcheck()"
        [attr.data-krn-form-field-control]="isFormFieldControl() ? '' : null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [placeholder]="placeholder()"
        [readOnly]="a11y.readOnly()"
        [required]="a11y.required()"
        [value]="controlValue()"
        (blur)="touch()"
        (compositionend)="endComposition($event)"
        (compositionstart)="startComposition()"
        (input)="updateSearch($event)"
        (keydown.enter)="submitSearch($event)"
      />
      @if (controlValue() && !a11y.readOnly()) {
        <button
          class="krn-inline-action"
          type="button"
          tabindex="-1"
          [attr.aria-controls]="a11y.id()"
          [attr.aria-label]="clearLabel()"
          [disabled]="isDisabled()"
          (click)="clear()"
          (pointerdown)="retainInputFocus($event)"
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
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private angularOwnsValue = false;
  private composing = false;

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input(this.translations.forms.search);
  readonly ariaLabel = input(this.translations.forms.search);
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly clearLabel = input(this.translations.forms.clearSearch);
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
    super('');
    effect(() => {
      const value = this.value();
      if (value !== undefined && !this.angularOwnsValue) {
        this.controlValue.set(this.normalizeIncomingValue(value));
      }
    });
    this.watchValidationInputs(this.required, this.a11y.required, this.minLength, this.maxLength);
  }

  override writeValue(value: unknown): void {
    this.angularOwnsValue = true;
    super.writeValue(value);
  }

  override registerOnChange(fn: (value: string) => void): void {
    this.angularOwnsValue = true;
    super.registerOnChange(fn);
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

  protected override validateValue(value: unknown) {
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
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  protected clear(): void {
    this.commitValue('');
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
      !(target instanceof Element) ||
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
  providers: [...provideKrnFormControl(() => KrnNumberInput)],
  template: `
    <span
      class="krn-control-shell krn-number-control"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
      (pointerdown)="focusFromShell($event)"
    >
      <input
        #inputElement
        class="krn-input"
        type="number"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="labelledBy() ? null : ariaLabel() || null"
        [attr.aria-labelledby]="labelledBy()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.inputmode]="inputMode()"
        [attr.max]="max() ?? null"
        [attr.min]="min() ?? null"
        [attr.name]="name() || null"
        [attr.step]="step()"
        [attr.data-krn-form-field-control]="isFormFieldControl() ? '' : null"
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
            tabindex="-1"
            [attr.aria-controls]="a11y.id()"
            [attr.aria-label]="increaseLabel()"
            [disabled]="!canIncrease()"
            (click)="stepBy(1)"
            (pointerdown)="retainInputFocus($event)"
          >
            +
          </button>
          <button
            type="button"
            tabindex="-1"
            [attr.aria-controls]="a11y.id()"
            [attr.aria-label]="decreaseLabel()"
            [disabled]="!canDecrease()"
            (click)="stepBy(-1)"
            (pointerdown)="retainInputFocus($event)"
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
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  private angularOwnsValue = false;

  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly autocomplete = input('off');
  readonly inputMode = input<KrnInputMode>('decimal');
  readonly value = input<number | null | undefined>(undefined);
  readonly increaseLabel = input(this.translations.forms.increaseValue);
  readonly decreaseLabel = input(this.translations.forms.decreaseValue);
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
    super(null);
    effect(() => {
      const value = this.value();
      if (value !== undefined && !this.angularOwnsValue) {
        this.controlValue.set(this.normalizeIncomingValue(value));
      }
    });
    this.watchValidationInputs(this.required, this.a11y.required, this.min, this.max);
  }

  override writeValue(value: unknown): void {
    this.angularOwnsValue = true;
    super.writeValue(value);
  }

  override registerOnChange(fn: (value: number | null) => void): void {
    this.angularOwnsValue = true;
    super.registerOnChange(fn);
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
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
    const input = event.target as HTMLInputElement;
    const value = input.value === '' ? null : input.valueAsNumber;
    if (value !== null && !Number.isFinite(value)) {
      return;
    }
    if (Object.is(this.controlValue(), value)) {
      return;
    }
    this.commitValue(value);
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
    this.commitValue(value);
    this.valueChange.emit(value);
    this.focus();
  }

  protected focusFromShell(event: PointerEvent): void {
    const target = event.target;

    if (
      event.button !== 0 ||
      !(target instanceof Element) ||
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
