import type { ElementRef } from '@angular/core';
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
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

@Component({
  selector: 'krn-otp-input, krn-verification-code',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnOtpInput),
      multi: true,
    },
  ],
  template: `
    <fieldset
      class="krn-otp"
      [attr.aria-describedby]="a11y.describedBy()"
      [attr.aria-invalid]="a11y.invalid()"
      [disabled]="isDisabled()"
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
          [maxLength]="1"
          [value]="characterAt(index)"
          (blur)="touch()"
          (focus)="selectInput($event)"
          (input)="inputCharacter(index, $event)"
          (keydown)="navigate(index, $event)"
        />
      }
    </fieldset>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnOtpInput extends KrnValueAccessor<string> {
  readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

  readonly id = input('');
  readonly label = input('Verification code');
  readonly length = input(6, { transform: numberAttribute });
  readonly numericOnly = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly completed = output<string>();

  protected readonly safeLength = computed(() =>
    Math.min(12, Math.max(1, Math.trunc(this.length()))),
  );
  protected readonly slots = computed(() =>
    Array.from({ length: this.safeLength() }, (_, index) => index),
  );
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'otp');

  constructor() {
    super('');
  }

  protected override normalizeIncomingValue(value: unknown): string {
    return this.sanitize(typeof value === 'string' ? value : '').slice(0, this.safeLength());
  }

  protected characterAt(index: number): string {
    return this.controlValue().at(index) ?? '';
  }

  protected digitLabel(index: number): string {
    return `Character ${index + 1} of ${this.safeLength()}`;
  }

  protected inputCharacter(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const characters = this.sanitize(input.value);
    if (characters.length > 1) {
      this.insertAt(index, characters);
      return;
    }
    const value = this.replaceAt(index, characters);
    this.emitValue(value);
    if (characters && index < this.safeLength() - 1) {
      this.focus(index + 1);
    }
  }

  protected selectInput(event: FocusEvent): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }

  protected navigate(index: number, event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
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
      this.emitValue(this.replaceAt(targetIndex, ''));
      this.focus(targetIndex);
    }
  }

  protected pasteCode(event: ClipboardEvent): void {
    event.preventDefault();
    const target = event.target;
    const index =
      target instanceof HTMLInputElement
        ? this.inputs().findIndex((item) => item.nativeElement === target)
        : 0;
    this.insertAt(Math.max(0, index), event.clipboardData?.getData('text') ?? '');
  }

  private insertAt(index: number, characters: string): void {
    const safe = this.sanitize(characters);
    const before = this.controlValue().slice(0, index);
    const after = this.controlValue().slice(index + safe.length);
    const value = `${before}${safe}${after}`.slice(0, this.safeLength());
    this.emitValue(value);
    this.focus(Math.min(this.safeLength() - 1, index + safe.length));
  }

  private replaceAt(index: number, character: string): string {
    const padded = this.controlValue().padEnd(this.safeLength(), ' ');
    const value = `${padded.slice(0, index)}${character || ' '}${padded.slice(index + 1)}`
      .trimEnd()
      .replaceAll(' ', '');
    return value.slice(0, this.safeLength());
  }

  private sanitize(value: string): string {
    return this.numericOnly() ? value.replace(/\D/g, '') : value.replace(/\s/g, '');
  }

  private emitValue(value: string): void {
    this.commitValue(value);
    this.valueChange.emit(value);
    if (value.length === this.safeLength()) {
      this.completed.emit(value);
    }
  }

  private focus(index: number): void {
    this.inputs()[index]?.nativeElement.focus();
  }
}

@Component({
  selector: 'krn-tags-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnTagsInput),
      multi: true,
    },
  ],
  template: `
    <div
      class="krn-control-shell"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="readOnly()"
      (click)="focusInput()"
    >
      <div class="krn-tag-input" role="group" [attr.aria-label]="ariaLabel()">
        @for (tag of controlValue(); track $index; let index = $index) {
          <span class="krn-token">
            <span>{{ tag }}</span>
            @if (!readOnly()) {
              <button
                class="krn-token__remove"
                type="button"
                [attr.aria-label]="'Remove ' + tag"
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
          [readOnly]="readOnly()"
          [value]="draft()"
          (blur)="commitOnBlur(); touch()"
          (input)="updateDraft($event)"
          (keydown)="handleKey($event)"
        />
      </div>
    </div>
    <span class="krn-message" aria-live="polite">{{ announcement() }}</span>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnTagsInput extends KrnValueAccessor<readonly string[]> {
  private readonly inputElement = viewChildren<ElementRef<HTMLInputElement>>('tagInput');

  readonly id = input('');
  readonly ariaLabel = input('Tags');
  readonly inputLabel = input('Add tag');
  readonly placeholder = input('Add a tag');
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
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly valueChange = output<readonly string[]>();
  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();
  readonly draft = signal('');
  readonly announcement = signal('');

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'tags');

  constructor() {
    super([]);
  }

  protected override normalizeIncomingValue(value: unknown): readonly string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
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
    if (this.isDisabled() || this.readOnly()) {
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
    this.announcement.set(`${removed} removed.`);
  }

  protected focusInput(): void {
    this.inputElement()[0]?.nativeElement.focus();
  }

  private addDraft(): void {
    if (this.isDisabled() || this.readOnly() || this.controlValue().length >= this.maxTags()) {
      return;
    }
    const tag = this.draft().trim();
    if (!tag) {
      return;
    }
    if (!this.allowDuplicates() && this.controlValue().includes(tag)) {
      this.announcement.set(`${tag} is already present.`);
      this.draft.set('');
      return;
    }
    const next = [...this.controlValue(), tag];
    this.commitValue(next);
    this.valueChange.emit(next);
    this.tagAdded.emit(tag);
    this.announcement.set(`${tag} added.`);
    this.draft.set('');
  }
}

export { KrnOtpInput as KrnVerificationCode };
