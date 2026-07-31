import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KrnIdService } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

export interface KrnLoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly remember: boolean;
}

export interface KrnProfileValue {
  readonly name: string;
  readonly role: string;
  readonly bio: string;
  readonly timezone: string;
}

export interface KrnFormStep {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly optional?: boolean;
  readonly valid?: boolean;
}

const FORM_PATTERN_STYLES = `
  :host {
    display: block;
    color: var(--krn-color-text, #252932);
    font: var(--krn-font-body, 500 0.875rem/1.375rem sans-serif);
  }
  form {
    display: grid;
    gap: var(--krn-space-4, 1rem);
  }
  .field {
    display: grid;
    gap: 0.375rem;
  }
  label {
    font-weight: 620;
  }
  label span {
    color: var(--krn-color-danger-text, #a02d2d);
  }
  input,
  textarea,
  select {
    inline-size: 100%;
    min-block-size: var(--krn-control-size, 2.5rem);
    box-sizing: border-box;
    padding-inline: 0.75rem;
    border: 1px solid var(--krn-color-border, #cdd1d7);
    border-radius: var(--krn-radius-control, 0.375rem);
    color: var(--krn-color-text, #252932);
    background: var(--krn-color-surface, #fff);
    font: inherit;
  }
  textarea {
    min-block-size: 6rem;
    padding-block: 0.625rem;
    resize: vertical;
  }
  input:hover,
  textarea:hover,
  select:hover {
    border-color: var(--krn-color-border-strong, #8f969f);
  }
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible,
  button:focus-visible,
  a:focus-visible {
    outline: var(--krn-focus-ring, 2px solid #4f6feb);
    outline-offset: 2px;
  }
  [aria-invalid='true'] {
    border-color: var(--krn-color-danger-border, #dc716c);
  }
  .error {
    margin: 0;
    color: var(--krn-color-danger-text, #a02d2d);
    font-size: 0.75rem;
  }
  .hint {
    margin: 0;
    color: var(--krn-color-text-muted, #626a76);
    font-size: 0.75rem;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  .check input {
    inline-size: 1rem;
    block-size: 1rem;
    min-block-size: auto;
    accent-color: var(--krn-color-brand-solid, #4f6feb);
  }
  .submit {
    display: inline-flex;
    min-block-size: var(--krn-control-size, 2.5rem);
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding-inline: 1rem;
    border: 1px solid var(--krn-color-brand-solid, #4f6feb);
    border-radius: var(--krn-radius-control, 0.375rem);
    color: var(--krn-color-on-brand, #fff);
    background: var(--krn-color-brand-solid, #4f6feb);
    font: inherit;
    font-weight: 650;
    cursor: pointer;
  }
  .submit:disabled {
    opacity: var(--krn-opacity-disabled, 0.48);
    cursor: not-allowed;
  }
`;

