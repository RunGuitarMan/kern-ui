import { ChangeDetectionStrategy, Component, effect, input, model, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="krn-login-email">Email <span aria-hidden="true">*</span></label>
        <input
          id="krn-login-email"
          type="email"
          inputmode="email"
          autocomplete="email"
          formControlName="email"
          [attr.aria-invalid]="showError('email')"
          aria-describedby="krn-login-email-error"
        />
        @if (showError('email')) {
          <p class="error" id="krn-login-email-error" role="alert">Enter a valid email address.</p>
        }
      </div>
      <div class="field">
        <label for="krn-login-password">Password <span aria-hidden="true">*</span></label>
        <input
          id="krn-login-password"
          type="password"
          autocomplete="current-password"
          formControlName="password"
          [attr.aria-invalid]="showError('password')"
          aria-describedby="krn-login-password-error"
        />
        @if (showError('password')) {
          <p class="error" id="krn-login-password-error" role="alert">
            Password must contain at least {{ minimumPasswordLength() }} characters.
          </p>
        }
      </div>
      <div class="row">
        <label class="check">
          <input type="checkbox" formControlName="remember" />
          Keep me signed in
        </label>
        @if (recoveryHref()) {
          <a [href]="recoveryHref()">Forgot password?</a>
        }
      </div>
      @if (errorMessage()) {
        <p class="error" role="alert">{{ errorMessage() }}</p>
      }
      <button class="submit" type="submit" [disabled]="loading() || form.invalid">
        @if (loading()) {
          <span aria-hidden="true">◌</span>
          Signing in…
        } @else {
          {{ submitLabel() }}
        }
      </button>
    </form>
  `,
  styles: [FORM_PATTERN_STYLES],
})
export class KrnLoginForm {
  readonly loading = input(false);
  readonly errorMessage = input('');
  readonly recoveryHref = input('');
  readonly submitLabel = input('Sign in');
  readonly minimumPasswordLength = input(8);
  readonly submitted = output<KrnLoginCredentials>();

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(this.minimumPasswordLength())],
    }),
    remember: new FormControl(false, { nonNullable: true }),
  });

  showError(control: 'email' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.submitted.emit(this.form.getRawValue());
  }
}

@Component({
  selector: 'krn-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="krn-profile-name">Display name <span aria-hidden="true">*</span></label>
        <input
          id="krn-profile-name"
          autocomplete="name"
          formControlName="name"
          [attr.aria-invalid]="form.controls.name.invalid && form.controls.name.touched"
        />
        @if (form.controls.name.invalid && form.controls.name.touched) {
          <p class="error" role="alert">Add a display name.</p>
        }
      </div>
      <div class="field">
        <label for="krn-profile-role">Role</label>
        <input id="krn-profile-role" autocomplete="organization-title" formControlName="role" />
      </div>
      <div class="field">
        <label for="krn-profile-bio">Bio</label>
        <textarea
          id="krn-profile-bio"
          formControlName="bio"
          [attr.aria-describedby]="'krn-profile-bio-count'"
          maxlength="280"
        ></textarea>
        <p class="hint" id="krn-profile-bio-count">{{ form.controls.bio.value.length }} / 280</p>
      </div>
      <div class="field">
        <label for="krn-profile-timezone">Timezone</label>
        <select id="krn-profile-timezone" formControlName="timezone">
          @for (timezone of timezones(); track timezone.value) {
            <option [value]="timezone.value">{{ timezone.label }}</option>
          }
        </select>
      </div>
      <div class="row">
        @if (dirtyMessage() && form.dirty) {
          <p class="hint" role="status">{{ dirtyMessage() }}</p>
        } @else {
          <span></span>
        }
        <button class="submit" type="submit" [disabled]="saving() || form.invalid || !form.dirty">
          {{ saving() ? 'Saving…' : 'Save profile' }}
        </button>
      </div>
    </form>
  `,
  styles: [FORM_PATTERN_STYLES],
})
export class KrnProfileForm {
  readonly value = input<KrnProfileValue>({ name: '', role: '', bio: '', timezone: 'UTC' });
  readonly timezones = input<readonly { readonly value: string; readonly label: string }[]>([
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
    { value: 'America/New_York', label: 'New York (ET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  ]);
  readonly saving = input(false);
  readonly dirtyMessage = input('Unsaved changes');
  readonly saved = output<KrnProfileValue>();
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(280)] }),
    timezone: new FormControl('UTC', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      this.form.reset(this.value(), { emitEvent: false });
      this.form.markAsPristine();
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saved.emit(this.form.getRawValue());
    this.form.markAsPristine();
  }
}

