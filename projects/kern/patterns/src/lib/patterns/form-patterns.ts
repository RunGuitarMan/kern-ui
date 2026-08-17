import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
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

@Component({
  selector: 'krn-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
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
  readonly submitLabel = input<typeof this.translations.patterns.signIn | undefined>();
  readonly emailLabel = input<typeof this.translations.patterns.email | undefined>();
  readonly emailErrorLabel = input<typeof this.translations.patterns.invalidEmail | undefined>();
  readonly passwordLabel = input<typeof this.translations.patterns.password | undefined>();
  readonly passwordErrorLabel = input<
    typeof this.translations.patterns.minimumPasswordLength | undefined
  >();
  readonly rememberLabel = input<typeof this.translations.patterns.rememberMe | undefined>();
  readonly recoveryLabel = input<typeof this.translations.patterns.forgotPassword | undefined>();
  readonly loadingLabel = input<typeof this.translations.patterns.signingIn | undefined>();
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
      this.passwordErrorLabel()?.(minimum),
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

  private normalizeText(value: string | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    return this.normalizeText(value) || this.normalizeText(fallback) || hardFallback;
  }
}

@Component({
  selector: 'krn-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.css',
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
  readonly timezones = input<
    readonly { readonly value: string; readonly label: string }[] | undefined
  >();
  readonly saving = input(false, { transform: booleanAttribute });
  readonly dirtyMessage = input<typeof this.translations.patterns.unsavedChanges | undefined>();
  readonly nameLabel = input<typeof this.translations.patterns.displayName | undefined>();
  readonly nameErrorLabel = input<
    typeof this.translations.patterns.displayNameRequired | undefined
  >();
  readonly roleLabel = input<typeof this.translations.patterns.role | undefined>();
  readonly bioLabel = input<typeof this.translations.patterns.bio | undefined>();
  readonly bioErrorLabel = input<typeof this.translations.patterns.bioMaximumLength | undefined>();
  readonly bioMaxLength = input(280, { transform: numberAttribute });
  readonly timezoneLabel = input<typeof this.translations.patterns.timezone | undefined>();
  readonly timezoneErrorLabel = input<
    typeof this.translations.patterns.timezoneUnavailable | undefined
  >();
  readonly savingLabel = input<typeof this.translations.patterns.saving | undefined>();
  readonly saveLabel = input<typeof this.translations.patterns.saveProfile | undefined>();
  readonly saved = output<KrnProfileValue>();
  protected readonly resolvedBioMaxLength = computed(() => {
    const maximum = this.bioMaxLength();
    if (!Number.isSafeInteger(maximum) || maximum < 0) {
      throw new Error('KrnProfileForm: bioMaxLength must be a non-negative safe integer.');
    }

    return maximum;
  });
  protected readonly resolvedTimezones = computed(() => {
    const timezones = this.timezones() ?? this.translations.patterns.profileTimezones;
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
      this.bioErrorLabel()?.(maximum),
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

  private normalizeText(value: string | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
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
  templateUrl: './multi-step-form.html',
  styleUrl: './multi-step-form.css',
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
  readonly completeLabel = input<typeof this.translations.patterns.complete | undefined>();
  readonly ariaLabel = input<typeof this.translations.patterns.formProgress | undefined>();
  readonly optionalLabel = input<typeof this.translations.patterns.optional | undefined>();
  readonly backLabel = input<typeof this.translations.patterns.back | undefined>();
  readonly continueLabel = input<typeof this.translations.patterns.continue | undefined>();
  readonly stepCounterLabel = input<typeof this.translations.patterns.stepCounter | undefined>();
  readonly completed = output<void>();
  protected readonly validatedSteps = computed<readonly KrnFormStep[]>(() => {
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
  protected readonly currentStep = computed<KrnFormStep>(() => {
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
      this.stepCounterLabel()?.(current, total),
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

  private normalizeText(value: string | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    return this.normalizeText(value) || this.normalizeText(fallback) || hardFallback;
  }
}