@Component({
  selector: 'krn-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" [attr.aria-busy]="loading()" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label [for]="emailId">{{ resolvedEmailLabel() }} <span aria-hidden="true">*</span></label>
        <input
          [id]="emailId"
          type="email"
          inputmode="email"
          autocomplete="email"
          autocapitalize="none"
          required
          [spellcheck]="false"
          formControlName="email"
          [attr.aria-invalid]="showError('email')"
          [attr.aria-describedby]="showError('email') ? emailErrorId : null"
        />
        @if (showError('email')) {
          <p class="error" [id]="emailErrorId" role="alert">{{ resolvedEmailErrorLabel() }}</p>
        }
      </div>
      <div class="field">
        <label [for]="passwordId"
          >{{ resolvedPasswordLabel() }} <span aria-hidden="true">*</span></label
        >
        <input
          [id]="passwordId"
          type="password"
          autocomplete="current-password"
          required
          formControlName="password"
          [attr.aria-invalid]="showError('password')"
          [attr.aria-describedby]="showError('password') ? passwordErrorId : null"
        />
        @if (showError('password')) {
          <p class="error" [id]="passwordErrorId" role="alert">
            {{ resolvedPasswordErrorLabel() }}
          </p>
        }
      </div>
      <div class="row">
        <label class="check">
          <input type="checkbox" formControlName="remember" />
          {{ resolvedRememberLabel() }}
        </label>
        @if (resolvedRecoveryHref(); as href) {
          <a [href]="href">{{ resolvedRecoveryLabel() }}</a>
        }
      </div>
      @if (resolvedErrorMessage(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
      <button class="submit" type="submit" [attr.aria-disabled]="loading()">
        @if (loading()) {
          <span aria-hidden="true">◌</span>
          {{ resolvedLoadingLabel() }}
        } @else {
          {{ resolvedSubmitLabel() }}
        }
      </button>
      <span class="sr-only" aria-live="polite">
        {{ loading() ? resolvedLoadingLabel() : '' }}
      </span>
    </form>
  `,
  styles: [
    FORM_PATTERN_STYLES,
    `
      :host([hidden]) {
        display: none;
      }
      .submit[aria-disabled='true'] {
        opacity: var(--krn-opacity-disabled, 0.48);
        cursor: wait;
      }
      @media (forced-colors: active) {
        input,
        button {
          border-color: CanvasText;
        }
      }
      .sr-only {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        padding: 0;
        overflow: hidden;
        border: 0;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    `,
  ],
})
export class KrnLoginForm {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly instanceId = inject(KrnIdService).next('login-form');
  protected readonly emailId = `${this.instanceId}-email`;
  protected readonly emailErrorId = `${this.emailId}-error`;
  protected readonly passwordId = `${this.instanceId}-password`;
  protected readonly passwordErrorId = `${this.passwordId}-error`;
  readonly loading = input(false, { transform: booleanAttribute });
  readonly errorMessage = input('');
  readonly recoveryHref = input('');
  readonly submitLabel = input(this.translations.patterns.signIn);
  readonly emailLabel = input(this.translations.patterns.email);
  readonly emailErrorLabel = input(this.translations.patterns.invalidEmail);
  readonly passwordLabel = input(this.translations.patterns.password);
  readonly passwordErrorLabel = input(this.translations.patterns.minimumPasswordLength);
  readonly rememberLabel = input(this.translations.patterns.rememberMe);
  readonly recoveryLabel = input(this.translations.patterns.forgotPassword);
  readonly loadingLabel = input(this.translations.patterns.signingIn);
  readonly minimumPasswordLength = input(8, { transform: numberAttribute });
  readonly submitted = output<KrnLoginCredentials>();
  protected readonly resolvedMinimumPasswordLength = computed(() => {
    const minimum = this.minimumPasswordLength();
    if (!Number.isSafeInteger(minimum) || minimum < 1) {
      throw new Error('KrnLoginForm: minimumPasswordLength must be a positive safe integer.');
    }

    return minimum;
  });
  protected readonly resolvedSubmitLabel = computed(() =>
    this.requiredLabel(this.submitLabel(), this.translations.patterns.signIn, 'Sign in'),
  );
  protected readonly resolvedEmailLabel = computed(() =>
    this.requiredLabel(this.emailLabel(), this.translations.patterns.email, 'Email'),
  );
  protected readonly resolvedEmailErrorLabel = computed(() =>
    this.requiredLabel(
      this.emailErrorLabel(),
      this.translations.patterns.invalidEmail,
      'Enter a valid email address',
    ),
  );
  protected readonly resolvedPasswordLabel = computed(() =>
    this.requiredLabel(this.passwordLabel(), this.translations.patterns.password, 'Password'),
  );
  protected readonly resolvedPasswordErrorLabel = computed(() => {
    const minimum = this.resolvedMinimumPasswordLength();
    return this.requiredLabel(
      this.passwordErrorLabel()(minimum),
      this.translations.patterns.minimumPasswordLength(minimum),
      `Use at least ${minimum} characters`,
    );
  });
  protected readonly resolvedRememberLabel = computed(() =>
    this.requiredLabel(this.rememberLabel(), this.translations.patterns.rememberMe, 'Remember me'),
  );
  protected readonly resolvedRecoveryLabel = computed(() =>
    this.requiredLabel(
      this.recoveryLabel(),
      this.translations.patterns.forgotPassword,
      'Forgot password?',
    ),
  );
  protected readonly resolvedLoadingLabel = computed(() =>
    this.requiredLabel(this.loadingLabel(), this.translations.patterns.signingIn, 'Signing in'),
  );
  protected readonly resolvedRecoveryHref = computed(() => this.normalizeText(this.recoveryHref()));
  protected readonly resolvedErrorMessage = computed(() => this.normalizeText(this.errorMessage()));

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    remember: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(this.resolvedMinimumPasswordLength()),
      ]);
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    });
  }

  showError(control: 'email' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.submitted.emit(this.form.getRawValue());
  }

  private normalizeText(value: string): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requiredLabel(value: string, fallback: string, hardFallback: string): string {
    return this.normalizeText(value) || this.normalizeText(fallback) || hardFallback;
  }
}

@Component({
  selector: 'krn-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" [attr.aria-busy]="saving()" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label [for]="nameId">{{ resolvedNameLabel() }} <span aria-hidden="true">*</span></label>
        <input
          [id]="nameId"
          autocomplete="name"
          required
          formControlName="name"
          [attr.aria-invalid]="showNameError()"
          [attr.aria-describedby]="showNameError() ? nameErrorId : null"
        />
        @if (showNameError()) {
          <p class="error" [id]="nameErrorId" role="alert">{{ resolvedNameErrorLabel() }}</p>
        }
      </div>
      <div class="field">
        <label [for]="roleId">{{ resolvedRoleLabel() }}</label>
        <input [id]="roleId" autocomplete="organization-title" formControlName="role" />
      </div>
      <div class="field">
        <label [for]="bioId">{{ resolvedBioLabel() }}</label>
        <textarea
          [id]="bioId"
          formControlName="bio"
          [attr.aria-invalid]="showBioError()"
          [attr.aria-describedby]="showBioError() ? bioCountId + ' ' + bioErrorId : bioCountId"
          [attr.maxlength]="resolvedBioMaxLength()"
        ></textarea>
        <p class="hint" [id]="bioCountId">
          {{ form.controls.bio.value.length }} / {{ resolvedBioMaxLength() }}
        </p>
        @if (showBioError()) {
          <p class="error" [id]="bioErrorId" role="alert">{{ resolvedBioErrorLabel() }}</p>
        }
      </div>
      <div class="field">
        <label [for]="timezoneId">{{ resolvedTimezoneLabel() }}</label>
        <select
          [id]="timezoneId"
          required
          formControlName="timezone"
          [attr.aria-invalid]="showTimezoneError()"
          [attr.aria-describedby]="showTimezoneError() ? timezoneErrorId : null"
        >
          @for (timezone of resolvedTimezones(); track timezone.value) {
            <option [value]="timezone.value">{{ timezone.label }}</option>
          }
        </select>
        @if (showTimezoneError()) {
          <p class="error" [id]="timezoneErrorId" role="alert">
            {{ resolvedTimezoneErrorLabel() }}
          </p>
        }
      </div>
      <div class="row">
        <p class="hint status" role="status">
          {{ saving() ? resolvedSavingLabel() : form.dirty ? resolvedDirtyMessage() : '' }}
        </p>
        <button
          class="submit"
          type="submit"
          [attr.aria-disabled]="saving() || (!form.dirty && form.valid)"
        >
          {{ saving() ? resolvedSavingLabel() : resolvedSaveLabel() }}
        </button>
      </div>
    </form>
  `,
  styles: [
    FORM_PATTERN_STYLES,
    `
      :host([hidden]) {
        display: none;
      }
      .status {
        min-inline-size: 0;
        margin: 0;
        overflow-wrap: anywhere;
      }
      .submit[aria-disabled='true'] {
        opacity: var(--krn-opacity-disabled, 0.48);
      }
      @media (forced-colors: active) {
        input,
        textarea,
        select,
        button {
          border-color: CanvasText;
        }
      }
    `,
  ],
})
export class KrnProfileForm {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly instanceId = inject(KrnIdService).next('profile-form');
  protected readonly nameId = `${this.instanceId}-name`;
  protected readonly nameErrorId = `${this.nameId}-error`;
  protected readonly roleId = `${this.instanceId}-role`;
  protected readonly bioId = `${this.instanceId}-bio`;
  protected readonly bioCountId = `${this.bioId}-count`;
  protected readonly bioErrorId = `${this.bioId}-error`;
  protected readonly timezoneId = `${this.instanceId}-timezone`;
  protected readonly timezoneErrorId = `${this.timezoneId}-error`;
  readonly value = input<KrnProfileValue>({ name: '', role: '', bio: '', timezone: 'UTC' });
  readonly timezones = input<readonly { readonly value: string; readonly label: string }[]>(
    this.translations.patterns.profileTimezones,
  );
  readonly saving = input(false, { transform: booleanAttribute });
  readonly dirtyMessage = input(this.translations.patterns.unsavedChanges);
  readonly nameLabel = input(this.translations.patterns.displayName);
  readonly nameErrorLabel = input(this.translations.patterns.displayNameRequired);
  readonly roleLabel = input(this.translations.patterns.role);
  readonly bioLabel = input(this.translations.patterns.bio);
  readonly bioErrorLabel = input(this.translations.patterns.bioMaximumLength);
  readonly bioMaxLength = input(280, { transform: numberAttribute });
  readonly timezoneLabel = input(this.translations.patterns.timezone);
  readonly timezoneErrorLabel = input(this.translations.patterns.timezoneUnavailable);
  readonly savingLabel = input(this.translations.patterns.saving);
  readonly saveLabel = input(this.translations.patterns.saveProfile);
  readonly saved = output<KrnProfileValue>();
  protected readonly resolvedBioMaxLength = computed(() => {
    const maximum = this.bioMaxLength();
    if (!Number.isSafeInteger(maximum) || maximum < 0) {
      throw new Error('KrnProfileForm: bioMaxLength must be a non-negative safe integer.');
    }

    return maximum;
  });
  protected readonly resolvedTimezones = computed(() => {
    const timezones = this.timezones();
    if (!Array.isArray(timezones) || timezones.length === 0) {
      throw new Error('KrnProfileForm: timezones must contain at least one option.');
    }

    const values = new Set<string>();
    return timezones.map((timezone) => {
      const value = this.normalizeText(timezone?.value);
      const label = this.normalizeText(timezone?.label);
      if (!value || !label || values.has(value)) {
        throw new Error(
          'KrnProfileForm: timezones must use non-empty unique values and non-empty labels.',
        );
      }

      values.add(value);
      return { value, label } as const;
    });
  });
  protected readonly resolvedDirtyMessage = computed(() =>
    this.requiredLabel(
      this.dirtyMessage(),
      this.translations.patterns.unsavedChanges,
      'Unsaved changes',
    ),
  );
  protected readonly resolvedNameLabel = computed(() =>
    this.requiredLabel(this.nameLabel(), this.translations.patterns.displayName, 'Display name'),
  );
  protected readonly resolvedNameErrorLabel = computed(() =>
    this.requiredLabel(
      this.nameErrorLabel(),
      this.translations.patterns.displayNameRequired,
      'Display name is required',
    ),
  );
  protected readonly resolvedRoleLabel = computed(() =>
    this.requiredLabel(this.roleLabel(), this.translations.patterns.role, 'Role'),
  );
  protected readonly resolvedBioLabel = computed(() =>
    this.requiredLabel(this.bioLabel(), this.translations.patterns.bio, 'Biography'),
  );
  protected readonly resolvedBioErrorLabel = computed(() => {
    const maximum = this.resolvedBioMaxLength();
    return this.requiredLabel(
      this.bioErrorLabel()(maximum),
      this.translations.patterns.bioMaximumLength(maximum),
      `Biography must contain at most ${maximum} characters`,
    );
  });
  protected readonly resolvedTimezoneLabel = computed(() =>
    this.requiredLabel(this.timezoneLabel(), this.translations.patterns.timezone, 'Timezone'),
  );
  protected readonly resolvedTimezoneErrorLabel = computed(() =>
    this.requiredLabel(
      this.timezoneErrorLabel(),
      this.translations.patterns.timezoneUnavailable,
      'Select an available timezone',
    ),
  );
  protected readonly resolvedSavingLabel = computed(() =>
    this.requiredLabel(this.savingLabel(), this.translations.patterns.saving, 'Saving'),
  );
  protected readonly resolvedSaveLabel = computed(() =>
    this.requiredLabel(this.saveLabel(), this.translations.patterns.saveProfile, 'Save profile'),
  );
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    role: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(280)] }),
    timezone: new FormControl('UTC', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const value = this.value();
      this.form.reset(
        { ...value, timezone: this.normalizeText(value.timezone) },
        { emitEvent: false },
      );
      this.form.markAsPristine();
    });
    effect(() => {
      this.form.controls.bio.setValidators([Validators.maxLength(this.resolvedBioMaxLength())]);
      this.form.controls.bio.updateValueAndValidity({ emitEvent: false });
    });
    effect(() => {
      const values = new Set(this.resolvedTimezones().map(({ value }) => value));
      this.form.controls.timezone.setValidators([
        Validators.required,
        (control) => (values.has(control.value) ? null : { unavailable: true }),
      ]);
      this.form.controls.timezone.updateValueAndValidity({ emitEvent: false });
    });
  }

  showNameError(): boolean {
    const control = this.form.controls.name;
    return control.invalid && (control.touched || control.dirty);
  }

  showBioError(): boolean {
    return this.form.controls.bio.hasError('maxlength');
  }

  showTimezoneError(): boolean {
    return (
      this.form.controls.timezone.hasError('required') ||
      this.form.controls.timezone.hasError('unavailable')
    );
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving() || !this.form.dirty) return;
    this.saved.emit(this.form.getRawValue());
  }

  private normalizeText(value: string): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requiredLabel(value: string, fallback: string, hardFallback: string): string {
    return this.normalizeText(value) || this.normalizeText(fallback) || hardFallback;
  }
}

