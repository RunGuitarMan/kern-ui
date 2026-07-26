import { NgTemplateOutlet } from '@angular/common';
import type {
  ElementRef} from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { KrnUploadRejection } from './form-types';
import { KrnValueAccessor, useKrnControlA11y } from './value-accessor';

@Directive()
abstract class KrnUploadBase extends KrnValueAccessor<readonly File[]> {
  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly id = input('');
  readonly label = input('Choose files');
  readonly description = input('');
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly maxSize = input(Number.POSITIVE_INFINITY, {
    transform: numberAttribute,
  });
  readonly maxFiles = input(Number.POSITIVE_INFINITY, {
    transform: numberAttribute,
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly filesChange = output<readonly File[]>();
  readonly rejected = output<readonly KrnUploadRejection[]>();
  readonly rejections = signal<readonly KrnUploadRejection[]>([]);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly a11y = useKrnControlA11y(this.id, this.invalid, 'file-upload');

  protected constructor() {
    super([]);
  }

  protected override normalizeIncomingValue(value: unknown): readonly File[] {
    if (!Array.isArray(value) || typeof File === 'undefined') {
      return [];
    }
    return value.filter((item): item is File => item instanceof File);
  }

  protected openPicker(): void {
    if (!this.isDisabled()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  protected selectFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.acceptFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  protected acceptFiles(incoming: readonly File[]): void {
    if (this.isDisabled() || incoming.length === 0) {
      return;
    }

    const candidates = this.multiple()
      ? [...this.controlValue(), ...incoming]
      : incoming.slice(0, 1);
    const accepted: File[] = [];
    const rejections: KrnUploadRejection[] = [];

    for (const file of candidates) {
      if (accepted.length >= this.maxFiles()) {
        rejections.push({
          file,
          reason: 'count',
          message: `${file.name}: maximum file count is ${this.maxFiles()}.`,
        });
      } else if (!this.matchesAccept(file)) {
        rejections.push({
          file,
          reason: 'type',
          message: `${file.name}: unsupported file type.`,
        });
      } else if (file.size > this.maxSize()) {
        rejections.push({
          file,
          reason: 'size',
          message: `${file.name}: file is larger than ${this.formatBytes(this.maxSize())}.`,
        });
      } else if (
        !accepted.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        )
      ) {
        accepted.push(file);
      }
    }

    this.rejections.set(rejections);
    this.commitValue(accepted);
    this.touch();
    this.filesChange.emit(accepted);
    if (rejections.length > 0) {
      this.rejected.emit(rejections);
    }
  }

  protected removeFile(index: number): void {
    if (this.isDisabled()) {
      return;
    }
    const next = this.controlValue().filter((_, itemIndex) => itemIndex !== index);
    this.commitValue(next);
    this.touch();
    this.filesChange.emit(next);
  }

  protected formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes)) {
      return 'unlimited';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 ** 2) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  private matchesAccept(file: File): boolean {
    const rules = this.accept()
      .split(',')
      .map((rule) => rule.trim().toLocaleLowerCase())
      .filter(Boolean);
    if (rules.length === 0) {
      return true;
    }
    const type = file.type.toLocaleLowerCase();
    const name = file.name.toLocaleLowerCase();
    return rules.some((rule) => {
      if (rule.startsWith('.')) {
        return name.endsWith(rule);
      }
      if (rule.endsWith('/*')) {
        return type.startsWith(rule.slice(0, -1));
      }
      return type === rule;
    });
  }
}

@Component({
  selector: 'krn-file-upload',
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnFileUpload),
      multi: true,
    },
  ],
  template: `
    <div
      class="krn-upload"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
    >
      <input
        #fileInput
        class="krn-upload__input"
        type="file"
        [accept]="accept()"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="label()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [multiple]="multiple()"
        [required]="required() && controlValue().length === 0"
        (change)="selectFromInput($event)"
      />
      <button
        class="krn-upload__button"
        type="button"
        [disabled]="isDisabled()"
        (click)="openPicker()"
      >
        {{ label() }}
      </button>
      @if (description()) {
        <span class="krn-message">{{ description() }}</span>
      }
      <ng-container [ngTemplateOutlet]="fileSummary" />
    </div>

    <ng-template #fileSummary>
      @if (controlValue().length) {
        <ul class="krn-file-list" aria-label="Selected files">
          @for (file of controlValue(); track file; let index = $index) {
            <li>
              <span class="krn-file-name">{{ file.name }}</span>
              <span>{{ formatBytes(file.size) }}</span>
              <button
                class="krn-inline-action"
                type="button"
                [attr.aria-label]="'Remove ' + file.name"
                [disabled]="isDisabled()"
                (click)="removeFile(index)"
              >
                ×
              </button>
            </li>
          }
        </ul>
      }
      @if (rejections().length) {
        <ul class="krn-rejection-list" aria-live="polite">
          @for (rejection of rejections(); track rejection) {
            <li>{{ rejection.message }}</li>
          }
        </ul>
      }
    </ng-template>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnFileUpload extends KrnUploadBase {
  constructor() {
    super();
  }
}

@Component({
  selector: 'krn-drop-upload, krn-drag-drop-upload',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KrnDropUpload),
      multi: true,
    },
  ],
  template: `
    <div
      class="krn-upload"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.data-disabled]="isDisabled()"
      [attr.data-dragging]="dragging()"
      [attr.data-invalid]="a11y.invalid()"
      (dragleave)="leaveDrag($event)"
      (dragover)="enterDrag($event)"
      (drop)="dropFiles($event)"
    >
      <input
        #fileInput
        class="krn-upload__input"
        type="file"
        [accept]="accept()"
        [attr.aria-describedby]="a11y.describedBy()"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-label]="label()"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [multiple]="multiple()"
        [required]="required() && controlValue().length === 0"
        (change)="selectFromInput($event)"
      />
      <strong>{{ dropLabel() }}</strong>
      <span class="krn-message">{{ description() }}</span>
      <button
        class="krn-upload__button"
        type="button"
        [disabled]="isDisabled()"
        (click)="openPicker()"
      >
        {{ label() }}
      </button>

      @if (controlValue().length) {
        <ul class="krn-file-list" aria-label="Selected files">
          @for (file of controlValue(); track file; let index = $index) {
            <li>
              <span class="krn-file-name">{{ file.name }}</span>
              <span>{{ formatBytes(file.size) }}</span>
              <button
                class="krn-inline-action"
                type="button"
                [attr.aria-label]="'Remove ' + file.name"
                [disabled]="isDisabled()"
                (click)="removeFile(index)"
              >
                ×
              </button>
            </li>
          }
        </ul>
      }
      @if (rejections().length) {
        <ul class="krn-rejection-list" aria-live="polite">
          @for (rejection of rejections(); track rejection) {
            <li>{{ rejection.message }}</li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDropUpload extends KrnUploadBase {
  readonly dropLabel = input('Drop files here');
  readonly dragging = signal(false);

  constructor() {
    super();
  }

  protected enterDrag(event: DragEvent): void {
    event.preventDefault();
    if (!this.isDisabled()) {
      this.dragging.set(true);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  }

  protected leaveDrag(event: DragEvent): void {
    const current = event.currentTarget;
    const next = event.relatedTarget;
    if (current instanceof Node && next instanceof Node && current.contains(next)) {
      return;
    }
    this.dragging.set(false);
  }

  protected dropFiles(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.acceptFiles(Array.from(event.dataTransfer?.files ?? []));
  }
}

export { KrnDropUpload as KrnDragDropUpload };
