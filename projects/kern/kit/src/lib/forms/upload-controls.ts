import { NgTemplateOutlet } from '@angular/common';
import type { ElementRef, OutputEmitterRef, Signal } from '@angular/core';
import {
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
import { KRN_PLATFORM, krnIsNode } from '@kern-ui/angular/cdk';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnUploadRejection } from './form-types';
import {
  maxLengthError,
  mergeValidationErrors,
  provideKrnFormControl,
  requiredError,
  useKrnControlA11y,
  useKrnFormControl,
} from './value-accessor';

const mergeAriaIds = (...values: readonly (string | null | undefined)[]): string | null => {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? [...new Set(ids)].join(' ') : null;
};

const sameFile = (left: File, right: File): boolean =>
  left.name === right.name &&
  left.size === right.size &&
  left.type === right.type &&
  left.lastModified === right.lastModified;

interface KrnUploadHost {
  readonly id: Signal<string>;
  readonly locale: Signal<string>;
  readonly accept: Signal<string>;
  readonly multiple: Signal<boolean>;
  readonly maxSize: Signal<number>;
  readonly maxFiles: Signal<number>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly value: Signal<readonly File[] | undefined>;
  readonly filesChange: OutputEmitterRef<readonly File[]>;
  readonly rejected: OutputEmitterRef<readonly KrnUploadRejection[]>;
}

/** Internal signal controller shared by file-picker and drop-zone variants. */
class KrnUploadController {
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly formControl: ReturnType<typeof useKrnFormControl<readonly File[]>>;
  readonly rejections = signal<readonly KrnUploadRejection[]>([]);
  readonly controlValue: ReturnType<typeof signal<readonly File[]>>;
  readonly formDisabled: ReturnType<typeof signal<boolean>>;
  readonly touch: () => void;
  readonly writeValue: (value: unknown) => void;
  readonly registerOnChange: (fn: (value: readonly File[]) => void) => void;
  readonly registerOnTouched: (fn: () => void) => void;
  readonly setDisabledState: (disabled: boolean) => void;
  readonly validate: ReturnType<typeof useKrnFormControl<readonly File[]>>['validate'];
  readonly registerOnValidatorChange: (fn: () => void) => void;
  readonly a11y: ReturnType<typeof useKrnControlA11y>;
  readonly isDisabled: Signal<boolean>;

  constructor(
    private readonly host: KrnUploadHost,
    private readonly fileInput: Signal<ElementRef<HTMLInputElement> | undefined>,
  ) {
    this.formControl = useKrnFormControl(this, [] as readonly File[], {
      normalizeIncomingValue: (value) => this.normalizeIncomingValue(value),
      validateValue: (value) => this.validateValue(value),
      valuesEqual: (current, next) => this.valuesEqual(current, next),
    });
    this.controlValue = this.formControl.controlValue;
    this.formDisabled = this.formControl.formDisabled;
    this.touch = this.formControl.touch;
    this.writeValue = this.formControl.writeValue;
    this.registerOnChange = this.formControl.registerOnChange;
    this.registerOnTouched = this.formControl.registerOnTouched;
    this.setDisabledState = this.formControl.setDisabledState;
    this.validate = this.formControl.validate;
    this.registerOnValidatorChange = this.formControl.registerOnValidatorChange;
    this.a11y = useKrnControlA11y(this, this.host.id, this.host.invalid, 'file-upload', {
      disabled: this.host.disabled,
      readOnly: this.host.readOnly,
      required: this.host.required,
    });
    this.isDisabled = computed(() => this.a11y.disabled() || this.formDisabled());
    this.formControl.watchValidationInputs(
      this.host.required,
      this.a11y.required,
      this.host.accept,
      this.host.maxFiles,
      this.host.maxSize,
    );
    this.formControl.bindStandaloneValue(this.host.value);
  }

