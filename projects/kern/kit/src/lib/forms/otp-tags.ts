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
  viewChild,
  viewChildren,
} from '@angular/core';
import { KRN_PLATFORM, type KrnScheduledHandle } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import {
  maxLengthError,
  mergeValidationErrors,
  minLengthError,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
  useKrnFormControl,
} from './value-accessor';

interface KrnTagFeedback {
  readonly id: number;
  readonly kind: 'added' | 'duplicate' | 'removed';
  readonly text: string;
}

const mergeAriaIds = (...values: readonly (string | null | undefined)[]): string | null => {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
};

@Component({
  selector: 'krn-otp-input, krn-verification-code',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl()],
  template: `
    <div class="krn-otp-control">
      @if (!effectiveLabelledBy()) {
        <span class="krn-label" [id]="internalLabelId()">{{ label() }}</span>
      }
      <div
        class="krn-otp"
        [attr.data-disabled]="isDisabled()"
        [attr.data-invalid]="a11y.invalid()"
        [attr.data-readonly]="a11y.readOnly()"
        (pointerdown)="selectSlot($event)"
      >
        <input
          #otpInput
          class="krn-otp__input"
          type="text"
          autocapitalize="off"
          autocorrect="off"
          [attr.aria-describedby]="effectiveDescribedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-labelledby]="effectiveLabelledBy() || internalLabelId()"
          [attr.autocomplete]="autocomplete()"
          [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
          [attr.inputmode]="numericOnly() ? 'numeric' : 'text'"
          [attr.pattern]="numericOnly() ? '[0-9]*' : null"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          [readOnly]="a11y.readOnly()"
          [required]="a11y.required()"
          [spellcheck]="false"
          [tabIndex]="isDisabled() ? -1 : tabIndex()"
          [value]="controlValue()"
          (blur)="handleBlur()"
          (focus)="handleFocus()"
          (input)="inputCode($event)"
          (select)="syncSelection()"
        />
        <span class="krn-otp__slots" aria-hidden="true">
          @for (index of slots(); track index) {
            <span
              #otpSlot
              class="krn-otp__slot"
              [attr.data-active]="focused() && activeIndex() === index ? '' : null"
              [attr.data-filled]="characterAt(index) ? '' : null"
            >
              {{ characterAt(index) }}
            </span>
          }
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnOtpInput {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('otpInput');
  private readonly slotElements = viewChildren<ElementRef<HTMLElement>>('otpSlot');

  readonly id = input('');
  readonly label = input(this.translations.forms.verificationCode);
  readonly length = input(6, { transform: numberAttribute });
  readonly numericOnly = input(true, { transform: booleanAttribute });
  readonly autocomplete = input('one-time-code');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly value = input<string | undefined>(undefined);
  readonly valueChange = output<string>();
  readonly completed = output<string>();
  protected readonly focused = signal(false);
  protected readonly activeIndex = signal(0);

  private readonly formControl = useKrnFormControl(this, '', {
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

  protected readonly safeLength = computed(() => {
    const length = Math.trunc(this.length());
    return Number.isFinite(length) ? Math.min(12, Math.max(1, length)) : 6;
  });
  protected readonly slots = computed(() =>
    Array.from({ length: this.safeLength() }, (_, index) => index),
  );
  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'otp', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly internalLabelId = computed(() => `${this.a11y.id()}-label`);
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(
      this.required,
      this.a11y.required,
      this.safeLength,
      this.numericOnly,
    );
  }

  private normalizeIncomingValue(value: unknown): string {
    return this.sanitize(typeof value === 'string' ? value : '').slice(0, this.safeLength());
  }

  private validateValue(value: unknown) {
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
    return this.controlValue().at(index) ?? '';
  }

  protected inputCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isDisabled() || this.a11y.readOnly()) {
      input.value = this.controlValue();
      return;
    }
    const raw = input.value;
    const selection = input.selectionStart ?? raw.length;
    const next = this.normalizeIncomingValue(raw);
    const normalizedSelection = this.normalizeIncomingValue(raw.slice(0, selection)).length;
    input.value = next;
    input.setSelectionRange(normalizedSelection, normalizedSelection);
    this.syncSelection();
    if (!this.formControl.commitUserValue(next)) {
      return;
    }
    this.valueChange.emit(next);
    if (next.length === this.safeLength()) {
      this.completed.emit(next);
    }
  }

  private sanitize(value: string): string {
    return this.numericOnly() ? value.replace(/\D/g, '') : value.replace(/\s/g, '');
  }

  protected handleFocus(): void {
    this.focused.set(true);
    this.syncSelection();
  }

  protected handleBlur(): void {
    this.focused.set(false);
    this.formControl.touch();
  }

  protected selectSlot(event: PointerEvent): void {
    if (this.isDisabled()) {
      return;
    }
    event.preventDefault();
    const input = this.inputElement()?.nativeElement;
    if (!input) {
      return;
    }
    input.focus();
    const index = this.slotElements().reduce(
      (closest, slot, slotIndex) => {
        const bounds = slot.nativeElement.getBoundingClientRect();
        const distanceX = Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right);
        const distanceY = Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom);
        const distance = distanceX * distanceX + distanceY * distanceY;
        return distance < closest.distance ? { distance, index: slotIndex } : closest;
      },
      { distance: Number.POSITIVE_INFINITY, index: 0 },
    ).index;
    const selectionEnd = Math.min(input.value.length, index + 1);
    const selectionStart = Math.min(index, selectionEnd);
    input.setSelectionRange(selectionStart, selectionEnd);
    this.syncSelection();
  }

  protected syncSelection(): void {
    const position =
      this.inputElement()?.nativeElement.selectionStart ?? this.controlValue().length;
    this.activeIndex.set(Math.min(this.safeLength() - 1, Math.max(0, position)));
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }
}

@Component({
  selector: 'krn-tags-input',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl()],
  template: `
    <div
      #tagsShell
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
      (click)="focusInput()"
      (focusout)="handleFocusOut($event)"
    >
      <div
        class="krn-tag-input"
        role="group"
        [attr.aria-label]="effectiveLabelledBy() ? null : ariaLabel()"
        [attr.aria-labelledby]="effectiveLabelledBy()"
      >
        @for (tag of controlValue(); track $index; let index = $index) {
          <span class="krn-token">
            <span>{{ tag }}</span>
            @if (!a11y.readOnly()) {
              <button
                class="krn-token__remove"
                type="button"
                [attr.aria-label]="translations.forms.removeTag(tag)"
                [disabled]="isDisabled()"
                (pointerdown)="$event.preventDefault()"
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
          [attr.aria-describedby]="effectiveDescribedBy()"
          [attr.aria-invalid]="a11y.invalid()"
          [attr.aria-label]="effectiveLabelledBy() ? null : inputLabel()"
          [attr.aria-labelledby]="effectiveLabelledBy()"
          [attr.aria-required]="a11y.required()"
          [attr.autocomplete]="autocomplete()"
          [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
          [disabled]="isDisabled()"
          [id]="a11y.id()"
          [placeholder]="controlValue().length ? '' : placeholder()"
          [readOnly]="a11y.readOnly()"
          [required]="a11y.required() && controlValue().length === 0"
          [tabIndex]="isDisabled() ? -1 : tabIndex()"
          [value]="draft()"
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
export class KrnTagsInput {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(KRN_PLATFORM);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('tagInput');
  private readonly shellElement = viewChild<ElementRef<HTMLElement>>('tagsShell');
  private feedbackTimer: KrnScheduledHandle | null = null;
  private feedbackId = 0;

  readonly id = input('');
  readonly ariaLabel = input(this.translations.forms.tags);
  readonly inputLabel = input(this.translations.forms.addTag);
  readonly placeholder = input(this.translations.forms.addTagPlaceholder);
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly autocomplete = input('off');
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly separatorKeys = input<readonly string[]>(['Enter', ',']);
  /** Delimiter or pattern used to split committed draft text into tags. */
  readonly separator = input<string | RegExp>(/[,\n]+/);
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
  readonly value = input<readonly string[] | undefined>(undefined);
  readonly valueChange = output<readonly string[]>();
  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();
  protected readonly draft = signal('');
  protected readonly announcement = signal('');
  protected readonly visualFeedback = signal<KrnTagFeedback | null>(null);

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

  protected readonly a11y = useKrnControlA11y(this, this.id, this.invalid, 'tags', {
    disabled: this.disabled,
    readOnly: this.readOnly,
    required: this.required,
  });
  protected readonly isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
  protected readonly safeMaxTags = computed(() => {
    const maximum = Math.trunc(this.maxTags());
    return Number.isFinite(maximum) ? Math.max(0, maximum) : Number.POSITIVE_INFINITY;
  });
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(this.ariaDescribedBy(), this.a11y.describedBy()),
  );

  constructor() {
    this.formControl.bindStandaloneValue(this.value);
    this.formControl.watchValidationInputs(this.required, this.a11y.required, this.safeMaxTags);
    this.destroyRef.onDestroy(() => {
      this.platform.cancelScheduled(this.feedbackTimer);
    });
  }

  private normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private validateValue(value: unknown) {
    return mergeValidationErrors(
      requiredError(value, this.a11y.required()),
      maxLengthError(value, this.safeMaxTags()),
    );
  }

  protected updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected handleKey(event: KeyboardEvent): void {
    if (event.isComposing) {
      return;
    }
    if (this.separatorKeys().includes(event.key)) {
      event.preventDefault();
      this.commitDraft();
    } else if (event.key === 'Backspace' && !this.draft() && this.controlValue().length > 0) {
      event.preventDefault();
      this.remove(this.controlValue().length - 1);
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.shellElement()?.nativeElement.contains(nextTarget)) {
      return;
    }
    if (nextTarget) {
      this.commitDraftAndTouch();
      return;
    }
    this.platform.queueMicrotask(() => {
      const shell = this.shellElement()?.nativeElement;
      if (!shell) {
        return;
      }
      const activeElement = shell?.ownerDocument.activeElement;
      if (!activeElement || !shell.contains(activeElement)) {
        this.commitDraftAndTouch();
      }
    });
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
    if (!this.formControl.commitUserValue(next)) {
      return;
    }
    this.valueChange.emit(next);
    this.tagRemoved.emit(removed);
    this.showFeedback(
      this.translations.forms.tagRemoved(removed),
      this.translations.forms.removed,
      'removed',
    );
    if (event) {
      this.platform.queueMicrotask(() => this.focus({ preventScroll: true }));
    }
  }

  protected focusInput(): void {
    this.focus();
  }

  private commitDraft(): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const separator = this.separator();
    const candidates = (
      typeof separator === 'string' && !separator ? [this.draft()] : this.draft().split(separator)
    )
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (candidates.length === 0) {
      this.clearDraft();
      return;
    }
    const current = this.controlValue();
    const accepted: string[] = [];
    const seen = this.allowDuplicates() ? null : new Set(current);
    let duplicate: string | undefined;
    for (const tag of candidates) {
      if (current.length + accepted.length >= this.safeMaxTags()) {
        break;
      }
      if (seen?.has(tag)) {
        duplicate ??= tag;
        continue;
      }
      accepted.push(tag);
      seen?.add(tag);
    }
    if (accepted.length === 0) {
      if (!duplicate) {
        return;
      }
      this.showFeedback(
        this.translations.forms.tagAlreadyPresent(duplicate),
        this.translations.forms.alreadyAdded,
        'duplicate',
      );
      this.clearDraft();
      return;
    }
    const next = [...current, ...accepted];
    if (!this.formControl.commitUserValue(next)) {
      return;
    }
    this.valueChange.emit(next);
    accepted.forEach((tag) => this.tagAdded.emit(tag));
    const lastAdded = accepted.at(-1)!;
    this.showFeedback(
      this.translations.forms.tagAdded(lastAdded),
      this.translations.forms.added,
      'added',
    );
    this.clearDraft();
  }

  private commitDraftAndTouch(): void {
    if (this.addOnBlur()) {
      this.commitDraft();
    }
    this.formControl.touch();
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

  private clearDraft(): void {
    this.draft.set('');
    const input = this.inputElement()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  blur(): void {
    this.inputElement()?.nativeElement.blur();
  }
}

export { KrnOtpInput as KrnVerificationCode };
