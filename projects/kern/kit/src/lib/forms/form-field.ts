import type { Provider, Signal } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  effect,
  forwardRef,
  inject,
  Injectable,
  InjectionToken,
  input,
  isDevMode,
  signal,
} from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import { KrnIdService } from '@kern-ui/angular/cdk';

export function createKrnId(prefix: string): string {
  return inject(KrnIdService).next(prefix);
}

export interface KrnFormFieldControlRegistration {
  readonly element: HTMLElement;
  readonly id: Signal<string>;
  readonly labelStrategy: 'native' | 'group';
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly pending: Signal<boolean>;
  readonly valid: Signal<boolean>;
  readonly touched: Signal<boolean>;
  readonly dirty: Signal<boolean>;
}

export interface KrnFormFieldController {
  readonly controlId: Signal<string>;
  readonly labelId: Signal<string>;
  readonly labelledBy: Signal<string | null>;
  readonly nativeLabelFor: Signal<string | null>;
  readonly hintId: Signal<string>;
  readonly errorId: Signal<string>;
  readonly describedBy: Signal<string>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly pending: Signal<boolean>;
  registerControl(control: KrnFormFieldControlRegistration): () => void;
  registerDescription(kind: 'hint' | 'error', id: Signal<string>): () => void;
  isPrimaryControl(control: KrnFormFieldControlRegistration): boolean;
  focusControl(): void;
}

export const KRN_FORM_FIELD = new InjectionToken<KrnFormFieldController>('KRN_FORM_FIELD');

interface KrnFormFieldPresentation {
  readonly error: Signal<string>;
  readonly hasLabel: Signal<boolean>;
  readonly hint: Signal<string>;
  readonly projectedControl: Signal<NgControl | undefined>;
}

@Injectable()
class KrnFormFieldState implements KrnFormFieldController {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly generatedControlId = signal(createKrnId('control'));
  private readonly registeredControls = signal<readonly KrnFormFieldControlRegistration[]>([]);
  private readonly projectedHints = signal<readonly Signal<string>[]>([]);
  private readonly projectedErrors = signal<readonly Signal<string>[]>([]);
  private readonly presentation = signal<KrnFormFieldPresentation | null>(null);
  private readonly controlStatusVersion = signal(0);
  private multipleControlsReported = false;
  private readonly controlStatusEffect = effect((onCleanup) => {
    const ngControl = this.presentation()?.projectedControl();
    const subscription = (ngControl?.control?.events ?? ngControl?.statusChanges)?.subscribe(() => {
      this.controlStatusVersion.update((version) => version + 1);
    });
    onCleanup(() => subscription?.unsubscribe());
  });

