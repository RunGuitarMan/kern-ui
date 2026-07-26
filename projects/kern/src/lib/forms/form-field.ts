import type {
  Provider,
  Signal} from '@angular/core';
import {
  APP_ID,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  Injectable,
  InjectionToken,
  input,
  signal,
  inject,
} from '@angular/core';

@Injectable({ providedIn: 'root' })
class KrnIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  create(prefix: string): string {
    this.nextId += 1;
    return `krn-${this.appId}-${prefix}-${this.nextId}`;
  }
}

export function createKrnId(prefix: string): string {
  return inject(KrnIdGenerator).create(prefix);
}

export interface KrnFormFieldController {
  readonly controlId: Signal<string>;
  readonly hintId: Signal<string>;
  readonly errorId: Signal<string>;
  readonly describedBy: Signal<string>;
  readonly invalid: Signal<boolean>;
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
    '[attr.data-disabled]': 'disabled()',
    '[attr.data-invalid]': 'invalid()',
    '[attr.data-required]': 'required()',
  },
  template: `
    <div class="krn-field-heading">
      @if (label()) {
        <label class="krn-label" [for]="controlId()">
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
      <p class="krn-message krn-message--error" [id]="errorId()" role="alert">
        <span class="krn-message__mark" aria-hidden="true">!</span>
        {{ error() }}
      </p>
    } @else if (hint()) {
      <p class="krn-message" [id]="hintId()">{{ hint() }}</p>
    }
    <ng-content select="krn-hint, krn-validation-message" />
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnFormField implements KrnFormFieldController {
  private readonly generatedControlId = signal(createKrnId('control'));

  readonly id = input('');
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly optionalText = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly state = input<'default' | 'invalid' | 'valid' | 'pending'>('default');

  readonly controlId = computed(() => this.id() || this.generatedControlId());
  readonly hintId = computed(() => `${this.controlId()}-hint`);
  readonly errorId = computed(() => `${this.controlId()}-error`);
  readonly invalid = computed(() => Boolean(this.error()) || this.state() === 'invalid');
  readonly describedBy = computed(() => {
    if (this.invalid() && this.error()) {
      return this.errorId();
    }
    return this.hint() ? this.hintId() : '';
  });
}

@Component({
  selector: 'krn-label',
  host: { class: 'krn-label-host' },
  template: `
    <label class="krn-label" [for]="forId()">
      <ng-content />
      @if (required()) {
        <span class="krn-required" aria-hidden="true">*</span>
      }
    </label>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnLabel {
  private readonly field = inject(KRN_FORM_FIELD, { optional: true });
  readonly for = input('', { alias: 'for' });
  readonly required = input(false, { transform: booleanAttribute });
  protected readonly forId = computed(() => this.for() || this.field?.controlId() || '');
}

@Component({
  selector: 'krn-hint',
  host: { class: 'krn-message-host' },
  template: `<p class="krn-message" [id]="id()"><ng-content /></p>`,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnHint {
  private readonly field = inject(KRN_FORM_FIELD, { optional: true });
  private readonly generatedId = createKrnId('hint');
  readonly customId = input('', { alias: 'id' });
  protected readonly id = computed(
    () => this.customId() || this.field?.hintId() || this.generatedId,
  );
}

@Component({
  selector: 'krn-validation-message',
  host: { class: 'krn-message-host' },
  template: `
    <p class="krn-message krn-message--error" [id]="id()" role="alert">
      <span class="krn-message__mark" aria-hidden="true">!</span>
      <ng-content />
    </p>
  `,
  styleUrl: './forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KrnValidationMessage {
  private readonly field = inject(KRN_FORM_FIELD, { optional: true });
  private readonly generatedId = createKrnId('error');
  readonly customId = input('', { alias: 'id' });
  protected readonly id = computed(
    () => this.customId() || this.field?.errorId() || this.generatedId,
  );
}
