import type { ElementRef } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { KRN_PLATFORM, krnIsInputElement, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import {
  KrnValueAccessor,
  maxLengthError,
  mergeValidationErrors,
  minLengthError,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
} from './value-accessor';

interface KrnTagFeedback {
  readonly id: number;
  readonly kind: 'added' | 'duplicate' | 'removed';
  readonly text: string;
}

@Component({
  selector: 'krn-otp-input, krn-verification-code',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnOtpInput)],
  template: `
    <fieldset
      class="krn-otp"
      [attr.aria-describedby]="a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.aria-readonly]="a11y.readOnly()"
      [attr.aria-required]="a11y.required()"
      [disabled]="isDisabled()"
      [id]="a11y.id()"
      (paste)="pasteCode($event)"
    >
      <legend class="krn-label">{{ label() }}</legend>
      @for (index of slots(); track index) {
        <input
          #otpInput
          type="text"
          autocapitalize="off"
          [attr.aria-label]="digitLabel(index)"
          [attr.autocomplete]="index === 0 ? 'one-time-code' : 'off'"
          [attr.inputmode]="numericOnly() ? 'numeric' : 'text'"
          [disabled]="isDisabled()"
          [readOnly]="a11y.readOnly()"
          [maxLength]="1"
          [value]="characterAt(index)"
          (beforeinput)="blockInvalidInput($event)"
          (blur)="touch()"
          (focus)="selectInput($event)"
          (input)="inputCharacter(index, $event)"
          (keydown)="navigate(index, $event)"
        />
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnOtpInput extends KrnValueAccessor<string> {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  protected readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');
  private readonly slotValues = signal<readonly string[]>([]);

  readonly id = input('');
  readonly label = input(this.translations.forms.verificationCode);
  readonly length = input(6, { transform: numberAttribute });
  readonly numericOnly = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly completed = output<string>();

  protected readonly safeLength = computed(() =>
    Math.min(12, Math.max(1, Math.trunc(this.length()))),
  );
  protected readonly slots = computed(() =>
    Array.from({ length: this.safeLength() }, (_, index) => index),
  );
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'otp', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super('');
    this.watchValidationInputs(
      this.required,
      this.a11y.required,
      this.safeLength,
      this.numericOnly,
    );
  }

  override writeValue(value: unknown): void {
    const normalized = this.normalizeIncomingValue(value);
    this.slotValues.set(
      Array.from({ length: this.safeLength() }, (_, index) => normalized.at(index) ?? ''),
    );
    super.writeValue(normalized);
  }

  protected override normalizeIncomingValue(value: unknown): string {
    return this.sanitize(typeof value === 'string' ? value : '').slice(0, this.safeLength());
  }

  protected override validateValue(value: unknown) {
    const text = typeof value === 'string' ? value : '';
    return mergeValidationErrors(
      requiredError(text, this.a11y.required()),
      minLengthError(text, this.safeLength()),
      maxLengthError(text, this.safeLength()),
      this.numericOnly() && text && /\D/.test(text)
        ? { pattern: { requiredPattern: '\\d+', actualValue: text } }
        : null,
    );
  }

  protected characterAt(index: number): string {
    return this.slotValues().at(index) ?? '';
  }

  protected digitLabel(index: number): string {
    return this.translations.forms.verificationCharacter(index + 1, this.safeLength());
  }

  protected inputCharacter(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.a11y.readOnly()) {
      input.value = this.characterAt(index);
      return;
    }
    const raw = input.value;
    const characters = this.sanitize(raw);
    if (raw && !characters) {
      input.value = this.characterAt(index);
      return;
    }
    if (characters.length > 1) {
      this.insertAt(index, characters);
      return;
    }
    const next = [...this.slotValues()];
    next[index] = characters.at(-1) ?? '';
    this.emitSlots(next);
    if (characters && index < this.safeLength() - 1) {
      this.focus(index + 1);
    }
  }

  protected blockInvalidInput(event: InputEvent): void {
    if (
      this.numericOnly() &&
      event.inputType.startsWith('insert') &&
      event.data !== null &&
      /\D/.test(event.data)
    ) {
      event.preventDefault();
    }
  }

  protected selectInput(event: FocusEvent): void {
    const target = event.target;
    if (krnIsInputElement(this.platform, target)) {
      target.select();
    }
  }

  protected navigate(index: number, event: KeyboardEvent): void {
    if (
      this.a11y.readOnly() &&
      (event.key === 'Backspace' ||
        event.key === 'Delete' ||
        (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey))
    ) {
      event.preventDefault();
    } else if (
      this.numericOnly() &&
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !/^\d$/.test(event.key)
    ) {
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focus(Math.max(0, index - 1));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focus(Math.min(this.safeLength() - 1, index + 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focus(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focus(this.safeLength() - 1);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      const targetIndex = this.characterAt(index) ? index : Math.max(0, index - 1);
      const next = [...this.slotValues()];
      next[targetIndex] = '';
      this.emitSlots(next);
      this.focus(targetIndex);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      const next = [...this.slotValues()];
      next[index] = '';
      this.emitSlots(next);
      this.focus(index);
    }
  }

  protected pasteCode(event: ClipboardEvent): void {
    event.preventDefault();
    if (this.a11y.readOnly()) {
      return;
    }
    const target = event.target;
    const index = krnIsInputElement(this.platform, target)
      ? this.inputs().findIndex((item) => item.nativeElement === target)
      : 0;
    this.insertAt(Math.max(0, index), event.clipboardData?.getData('text') ?? '');
  }

  private insertAt(index: number, characters: string): void {
    const safe = this.sanitize(characters);
    if (!safe) {
      return;
    }
    const next = Array.from(
      { length: this.safeLength() },
      (_, slotIndex) => this.slotValues().at(slotIndex) ?? '',
    );
    for (const [offset, character] of [...safe].entries()) {
      const targetIndex = index + offset;
      if (targetIndex >= this.safeLength()) {
        break;
      }
      next[targetIndex] = character;
    }
    this.emitSlots(next);
    this.focus(Math.min(this.safeLength() - 1, index + safe.length));
  }

  private sanitize(value: string): string {
    return this.numericOnly() ? value.replace(/\D/g, '') : value.replace(/\s/g, '');
  }

  private emitSlots(values: readonly string[]): void {
    const slots = Array.from(
      { length: this.safeLength() },
      (_, index) => values.at(index)?.slice(0, 1) ?? '',
    );
    const value = slots.join('');
    this.slotValues.set(slots);
    this.commitValue(value);
    this.valueChange.emit(value);
    if (slots.every(Boolean)) {
      this.completed.emit(value);
    }
  }

  private focus(index: number): void {
    this.inputs()[index]?.nativeElement.focus();
  }
}

@Component({
  selector: 'krn-tags-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl(() => KrnTagsInput)],
  template: `
    <div
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
      (click)="focusInput()"
    >
      <div class="krn-tag-input" role="group" [attr.aria-label]="ariaLabel()">
        @for (tag of controlValue(); track $index; let index = $index) {
          <span class="krn-token">
            <span>{{ tag }}</span>
            @if (!a11y.readOnly()) {
              <button
                class="krn-token__remove"
                type="button"
                [attr.aria-label]="translations.forms.removeTag(tag)"
                [disabled]="isDisabled()"
                (click)="remove(index, $event)"
              >
                ×
              </button>
            }
          </span>
        }
        <input
          #tagInput
          class="krn-input"
          type="text"
          autocomplete="off"
          [attr.aria-describedby]="a11y.describedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="inputLabel()"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          [placeholder]="controlValue().length ? '' : placeholder()"
          [readOnly]="a11y.readOnly()"
          [required]="a11y.required() && controlValue().length === 0"
          [value]="draft()"
          (blur)="commitOnBlur(); touch()"
          (input)="updateDraft($event)"
          (keydown)="handleKey($event)"
        />
        @if (visualFeedback(); as feedback) {
          <span
            class="krn-tag-feedback"
            aria-hidden="true"
            [attr.data-feedback-id]="feedback.id"
            [attr.data-kind]="feedback.kind"
          >
            {{ feedback.text }}
          </span>
        }
      </div>
    </div>
    <span class="krn-visually-hidden" role="status" aria-live="polite">
      {{ announcement() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTagsInput extends KrnValueAccessor<readonly string[]> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(KRN_PLATFORM);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChildren<ElementRef<HTMLInputElement>>('tagInput');
  private feedbackTimer: KrnScheduledHandle | null = null;
  private feedbackId = 0;

  readonly id = input('');
  readonly ariaLabel = input(this.translations.forms.tags);
  readonly inputLabel = input(this.translations.forms.addTag);
  readonly placeholder = input(this.translations.forms.addTagPlaceholder);
  readonly separatorKeys = input<readonly string[]>(['Enter', ',']);
  readonly maxTags = input(Number.POSITIVE_INFINITY, {
    transform: numberAttribute,
  });
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  readonly addOnBlur = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<readonly string[]>();
  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();
  protected readonly draft = signal('');
  protected readonly announcement = signal('');
  protected readonly visualFeedback = signal<KrnTagFeedback | null>(null);

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'tags', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());

  constructor() {
    super([]);
    this.watchValidationInputs(this.required, this.a11y.required, this.maxTags);
    this.destroyRef.onDestroy(() => {
      this.platform.cancelScheduled(this.feedbackTimer);
    });
  }

  protected override normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  protected override validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      maxLengthError(value, this.maxTags()),
    );
  }

  protected updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected handleKey(event: KeyboardEvent): void {
    if (this.separatorKeys().includes(event.key)) {
      event.preventDefault();
      this.addDraft();
    } else if (event.key === 'Backspace' && !this.draft() && this.controlValue().length > 0) {
      event.preventDefault();
      this.remove(this.controlValue().length - 1);
    }
  }

  protected commitOnBlur(): void {
    if (this.addOnBlur()) {
      this.addDraft();
    }
  }

  protected remove(index: number, event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const removed = this.controlValue()[index];
    if (removed === undefined) {
      return;
    }
    const next = this.controlValue().filter((_, itemIndex) => itemIndex !== index);
    this.commitValue(next);
    this.valueChange.emit(next);
    this.tagRemoved.emit(removed);
    this.showFeedback(
      this.translations.forms.tagRemoved(removed),
      this.translations.forms.removed,
      'removed',
    );
  }

  protected focusInput(): void {
    this.inputElement()[0]?.nativeElement.focus();
  }

  private addDraft(): void {
    if (this.isDisabled() || this.a11y.readOnly() || this.controlValue().length >= this.maxTags()) {
      return;
    }
    const tag = this.draft().trim();
    if (!tag) {
      return;
    }
    if (!this.allowDuplicates() && this.controlValue().includes(tag)) {
      this.showFeedback(
        this.translations.forms.tagAlreadyPresent(tag),
        this.translations.forms.alreadyAdded,
        'duplicate',
      );
      this.draft.set('');
      return;
    }
    const next = [...this.controlValue(), tag];
    this.commitValue(next);
    this.valueChange.emit(next);
    this.tagAdded.emit(tag);
    this.showFeedback(
      this.translations.forms.tagAdded(tag),
      this.translations.forms.added,
      'added',
    );
    this.draft.set('');
  }

  private showFeedback(announcement: string, text: string, kind: KrnTagFeedback['kind']): void {
    this.platform.cancelScheduled(this.feedbackTimer);
    this.feedbackId += 1;
    this.announcement.set('');
    this.visualFeedback.set({ id: this.feedbackId, kind, text });
    this.platform.queueMicrotask(() => this.announcement.set(announcement));
    this.feedbackTimer = this.platform.schedule(() => {
      this.visualFeedback.set(null);
      this.feedbackTimer = null;
    }, 1400);
  }
}

export { KrnOtpInput as KrnVerificationCode };