  private normalizeIncomingValue(value: unknown): readonly File[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is File => this.isFile(item));
  }

  private validateValue(value: unknown) {
    const files = Array.isArray(value)
      ? value.filter((item): item is File => this.isFile(item))
      : [];
    const unsupported = files.filter((file) => !this.matchesAccept(file));
    const oversized = files.filter((file) => file.size > this.host.maxSize());
    return mergeValidationErrors(
      requiredError(files, this.a11y.required()),
      maxLengthError(files, this.host.maxFiles()),
      unsupported.length > 0 ? { fileType: { files: unsupported.map((file) => file.name) } } : null,
      oversized.length > 0
        ? {
            fileSize: {
              maxSize: this.host.maxSize(),
              files: oversized.map((file) => file.name),
            },
          }
        : null,
    );
  }

  private valuesEqual(current: readonly File[], next: readonly File[]): boolean {
    return (
      current.length === next.length && current.every((file, index) => sameFile(file, next[index]!))
    );
  }

  openPicker(): void {
    if (!this.isDisabled() && !this.a11y.readOnly()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  selectFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.acceptFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  acceptFiles(incoming: readonly File[]): void {
    if (this.isDisabled() || this.a11y.readOnly() || incoming.length === 0) {
      return;
    }

    const candidates = this.host.multiple()
      ? [...this.controlValue(), ...incoming]
      : incoming.slice(0, 1);
    const accepted: File[] = [];
    const rejections: KrnUploadRejection[] = [];

    for (const file of candidates) {
      if (accepted.some((existing) => sameFile(existing, file))) {
        continue;
      }
      if (accepted.length >= this.host.maxFiles()) {
        rejections.push({
          file,
          reason: 'count',
          message: this.translations.forms.maximumFileCount(file.name, this.host.maxFiles()),
        });
      } else if (!this.matchesAccept(file)) {
        rejections.push({
          file,
          reason: 'type',
          message: this.translations.forms.unsupportedFileType(file.name),
        });
      } else if (file.size > this.host.maxSize()) {
        rejections.push({
          file,
          reason: 'size',
          message: this.translations.forms.fileTooLarge(
            file.name,
            this.formatBytes(this.host.maxSize()),
          ),
        });
      } else {
        accepted.push(file);
      }
    }

    this.rejections.set(rejections);
    const changed = this.formControl.commitUserValue(accepted);
    this.formControl.touch();
    if (changed) {
      this.host.filesChange.emit(accepted);
    }
    if (rejections.length > 0) {
      this.host.rejected.emit(rejections);
    }
  }

  removeFile(index: number): void {
    if (this.isDisabled() || this.a11y.readOnly()) {
      return;
    }
    const next = this.controlValue().filter((_, itemIndex) => itemIndex !== index);
    const changed = this.formControl.commitUserValue(next);
    this.formControl.touch();
    if (changed) {
      this.host.filesChange.emit(next);
    }
  }

  formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes)) {
      return this.translations.forms.unlimited;
    }
    const formatter = new Intl.NumberFormat(this.host.locale(), { maximumFractionDigits: 1 });
    if (bytes < 1024) {
      return `${formatter.format(bytes)} B`;
    }
    if (bytes < 1024 ** 2) {
      return `${formatter.format(Math.round(bytes / 1024))} KB`;
    }
    return `${formatter.format(bytes / 1024 ** 2)} MB`;
  }

  fileKey(file: File): string {
    return `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
  }

  private matchesAccept(file: File): boolean {
    const rules = this.host
      .accept()
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

  private isFile(value: unknown): value is File {
    const FileConstructor = this.platform.window?.File;
    return Boolean(FileConstructor && value instanceof FileConstructor);
  }
}

@Component({
  selector: 'krn-file-upload',
  host: {
    '[attr.id]': 'null',
  },
  imports: [NgTemplateOutlet],
  providers: [...provideKrnFormControl()],
  template: `
    <div
      class="krn-upload"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.data-disabled]="isDisabled()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
    >
      <input
        #fileInput
        class="krn-upload__input"
        type="file"
        [accept]="accept()"
        aria-hidden="true"
        [disabled]="isDisabled() || a11y.readOnly()"
        [id]="nativeInputId()"
        [multiple]="multiple()"
        tabindex="-1"
        (change)="selectFromInput($event)"
      />
      <button
        #action
        class="krn-upload__button"
        type="button"
        [attr.aria-describedby]="effectiveDescribedBy()"
        [attr.aria-disabled]="a11y.readOnly() ? 'true' : null"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-labelledby]="effectiveLabelledBy()"
        [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [tabIndex]="isDisabled() ? -1 : tabIndex()"
        (blur)="touch()"
        (click)="openPicker()"
      >
        {{ label() }}
      </button>
      @if (description()) {
        <span class="krn-message" [id]="descriptionId()">{{ description() }}</span>
      }
      @if (a11y.required()) {
        <span class="krn-visually-hidden" [id]="requiredDescriptionId()">
          {{ translations.forms.fileSelectionRequired }}
        </span>
      }
      <ng-container [ngTemplateOutlet]="fileSummary" />
    </div>

    <ng-template #fileSummary>
      @if (controlValue().length) {
        <ul class="krn-file-list" [attr.aria-label]="translations.forms.selectedFiles">
          @for (file of controlValue(); track fileKey(file); let index = $index) {
            <li>
              <span class="krn-file-name">{{ file.name }}</span>
              <span>{{ formatBytes(file.size) }}</span>
              <button
                class="krn-inline-action"
                type="button"
                [attr.aria-label]="translations.forms.removeFile(file.name)"
                [disabled]="isDisabled() || a11y.readOnly()"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnFileUpload {
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly label = input(this.translations.forms.chooseFiles);
  readonly locale = input(inject(KRN_LOCALE));
  readonly description = input('');
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly maxSize = input(Number.POSITIVE_INFINITY, { transform: numberAttribute });
  readonly maxFiles = input(Number.POSITIVE_INFINITY, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly filesChange = output<readonly File[]>();
  readonly rejected = output<readonly KrnUploadRejection[]>();
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<readonly File[] | undefined>(undefined);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly #controller = new KrnUploadController(this, this.fileInput);
  protected readonly rejections = this.#controller.rejections;
  protected readonly controlValue = this.#controller.controlValue;
  protected readonly formDisabled = this.#controller.formDisabled;
  protected readonly touch = this.#controller.touch;
  readonly writeValue = this.#controller.writeValue;
  readonly registerOnChange = this.#controller.registerOnChange;
  readonly registerOnTouched = this.#controller.registerOnTouched;
  readonly setDisabledState = this.#controller.setDisabledState;
  readonly validate = this.#controller.validate;
  readonly registerOnValidatorChange = this.#controller.registerOnValidatorChange;
  protected readonly a11y = this.#controller.a11y;
  protected readonly isDisabled = this.#controller.isDisabled;
  protected readonly nativeInputId = computed(() => `${this.a11y.id()}-native`);
  protected readonly descriptionId = computed(() => `${this.a11y.id()}-description`);
  protected readonly requiredDescriptionId = computed(() => `${this.a11y.id()}-required`);
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(
      this.ariaDescribedBy(),
      this.a11y.describedBy(),
      this.description() ? this.descriptionId() : null,
      this.a11y.required() ? this.requiredDescriptionId() : null,
    ),
  );
  private readonly action = viewChild<ElementRef<HTMLButtonElement>>('action');

  protected openPicker(): void {
    this.#controller.openPicker();
  }

  protected selectFromInput(event: Event): void {
    this.#controller.selectFromInput(event);
  }

  protected removeFile(index: number): void {
    this.#controller.removeFile(index);
  }

  protected formatBytes(bytes: number): string {
    return this.#controller.formatBytes(bytes);
  }

  protected fileKey(file: File): string {
    return this.#controller.fileKey(file);
  }

  focus(options?: FocusOptions): void {
    this.action()?.nativeElement.focus(options);
  }

  blur(): void {
    this.action()?.nativeElement.blur();
  }
}

@Component({
  selector: 'krn-drop-upload, krn-drag-drop-upload',
  host: {
    '[attr.id]': 'null',
  },
  providers: [...provideKrnFormControl()],
  template: `
    <div
      class="krn-upload"
      [attr.aria-invalid]="a11y.invalid()"
      [attr.data-disabled]="isDisabled()"
      [attr.data-dragging]="dragging()"
      [attr.data-invalid]="a11y.invalid()"
      [attr.data-readonly]="a11y.readOnly()"
      (dragleave)="leaveDrag($event)"
      (dragover)="enterDrag($event)"
      (drop)="dropFiles($event)"
    >
      <input
        #fileInput
        class="krn-upload__input"
        type="file"
        [accept]="accept()"
        aria-hidden="true"
        [disabled]="isDisabled() || a11y.readOnly()"
        [id]="nativeInputId()"
        [multiple]="multiple()"
        tabindex="-1"
        (change)="selectFromInput($event)"
      />
      <strong [id]="dropLabelId()">{{ dropLabel() }}</strong>
      @if (description()) {
        <span class="krn-message" [id]="descriptionId()">{{ description() }}</span>
      }
      <button
        #action
        class="krn-upload__button"
        type="button"
        [attr.aria-describedby]="effectiveDescribedBy()"
        [attr.aria-disabled]="a11y.readOnly() ? 'true' : null"
        [attr.aria-invalid]="a11y.invalid()"
        [attr.aria-labelledby]="effectiveLabelledBy()"
        [attr.data-krn-form-field-control]="a11y.isFormFieldControl() ? '' : null"
        [disabled]="isDisabled()"
        [id]="a11y.id()"
        [tabIndex]="isDisabled() ? -1 : tabIndex()"
        (blur)="touch()"
        (click)="openPicker()"
      >
        {{ label() }}
      </button>
      @if (a11y.required()) {
        <span class="krn-visually-hidden" [id]="requiredDescriptionId()">
          {{ translations.forms.fileSelectionRequired }}
        </span>
      }

      @if (controlValue().length) {
        <ul class="krn-file-list" [attr.aria-label]="translations.forms.selectedFiles">
          @for (file of controlValue(); track fileKey(file); let index = $index) {
            <li>
              <span class="krn-file-name">{{ file.name }}</span>
              <span>{{ formatBytes(file.size) }}</span>
              <button
                class="krn-inline-action"
                type="button"
                [attr.aria-label]="translations.forms.removeFile(file.name)"
                [disabled]="isDisabled() || a11y.readOnly()"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnDropUpload {
  protected readonly platform = inject(KRN_PLATFORM);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly id = input('');
  readonly label = input(this.translations.forms.chooseFiles);
  readonly locale = input(inject(KRN_LOCALE));
  readonly description = input('');
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly maxSize = input(Number.POSITIVE_INFINITY, { transform: numberAttribute });
  readonly maxFiles = input(Number.POSITIVE_INFINITY, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly filesChange = output<readonly File[]>();
  readonly rejected = output<readonly KrnUploadRejection[]>();
  readonly dropLabel = input(this.translations.forms.dropFilesHere);
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly tabIndex = input(0, { alias: 'tabindex', transform: numberAttribute });
  readonly value = input<readonly File[] | undefined>(undefined);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly #controller = new KrnUploadController(this, this.fileInput);
  protected readonly rejections = this.#controller.rejections;
  protected readonly controlValue = this.#controller.controlValue;
  protected readonly formDisabled = this.#controller.formDisabled;
  protected readonly touch = this.#controller.touch;
  readonly writeValue = this.#controller.writeValue;
  readonly registerOnChange = this.#controller.registerOnChange;
  readonly registerOnTouched = this.#controller.registerOnTouched;
  readonly setDisabledState = this.#controller.setDisabledState;
  readonly validate = this.#controller.validate;
  readonly registerOnValidatorChange = this.#controller.registerOnValidatorChange;
  protected readonly a11y = this.#controller.a11y;
  protected readonly isDisabled = this.#controller.isDisabled;
  protected readonly dragging = signal(false);
  protected readonly nativeInputId = computed(() => `${this.a11y.id()}-native`);
  protected readonly dropLabelId = computed(() => `${this.a11y.id()}-drop-label`);
  protected readonly descriptionId = computed(() => `${this.a11y.id()}-description`);
  protected readonly requiredDescriptionId = computed(() => `${this.a11y.id()}-required`);
  protected readonly effectiveLabelledBy = computed(() =>
    mergeAriaIds(this.ariaLabelledBy(), this.a11y.labelledBy()),
  );
  protected readonly effectiveDescribedBy = computed(() =>
    mergeAriaIds(
      this.ariaDescribedBy(),
      this.a11y.describedBy(),
      this.dropLabelId(),
      this.description() ? this.descriptionId() : null,
      this.a11y.required() ? this.requiredDescriptionId() : null,
    ),
  );
  private readonly action = viewChild<ElementRef<HTMLButtonElement>>('action');
  private readonly resetDraggingWhenBlocked = effect(() => {
    if (this.isDisabled() || this.a11y.readOnly()) {
      this.dragging.set(false);
    }
  });

  protected openPicker(): void {
    this.#controller.openPicker();
  }

  protected selectFromInput(event: Event): void {
    this.#controller.selectFromInput(event);
  }

  protected acceptFiles(incoming: readonly File[]): void {
    this.#controller.acceptFiles(incoming);
  }

  protected removeFile(index: number): void {
    this.#controller.removeFile(index);
  }

  protected formatBytes(bytes: number): string {
    return this.#controller.formatBytes(bytes);
  }

  protected fileKey(file: File): string {
    return this.#controller.fileKey(file);
  }

  protected enterDrag(event: DragEvent): void {
    event.preventDefault();
    if (this.isDisabled() || this.a11y.readOnly()) {
      this.dragging.set(false);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      return;
    }
    this.dragging.set(true);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  protected leaveDrag(event: DragEvent): void {
    const current = event.currentTarget;
    const next = event.relatedTarget;
    if (
      krnIsNode(this.platform, current) &&
      krnIsNode(this.platform, next) &&
      current.contains(next)
    ) {
      return;
    }
    this.dragging.set(false);
  }

  protected dropFiles(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.acceptFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  focus(options?: FocusOptions): void {
    this.action()?.nativeElement.focus(options);
  }

  blur(): void {
    this.action()?.nativeElement.blur();
  }
}

export { KrnDropUpload as KrnDragDropUpload };
