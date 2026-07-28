import type { Provider, Signal } from '@angular/core';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  input,
  signal,
} from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import { KrnIdService } from '@kern-ui/angular/cdk';

export function createKrnId(prefix: string): string {
  return inject(KrnIdService).next(prefix);
}

export interface KrnFormFieldController {
  readonly controlId: Signal<string>;
  readonly hintId: Signal<string>;
  readonly errorId: Signal<string>;
  readonly describedBy: Signal<string>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly effectiveRequired: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  registerDescription(kind: 'hint' | 'error', id: Signal<string>): () => void;
}

export const KRN_FORM_FIELD = new InjectionToken<KrnFormFieldController>('KRN_FORM_FIELD');

const FORM_FIELD_PROVIDER: Provider = {
  provide: KRN_FORM_FIELD,
  useExisting: forwardRef(() => KrnFormField),
};

@Component({
  selector: 'krn-form-field',
  providers: [FORM_FIELD_PROVIDER],
  host: {
    class: 'krn-form-field',
    '[attr.id]': 'null',
    '[attr.data-disabled]': 'disabled()',
    '[attr.data-invalid]': 'invalid()',
    '[attr.data-required]': 'effectiveRequired()',
    '[attr.data-state]': 'state()',
    '[attr.data-valid]': 'valid()',
  },
  template: `
    <div class="krn-field-heading">
      @if (label()) {
        <label class="krn-label" [for]="controlId()">
          {{ label() }}
          @if (effectiveRequired()) {
            <span class="krn-required" aria-hidden="true">*</span>
          }
        </label>
      }
      <ng-content select="krn-label" />
      @if (!effectiveRequired() && optionalText()) {
        <span class="krn-optional">{{ optionalText() }}</span>
      }
    </div>

    <div class="krn-field-control">
      <ng-content />
    </div>

    @if (error()) {
      <p class="krn-message krn-message--error" [id]="errorId()" role="alert">
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
export class KrnFormField implements KrnFormFieldController {
  private readonly generatedControlId = signal(createKrnId('control'));
  private readonly projectedHints = signal<readonly Signal<string>[]>([]);
  private readonly projectedErrors = signal<readonly Signal<string>[]>([]);
  private readonly projectedControl = contentChild(NgControl, { descendants: true });
  private readonly controlStatusVersion = signal(0);
  private readonly controlStatusEffect = effect((onCleanup) => {
    const subscription = this.projectedControl()?.statusChanges?.subscribe(() => {
      this.controlStatusVersion.update((version) => version + 1);
    });
    onCleanup(() => subscription?.unsubscribe());
  });

  readonly id = input('');
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly optionalText = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, {
    alias: 'readonly',
    transform: booleanAttribute,
  });
  readonly state = input<'default' | 'invalid' | 'valid' | 'pending'>('default');

  readonly controlId = computed(() => this.id() || this.generatedControlId());
  readonly hintId = computed(() => `${this.controlId()}-hint`);
  readonly errorId = computed(() => `${this.controlId()}-error`);
  readonly invalid = computed(() => {
    this.controlStatusVersion();
    return (
      Boolean(this.error()) ||
      this.state() === 'invalid' ||
      this.projectedErrors().length > 0 ||
      Boolean(this.projectedControl()?.invalid)
    );
  });
  readonly effectiveRequired = computed(() => {
    this.controlStatusVersion();
    const control = this.projectedControl()?.control;
    return Boolean(
      this.required() ||
      control?.hasValidator(Validators.required) ||
      control?.hasValidator(Validators.requiredTrue),
    );
  });
  protected readonly valid = computed(() => !this.invalid() && this.state() === 'valid');
  readonly describedBy = computed(() => {
    const ids = [
      ...(this.hint() ? [this.hintId()] : []),
      ...this.projectedHints().map((id) => id()),
      ...(this.error() ? [this.errorId()] : []),
      ...this.projectedErrors().map((id) => id()),
    ].filter(Boolean);
    return [...new Set(ids)].join(' ');
  });

  registerDescription(kind: 'hint' | 'error', id: Signal<string>): () => void {
    const collection = kind === 'hint' ? this.projectedHints : this.projectedErrors;
    collection.update((current) => [...current, id]);
    return () => {
      collection.update((current) => current.filter((candidate) => candidate !== id));
    };
  }
}

@Component({
  selector: 'krn-label',
  host: { class: 'krn-label-host' },
  template: `
    <label class="krn-label" [for]="forId()">
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
  protected readonly forId = computed(() => this.for() || this.field?.controlId() || '');
  protected readonly effectiveRequired = computed(
    () => this.required() || Boolean(this.field?.effectiveRequired()),
  );
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