  constructor() {
    const host = this.elementRef.nativeElement;
    const MutationObserverConstructor = host.ownerDocument.defaultView?.MutationObserver;
    if (!MutationObserverConstructor) {
      return;
    }

    const observer = new MutationObserverConstructor(() => this.refreshControlOrder());
    observer.observe(host, { childList: true, subtree: true });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  private readonly primaryControl = computed(() => this.registeredControls()[0]);
  readonly controlId = computed(() => this.primaryControl()?.id() || this.generatedControlId());
  readonly labelId = computed(() => `${this.controlId()}-field-label`);
  readonly labelledBy = computed(() => (this.presentation()?.hasLabel() ? this.labelId() : null));
  readonly nativeLabelFor = computed(() =>
    this.primaryControl()?.labelStrategy === 'group' ? null : this.controlId(),
  );
  readonly hintId = computed(() => `${this.controlId()}-hint`);
  readonly errorId = computed(() => `${this.controlId()}-error`);
  readonly invalid = computed(() => {
    this.controlStatusVersion();
    const presentation = this.presentation();
    const projectedControl = presentation?.projectedControl()?.control;
    const projectedInvalid = Boolean(
      projectedControl?.invalid &&
      !projectedControl.disabled &&
      (projectedControl.touched || projectedControl.dirty),
    );
    return (
      Boolean(presentation?.error()) ||
      this.projectedErrors().length > 0 ||
      Boolean(this.primaryControl()?.invalid()) ||
      projectedInvalid
    );
  });
  readonly required = computed(() => {
    this.controlStatusVersion();
    const control = this.presentation()?.projectedControl()?.control;
    return Boolean(
      this.primaryControl()?.required() ||
      control?.hasValidator(Validators.required) ||
      control?.hasValidator(Validators.requiredTrue),
    );
  });
  readonly disabled = computed(() => {
    this.controlStatusVersion();
    return Boolean(
      this.presentation()?.projectedControl()?.disabled || this.primaryControl()?.disabled(),
    );
  });
  readonly readOnly = computed(() => Boolean(this.primaryControl()?.readOnly()));
  readonly pending = computed(() => {
    this.controlStatusVersion();
    return Boolean(
      this.presentation()?.projectedControl()?.pending || this.primaryControl()?.pending(),
    );
  });
  private readonly interacted = computed(() => {
    this.controlStatusVersion();
    const control = this.presentation()?.projectedControl()?.control;
    return Boolean(
      control?.touched ||
      control?.dirty ||
      this.primaryControl()?.touched() ||
      this.primaryControl()?.dirty(),
    );
  });
  readonly valid = computed(() => {
    this.controlStatusVersion();
    const control = this.presentation()?.projectedControl()?.control;
    const registeredValid = this.primaryControl()?.valid();
    return (
      !this.invalid() &&
      !this.disabled() &&
      !this.pending() &&
      this.interacted() &&
      Boolean(control?.valid || registeredValid)
    );
  });
  readonly state = computed<'default' | 'invalid' | 'valid' | 'pending'>(() => {
    if (this.invalid()) {
      return 'invalid';
    }
    if (this.pending()) {
      return 'pending';
    }
    return this.valid() ? 'valid' : 'default';
  });
  readonly describedBy = computed(() => {
    const presentation = this.presentation();
    const ids = [
      ...(presentation?.hint() && !presentation.error() ? [this.hintId()] : []),
      ...this.projectedHints().map((id) => id()),
      ...(presentation?.error() ? [this.errorId()] : []),
      ...this.projectedErrors().map((id) => id()),
    ].filter(Boolean);
    return [...new Set(ids)].join(' ');
  });

  connect(presentation: KrnFormFieldPresentation): void {
    this.presentation.set(presentation);
  }

  registerControl(control: KrnFormFieldControlRegistration): () => void {
    const current = this.registeredControls();
    if (isDevMode() && current.length > 0 && !this.multipleControlsReported) {
      this.multipleControlsReported = true;
      console.warn(
        'KERN Form Field received more than one registered control. ' +
          'Use one Form Field per control, or a group component for related choices.',
      );
    }
    this.registeredControls.set(this.sortControls([...current, control]));

    return () => {
      this.registeredControls.update((controls) =>
        controls.filter((candidate) => candidate !== control),
      );
    };
  }

  refreshControlOrder(): void {
    const current = this.registeredControls();
    const sorted = this.sortControls(current);
    if (sorted.some((control, index) => control !== current[index])) {
      this.registeredControls.set(sorted);
    }
  }

  registerDescription(kind: 'hint' | 'error', id: Signal<string>): () => void {
    const collection = kind === 'hint' ? this.projectedHints : this.projectedErrors;
    collection.update((current) => [...current, id]);
    return () => {
      collection.update((current) => current.filter((candidate) => candidate !== id));
    };
  }

  isPrimaryControl(control: KrnFormFieldControlRegistration): boolean {
    return this.primaryControl() === control;
  }

  focusControl(): void {
    if (this.nativeLabelFor()) {
      return;
    }

    const root = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '[data-krn-form-field-control]',
    );
    if (!root) {
      return;
    }

    const focusableSelector = [
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const target = root.matches(focusableSelector)
      ? root
      : root.querySelector<HTMLElement>(focusableSelector);
    target?.focus();
  }

  private sortControls(
    controls: readonly KrnFormFieldControlRegistration[],
  ): readonly KrnFormFieldControlRegistration[] {
    return [...controls].sort((left, right) => {
      if (left.element === right.element) {
        return 0;
      }
      const position = left.element.compareDocumentPosition(right.element);
      if (position & 4) {
        return -1;
      }
      if (position & 2) {
        return 1;
      }
      return 0;
    });
  }
}

const FORM_FIELD_PROVIDERS: Provider[] = [
  KrnFormFieldState,
  {
    provide: KRN_FORM_FIELD,
    useExisting: KrnFormFieldState,
  },
];

@Component({
  selector: 'krn-form-field',
  providers: FORM_FIELD_PROVIDERS,
  host: {
    class: 'krn-form-field',
    '[attr.data-disabled]': 'disabled()',
    '[attr.data-invalid]': 'invalid()',
    '[attr.data-readonly]': 'readOnly()',
    '[attr.data-required]': 'required()',
    '[attr.data-state]': 'state()',
    '[attr.data-valid]': 'valid()',
  },
  template: `
    <div class="krn-field-heading">
      @if (label() && !projectedLabel()) {
        <label
          class="krn-label"
          [attr.for]="nativeLabelFor()"
          [id]="labelId()"
          (click)="focusControl()"
        >
          {{ label() }}
          @if (required()) {
            <span class="krn-required" aria-hidden="true">*</span>
          }
        </label>
      }
      <ng-content select="krn-label" />
      @if (!required() && optionalText()) {
        <span class="krn-optional">{{ optionalText() }}</span>
      }
    </div>

    <div class="krn-field-control">
      <ng-content />
    </div>

    @if (error()) {
      <p class="krn-message krn-message--error" aria-live="polite" [id]="errorId()">
        <span class="krn-message__mark" aria-hidden="true">!</span>
        {{ error() }}
      </p>
    } @else if (hint()) {
      <p class="krn-message" [id]="hintId()">{{ hint() }}</p>
    }
    <ng-content select="krn-hint, krn-validation-message" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnFormField {
  private readonly fieldState = inject(KrnFormFieldState);
  protected readonly projectedLabel = contentChild<KrnLabel>(forwardRef(() => KrnLabel));
  private readonly projectedControl = contentChild(NgControl, { descendants: true });

  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly optionalText = input('');
  private readonly hasLabel = computed(() => Boolean(this.label() || this.projectedLabel()));

  protected readonly controlId = this.fieldState.controlId;
  protected readonly labelId = this.fieldState.labelId;
  protected readonly nativeLabelFor = this.fieldState.nativeLabelFor;
  protected readonly hintId = this.fieldState.hintId;
  protected readonly errorId = this.fieldState.errorId;
  protected readonly invalid = this.fieldState.invalid;
  protected readonly required = this.fieldState.required;
  protected readonly disabled = this.fieldState.disabled;
  protected readonly readOnly = this.fieldState.readOnly;
  protected readonly valid = this.fieldState.valid;
  protected readonly state = this.fieldState.state;

  constructor() {
    this.fieldState.connect({
      error: this.error,
      hasLabel: this.hasLabel,
      hint: this.hint,
      projectedControl: this.projectedControl,
    });
  }

  protected focusControl(): void {
    this.fieldState.focusControl();
  }
}

@Component({
  selector: 'krn-label',
  host: { class: 'krn-label-host' },
  template: `
    <label class="krn-label" [attr.for]="forId()" [attr.id]="labelId()" (click)="focusControl()">
      <ng-content />
      @if (effectiveRequired()) {
        <span class="krn-required" aria-hidden="true">*</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnLabel {
  private readonly field = inject(KRN_FORM_FIELD, { optional: true });
  readonly for = input('', { alias: 'for' });
  readonly required = input(false, { transform: booleanAttribute });
  protected readonly forId = computed(() =>
    this.field ? this.field.nativeLabelFor() : this.for() || null,
  );
  protected readonly labelId = computed(() => this.field?.labelId() || null);
  protected readonly effectiveRequired = computed(() =>
    this.field ? this.field.required() : this.required(),
  );

  protected focusControl(): void {
    if (!this.forId()) {
      this.field?.focusControl();
    }
  }
}

@Component({
  selector: 'krn-hint',
  host: {
    class: 'krn-message-host',
    '[attr.id]': 'null',
  },
  template: `<p class="krn-message" [id]="id()"><ng-content /></p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnHint {
  private readonly field = inject(KRN_FORM_FIELD, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly generatedId = createKrnId('hint');
  readonly customId = input('', { alias: 'id' });
  protected readonly id = computed(() => this.customId() || this.generatedId);

  constructor() {
    if (this.field) {
      this.destroyRef.onDestroy(this.field.registerDescription('hint', this.id));
    }
  }
}

@Component({
  selector: 'krn-validation-message',
  host: {
    class: 'krn-message-host',
    '[attr.id]': 'null',
  },
  template: `
    <p class="krn-message krn-message--error" [id]="id()" role="alert">
      <span class="krn-message__mark" aria-hidden="true">!</span>
      <ng-content />
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnValidationMessage {
  private readonly field = inject(KRN_FORM_FIELD, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly generatedId = createKrnId('error');
  readonly customId = input('', { alias: 'id' });
  protected readonly id = computed(() => this.customId() || this.generatedId);

  constructor() {
    if (this.field) {
      this.destroyRef.onDestroy(this.field.registerDescription('error', this.id));
    }
  }
}