@Component({
  selector: 'krn-multi-step-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-orientation]': 'orientation()',
  },
  template: `
    <nav aria-label="Form progress">
      <ol>
        @for (step of steps(); track step.id; let index = $index) {
          <li
            [attr.data-current]="index === current() ? '' : null"
            [attr.data-complete]="index < current() ? '' : null"
          >
            <button
              type="button"
              [disabled]="!allowStepNavigation() || index > furthestStep()"
              [attr.aria-current]="index === current() ? 'step' : null"
              (click)="goTo(index)"
            >
              <span>{{ index < current() ? '✓' : index + 1 }}</span>
              <span>
                <strong>{{ step.label }}</strong>
                @if (step.description) {
                  <small>{{ step.description }}</small>
                }
              </span>
              @if (step.optional) {
                <em>Optional</em>
              }
            </button>
          </li>
        }
      </ol>
    </nav>
    <section role="group" [attr.aria-labelledby]="'krn-step-label-' + currentStep().id">
      <h2 [id]="'krn-step-label-' + currentStep().id" class="sr-only">{{ currentStep().label }}</h2>
      <ng-content />
    </section>
    <footer>
      <button type="button" class="secondary" [disabled]="current() === 0" (click)="previous()">Back</button>
      <span>Step {{ current() + 1 }} of {{ steps().length }}</span>
      @if (current() < steps().length - 1) {
        <button type="button" class="primary" [disabled]="currentStep().valid === false" (click)="next()">Continue</button>
      } @else {
        <button type="button" class="primary" [disabled]="currentStep().valid === false" (click)="completed.emit()">
          {{ completeLabel() }}
        </button>
      }
    </footer>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--krn-space-6, 1.5rem);
      color: var(--krn-color-text, #252932);
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
    footer button:disabled,
    li button:disabled {
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
      li:not([data-current]) button > span:nth-child(2),
      li:not([data-current]) em {
        display: none;
      }
      li:not([data-current]) {
        display: none;
      }
    }
  `,
})
export class KrnMultiStepForm {
  readonly steps = input.required<readonly KrnFormStep[]>();
  readonly current = model(0);
  readonly furthestStep = model(0);
  readonly allowStepNavigation = input(true);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly completeLabel = input('Complete');
  readonly completed = output<void>();
  readonly stepChanged = output<number>();
  readonly currentStep = (): KrnFormStep =>
    this.steps()[Math.max(0, Math.min(this.steps().length - 1, this.current()))] ?? {
      id: 'step',
      label: 'Step',
    };

  goTo(index: number): void {
    if (!this.allowStepNavigation() || index < 0 || index > this.furthestStep()) return;
    this.current.set(index);
    this.stepChanged.emit(index);
  }

  next(): void {
    if (this.currentStep().valid === false) return;
    const next = Math.min(this.steps().length - 1, this.current() + 1);
    this.current.set(next);
    this.furthestStep.update((value) => Math.max(value, next));
    this.stepChanged.emit(next);
  }

  previous(): void {
    const previous = Math.max(0, this.current() - 1);
    this.current.set(previous);
    this.stepChanged.emit(previous);
  }
}