@Component({
  selector: 'krn-multi-step-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[style.--krn-step-count]': 'validatedSteps().length',
  },
  template: `
    <nav [attr.aria-label]="resolvedAriaLabel()">
      <ol>
        @for (step of validatedSteps(); track step.id; let index = $index) {
          <li
            [attr.data-current]="index === current() ? '' : null"
            [attr.data-complete]="isStepComplete(step, index) ? '' : null"
          >
            <button
              type="button"
              [attr.aria-disabled]="!canNavigateTo(index)"
              [attr.tabindex]="canNavigateTo(index) ? null : -1"
              [attr.aria-current]="index === current() ? 'step' : null"
              (click)="goTo(index)"
            >
              <span aria-hidden="true">{{ isStepComplete(step, index) ? '✓' : index + 1 }}</span>
              <span>
                <strong>{{ step.label }}</strong>
                @if (step.description) {
                  <small>{{ step.description }}</small>
                }
              </span>
              @if (step.optional) {
                <em>{{ resolvedOptionalLabel() }}</em>
              }
            </button>
          </li>
        }
      </ol>
    </nav>
    <section role="group" [attr.aria-labelledby]="currentStepLabelId()">
      <h2 #stepHeading [id]="currentStepLabelId()" class="sr-only" tabindex="-1">
        {{ currentStep().label }}
      </h2>
      <ng-content />
    </section>
    <footer>
      <button
        type="button"
        class="secondary"
        [attr.aria-disabled]="current() === 0"
        (click)="previous()"
      >
        {{ resolvedBackLabel() }}
      </button>
      <span aria-live="polite">{{ resolvedStepCounterLabel() }}</span>
      @if (current() < validatedSteps().length - 1) {
        <button
          type="button"
          class="primary"
          [attr.aria-disabled]="currentStep().valid === false"
          (click)="next()"
        >
          {{ resolvedContinueLabel() }}
        </button>
      } @else {
        <button
          type="button"
          class="primary"
          [attr.aria-disabled]="currentStep().valid === false"
          (click)="complete()"
        >
          {{ resolvedCompleteLabel() }}
        </button>
      }
    </footer>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--krn-space-6, 1.5rem);
      color: var(--krn-color-text, #252932);
      container-type: inline-size;
    }
    :host([hidden]) {
      display: none;
    }
    ol {
      display: grid;
      grid-template-columns: repeat(var(--krn-step-count, 4), minmax(0, 1fr));
      gap: 1px;
      margin: 0;
      padding: 0;
      overflow: clip;
      border: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      border-radius: var(--krn-radius-surface, 0.75rem);
      background: var(--krn-color-border-subtle, #e0e3e7);
      list-style: none;
    }
    li {
      background: var(--krn-color-surface, #fff);
    }
    li[data-current] {
      box-shadow: inset 0 3px 0 var(--krn-color-brand-solid, #4f6feb);
      background: var(--krn-color-brand-surface, #fff0e8);
    }
    li[data-complete] {
      background: var(--krn-color-success-surface, #e8f8f0);
    }
    li button {
      display: grid;
      inline-size: 100%;
      min-block-size: 4rem;
      grid-template-columns: 1.5rem minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem;
      border: 0;
      color: inherit;
      background: transparent;
      font: inherit;
      text-align: start;
      overflow-wrap: anywhere;
    }
    li button > span:first-child {
      display: grid;
      inline-size: 1.5rem;
      block-size: 1.5rem;
      place-items: center;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: 50%;
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
    }
    li button > span:nth-child(2) {
      display: grid;
    }
    li small,
    li em {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.6875rem;
      font-style: normal;
    }
    section {
      min-block-size: 12rem;
    }
    footer {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 1rem;
      padding-block-start: 1rem;
      border-block-start: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.8125rem;
      text-align: center;
    }
    footer button {
      min-block-size: var(--krn-control-size, 2.5rem);
      padding-inline: 1rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: var(--krn-radius-control, 0.375rem);
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    footer .secondary {
      justify-self: start;
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface, #fff);
    }
    footer .primary {
      justify-self: end;
      border-color: var(--krn-color-brand-solid, #4f6feb);
      color: var(--krn-color-on-brand, #fff);
      background: var(--krn-color-brand-solid, #4f6feb);
    }
    footer button:focus-visible,
    li button:focus-visible {
      outline: var(--krn-focus-ring, 2px solid #4f6feb);
      outline-offset: 2px;
    }
    footer button[aria-disabled='true'],
    li button[aria-disabled='true'] {
      opacity: var(--krn-opacity-disabled, 0.48);
      cursor: not-allowed;
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    @container (max-width: 42rem) {
      ol {
        grid-template-columns: 1fr;
      }
      :host(:not([data-orientation='vertical'])) li:not([data-current]) button > span:nth-child(2),
      :host(:not([data-orientation='vertical'])) li:not([data-current]) em {
        display: none;
      }
      :host(:not([data-orientation='vertical'])) li:not([data-current]) {
        display: none;
      }
    }
    :host([data-orientation='vertical']) ol {
      grid-template-columns: 1fr;
    }
    @media (forced-colors: active) {
      ol,
      footer,
      footer button,
      li button > span:first-child {
        border-color: CanvasText;
      }
    }
  `,
})
export class KrnMultiStepForm {
  private readonly ids = inject(KrnIdService);
  private readonly injector = inject(Injector);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly instanceId = this.ids.next('multi-step-form');
  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');
  readonly steps = input.required<readonly KrnFormStep[]>();
  readonly current = model(0);
  readonly furthestStep = model(0);
  readonly allowStepNavigation = input(true, { transform: booleanAttribute });
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly completeLabel = input(this.translations.patterns.complete);
  readonly ariaLabel = input(this.translations.patterns.formProgress);
  readonly optionalLabel = input(this.translations.patterns.optional);
  readonly backLabel = input(this.translations.patterns.back);
  readonly continueLabel = input(this.translations.patterns.continue);
  readonly stepCounterLabel = input(this.translations.patterns.stepCounter);
  readonly completed = output<void>();
  protected readonly validatedSteps = computed(() => {
    const steps = this.steps();
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('KrnMultiStepForm: steps must contain at least one step.');
    }

    const ids = new Set<string>();
    return steps.map((step) => {
      const id = this.normalizeText(step?.id);
      const label = this.normalizeText(step?.label);
      if (!id || !label || ids.has(id)) {
        throw new Error(
          'KrnMultiStepForm: steps must use non-empty unique ids and non-empty labels.',
        );
      }
      if (
        (step.optional !== undefined && typeof step.optional !== 'boolean') ||
        (step.valid !== undefined && typeof step.valid !== 'boolean')
      ) {
        throw new Error('KrnMultiStepForm: optional and valid step states must be boolean.');
      }

      ids.add(id);
      return {
        ...step,
        id,
        label,
        description: this.normalizeText(step.description ?? '') || undefined,
      };
    });
  });
  protected readonly resolvedOrientation = computed(() => {
    const orientation = this.orientation();
    if (orientation !== 'horizontal' && orientation !== 'vertical') {
      throw new Error('KrnMultiStepForm: orientation must be horizontal or vertical.');
    }

    return orientation;
  });
  protected readonly resolvedCompleteLabel = computed(() =>
    this.requiredLabel(this.completeLabel(), this.translations.patterns.complete, 'Complete'),
  );
  protected readonly resolvedAriaLabel = computed(() =>
    this.requiredLabel(this.ariaLabel(), this.translations.patterns.formProgress, 'Form progress'),
  );
  protected readonly resolvedOptionalLabel = computed(() =>
    this.requiredLabel(this.optionalLabel(), this.translations.patterns.optional, 'Optional'),
  );
  protected readonly resolvedBackLabel = computed(() =>
    this.requiredLabel(this.backLabel(), this.translations.patterns.back, 'Back'),
  );
  protected readonly resolvedContinueLabel = computed(() =>
    this.requiredLabel(this.continueLabel(), this.translations.patterns.continue, 'Continue'),
  );
  protected readonly currentStep = computed(() => {
    const steps = this.validatedSteps();
    return steps[this.clampIndex(this.current(), steps.length)]!;
  });
  protected readonly currentStepLabelId = computed(() =>
    this.ids.fromKey(this.instanceId, this.currentStep().id),
  );
  protected readonly resolvedStepCounterLabel = computed(() => {
    const total = this.validatedSteps().length;
    const current = this.clampIndex(this.current(), total) + 1;
    return this.requiredLabel(
      this.stepCounterLabel()(current, total),
      this.translations.patterns.stepCounter(current, total),
      `Step ${current} of ${total}`,
    );
  });

  constructor() {
    effect(() => {
      const length = this.validatedSteps().length;
      const current = this.clampIndex(this.current(), length);
      const furthest = Math.max(current, this.clampIndex(this.furthestStep(), length));
      if (current !== this.current()) {
        this.current.set(current);
      }
      if (furthest !== this.furthestStep()) {
        this.furthestStep.set(furthest);
      }
    });
  }

  protected canNavigateTo(index: number): boolean {
    return (
      this.allowStepNavigation() &&
      Number.isSafeInteger(index) &&
      index >= 0 &&
      index <= this.furthestStep() &&
      index < this.validatedSteps().length
    );
  }

  protected isStepComplete(step: KrnFormStep, index: number): boolean {
    return step.valid === true && index <= this.furthestStep() && index !== this.current();
  }

  goTo(index: number): void {
    if (!this.canNavigateTo(index)) return;
    this.moveTo(index);
  }

  next(): void {
    if (this.currentStep().valid === false) return;
    const next = Math.min(this.validatedSteps().length - 1, this.current() + 1);
    this.furthestStep.update((value) => Math.max(value, next));
    this.moveTo(next);
  }

  previous(): void {
    if (this.current() === 0) return;
    const previous = Math.max(0, this.current() - 1);
    this.moveTo(previous);
  }

  complete(): void {
    if (this.currentStep().valid === false) return;
    this.completed.emit();
  }

  private moveTo(index: number): void {
    if (index === this.current()) return;
    this.current.set(index);
    afterNextRender(
      { write: () => this.stepHeading()?.nativeElement.focus({ preventScroll: true }) },
      { injector: this.injector },
    );
  }

  private clampIndex(value: number, length: number): number {
    return Number.isSafeInteger(value) ? Math.max(0, Math.min(length - 1, value)) : 0;
  }

  private normalizeText(value: string): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requiredLabel(value: string, fallback: string, hardFallback: string): string {
    return this.normalizeText(value) || this.normalizeText(fallback) || hardFallback;
  }
}
