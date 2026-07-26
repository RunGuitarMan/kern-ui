import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { KrnControlSize, KrnInputMode } from './form-types';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

const optionalNumber = (value: unknown): number | undefined =>
  value === null || value === undefined || value === '' ? undefined : numberAttribute(value);

@Component({
  selector: 'krn-text-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnTextInput),
      multi: true,
    },
  ],
  host: {
    '[attr.data-size]': 'size()',
  },
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="readOnly()"
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
        [readOnly]="readOnly()"
        [required]="required()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateText($event)"
      />
      <span class="krn-control-affix">
        <ng-content select="[krnSuffix]" />
      </span>
    </span>
  `,
  styleUrl: './forms.css',
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

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'text-input');

  constructor() {
    super('');
  }

  protected updateText(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-textarea',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnTextarea),
      multi: true,
    },
  ],
  host: {
    '[attr.data-size]': 'size()',
  },
  template: `
    <span
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="readOnly()"
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
        [readOnly]="readOnly()"
        [required]="required()"
        [rows]="rows()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateText($event)"
      ></textarea>
    </span>
  `,
  styleUrl: './forms.css',
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
  readonly autoResize = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'textarea');

  constructor() {
    super('');
  }

  protected updateText(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    if (this.autoResize()) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    this.commitValue(textarea.value);
    this.valueChange.emit(textarea.value);
  }
}

@Component({
  selector: 'krn-password-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnPasswordInput),
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
        [readOnly]="readOnly()"
        [required]="required()"
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
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnPasswordInput extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly autocomplete = input('current-password');
  readonly showLabel = input('Show password');
  readonly hideLabel = input('Hide password');
  readonly showText = input('Show');
  readonly hideText = input('Hide');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly revealed = signal(false);

  protected readonly toggle = (value: boolean): boolean => !value;
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'password');

  constructor() {
    super('');
  }

  protected updatePassword(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.commitValue(value);
    this.valueChange.emit(value);
  }
}

@Component({
  selector: 'krn-search-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnSearchInput),
      multi: true,
    },
  ],
  template: `
    <span
      class="krn-control-shell"
      role="search"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="readOnly()"
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
        [readOnly]="readOnly()"
        [value]="controlValue()"
        (blur)="touch()"
        (input)="updateSearch($event)"
        (keydown.enter)="submitSearch()"
      />
      @if (controlValue() && !readOnly()) {
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
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnSearchInput extends KrnValueAccessor<string> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('Search');
  readonly ariaLabel = input('Search');
  readonly clearLabel = input('Clear search');
  readonly autocomplete = input('off');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly searchSubmitted = output<string>();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'search');

  constructor() {
    super('');
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnNumberInput),
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
        [readOnly]="readOnly()"
        [required]="required()"
        [value]="controlValue() ?? ''"
        (blur)="touch()"
        (input)="updateNumber($event)"
      />
      @if (showSteppers() && !readOnly()) {
        <span class="krn-stepper">
          <button
            type="button"
            aria-label="Increase value"
            [disabled]="isDisabled()"
            (click)="stepBy(1)"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Decrease value"
            [disabled]="isDisabled()"
            (click)="stepBy(-1)"
          >
            −
          </button>
        </span>
      }
    </span>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnNumberInput extends KrnValueAccessor<number | null> {
  readonly id = input('');
  readonly name = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
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

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'number');

  constructor() {
    super(null);
  }

  protected override normalizeIncomingValue(value: unknown): number | null {
    const numeric = Number(value);
    return value === null || value === undefined || value === ''
      ? null
      : Number.isFinite(numeric)
        ? numeric
        : null;
  }

  protected updateNumber(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? null : this.clamp(Number(raw));
    this.commitValue(value);
    this.valueChange.emit(value);
  }

  protected stepBy(direction: 1 | -1): void {
    if (this.isDisabled() || this.readOnly()) {
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
