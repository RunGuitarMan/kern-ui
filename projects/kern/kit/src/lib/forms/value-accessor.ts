import type { Provider, Signal, WritableSignal } from '@angular/core';
import {
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  InjectionToken,
  isDevMode,
  signal,
  untracked,
} from '@angular/core';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import type { KrnFormFieldController } from './form-field';
import { KRN_FORM_FIELD, createKrnId } from './form-field';

interface KrnAngularControlState {
  control: AbstractControl | null;
  readonly invalid: WritableSignal<boolean>;
  readonly required: WritableSignal<boolean>;
  readonly disabled: WritableSignal<boolean>;
  readonly pending: WritableSignal<boolean>;
  readonly valid: WritableSignal<boolean>;
  readonly touched: WritableSignal<boolean>;
  readonly dirty: WritableSignal<boolean>;
  eventSubscription: { unsubscribe(): void } | null;
}

type KrnFormValueOwner = 'angular' | 'internal' | 'standalone';

interface KrnFormControlOptions<T, TControl = T> {
  readonly fromControlValue?: (value: TControl | null | undefined) => T;
  readonly toControlValue?: (value: T) => TControl;
  readonly normalizeIncomingValue?: (value: unknown) => T;
  readonly normalizeStandaloneValue?: (value: T) => T;
  readonly validateValue?: (value: unknown) => ValidationErrors | null;
  readonly valuesEqual?: (current: T, next: T) => boolean;
  readonly onAngularWrite?: (value: T) => void;
}

/**
 * Component-owned form state. Angular Forms talks to the adapter registered by
 * `provideKrnFormControl`; controls use this object only for view state and user commits.
 *
 * @internal
 */
interface KrnFormControlState<T, TControl = T> extends ControlValueAccessor, Validator {
  readonly controlValue: WritableSignal<T>;
  readonly formDisabled: WritableSignal<boolean>;
  readonly valueOwner: Signal<KrnFormValueOwner>;
  writeValue(value: unknown): void;
  registerOnChange(fn: (value: TControl) => void): void;
  registerOnTouched(fn: () => void): void;
  setDisabledState(disabled: boolean): void;
  registerOnValidatorChange(fn: () => void): void;
  bindStandaloneValue(value: Signal<T | undefined>): void;
  watchValidationInputs(...dependencies: readonly Signal<unknown>[]): void;
  commitValue(value: T): void;
  commitUserValue(value: T): boolean;
  touch(): void;
}

const KRN_FORM_CONTROL_ADAPTER = new InjectionToken<KrnFormControlAdapter<unknown, unknown>>(
  'KRN_FORM_CONTROL_ADAPTER',
);

/**
 * Installs the Angular Forms adapter required by Kern's experimental form-control variant bases.
 *
 * Add the returned providers to a component that extends `KrnEditableComboboxBase` or
 * `KrnUploadBase`. The adapter remains component-scoped and is shared by `NG_VALUE_ACCESSOR` and
 * `NG_VALIDATORS` without making the component inherit form-state machinery.
 *
 * @publicApi
 * @experimental The custom-control extension contract may change before Kern 1.0.
 */
export function provideKrnFormControl(): Provider[] {
  return [
    {
      provide: KRN_FORM_CONTROL_ADAPTER,
      useClass: KrnFormControlAdapter,
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: KRN_FORM_CONTROL_ADAPTER,
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: KRN_FORM_CONTROL_ADAPTER,
      multi: true,
    },
  ];
}

class KrnFormControlAdapter<T, TControl = T> implements ControlValueAccessor, Validator {
  readonly #destroyRef = inject(DestroyRef);
  readonly controlValue = signal<T>(undefined as T);
  readonly formDisabled = signal(false);
  readonly angularState: KrnAngularControlState = {
    control: null,
    invalid: signal(false),
    required: signal(false),
    disabled: signal(false),
    pending: signal(false),
    valid: signal(false),
    touched: signal(false),
    dirty: signal(false),
    eventSubscription: null,
  };
  readonly #valueOwnerState = signal<KrnFormValueOwner>('internal');
  #initialValue!: T;
  #options: KrnFormControlOptions<T, TControl> = {};
  #onChange: (value: TControl) => void = () => undefined;
  #onTouched: () => void = () => undefined;
  #onValidatorChange: () => void = () => undefined;
  #mixedOwnershipReported = false;

  constructor() {
    this.#destroyRef.onDestroy(() => this.angularState.eventSubscription?.unsubscribe());
  }

  configure(
    _owner: object,
    initialValue: T,
    options: KrnFormControlOptions<T, TControl>,
  ): KrnFormControlState<T, TControl> {
    this.#initialValue = initialValue;
    this.#options = options;
    this.controlValue.set(initialValue);

    return this as KrnFormControlAdapter<T, TControl>;
  }

  get valueOwner(): Signal<KrnFormValueOwner> {
    return this.#valueOwnerState.asReadonly();
  }

  writeValue = (value: unknown): void => {
    this.#claimAngularOwnership();
    const normalized = this.#fromControlValue(value as TControl | null | undefined);
    this.controlValue.set(normalized);
    this.#options.onAngularWrite?.(normalized);
  };

  registerOnChange = (fn: (value: TControl) => void): void => {
    this.#claimAngularOwnership();
    this.#onChange = fn;
  };

  registerOnTouched = (fn: () => void): void => {
    this.#claimAngularOwnership();
    this.#onTouched = fn;
  };

  setDisabledState = (disabled: boolean): void => {
    this.#claimAngularOwnership();
    this.formDisabled.set(disabled);
  };

  validate = (control: AbstractControl): ValidationErrors | null => {
    const state = this.#bindAngularControl(control);
    const errors = this.#options.validateValue?.(control.value) ?? null;
    state.invalid.set(Boolean(control.invalid || errors));
    return errors;
  };

  registerOnValidatorChange = (fn: () => void): void => {
    this.#onValidatorChange = fn;
  };

  bindStandaloneValue = (value: Signal<T | undefined>): void => {
    effect(() => {
      const next = value();
      if (next === undefined) {
        return;
      }

      const owner = untracked(this.#valueOwnerState);
      if (owner === 'angular') {
        this.#reportMixedOwnership();
        return;
      }

      if (owner !== 'standalone') {
        this.#valueOwnerState.set('standalone');
      }
      this.controlValue.set(this.#normalizeStandaloneValue(next));
    });
  };

  watchValidationInputs = (...dependencies: readonly Signal<unknown>[]): void => {
    effect(() => {
      for (const dependency of dependencies) {
        dependency();
      }
      this.#onValidatorChange();
    });
  };

  commitValue = (value: T): void => {
    this.controlValue.set(value);
    this.#onChange(this.#toControlValue(value));
  };

  commitUserValue = (value: T): boolean => {
    if (this.#valuesEqual(this.controlValue(), value)) {
      return false;
    }

    this.controlValue.set(value);
    this.#onChange(this.#toControlValue(value));
    return true;
  };

  touch = (): void => {
    this.#onTouched();
  };

  #fromControlValue(value: TControl | null | undefined): T {
    return this.#options.fromControlValue
      ? this.#options.fromControlValue(value)
      : this.#normalizeIncomingValue(value);
  }

  #toControlValue(value: T): TControl {
    return this.#options.toControlValue
      ? this.#options.toControlValue(value)
      : (value as unknown as TControl);
  }

  #normalizeIncomingValue(value: unknown): T {
    return this.#options.normalizeIncomingValue
      ? this.#options.normalizeIncomingValue(value)
      : ((value ?? this.#initialValue) as T);
  }

  #normalizeStandaloneValue(value: T): T {
    return this.#options.normalizeStandaloneValue
      ? this.#options.normalizeStandaloneValue(value)
      : this.#normalizeIncomingValue(value);
  }

  #valuesEqual(current: T, next: T): boolean {
    return this.#options.valuesEqual?.(current, next) ?? Object.is(current, next);
  }

  #bindAngularControl(control: AbstractControl): KrnAngularControlState {
    const state = this.angularState;
    if (state.control !== control) {
      state.eventSubscription?.unsubscribe();
      state.control = control;
      state.eventSubscription = (control.events ?? control.statusChanges).subscribe(() => {
        this.#syncAngularControlState(control, state);
      });
    }
    this.#syncAngularControlState(control, state);
    return state;
  }

  #syncAngularControlState(control: AbstractControl, state: KrnAngularControlState): void {
    if (state.control !== control) {
      return;
    }
    state.invalid.set(Boolean(control.invalid));
    state.disabled.set(control.disabled);
    state.pending.set(control.pending);
    state.valid.set(control.valid);
    state.touched.set(control.touched);
    state.dirty.set(control.dirty);
    state.required.set(
      control.hasValidator(Validators.required) || control.hasValidator(Validators.requiredTrue),
    );
  }

  #claimAngularOwnership(): void {
    const owner = this.#valueOwnerState();
    if (owner === 'standalone') {
      this.#reportMixedOwnership();
    }
    if (owner !== 'angular') {
      this.#valueOwnerState.set('angular');
    }
  }

  #reportMixedOwnership(): void {
    if (!isDevMode() || this.#mixedOwnershipReported) {
      return;
    }
    this.#mixedOwnershipReported = true;
    console.warn(
      'KERN form control received both a standalone value binding and Angular Forms. ' +
        'Angular Forms owns the value; standalone writes are ignored.',
    );
  }
}

/** @internal */
export function useKrnFormControl<T, TControl = T>(
  owner: object,
  initialValue: T,
  options: KrnFormControlOptions<T, TControl> = {},
): KrnFormControlState<T, TControl> {
  return (
    inject(KRN_FORM_CONTROL_ADAPTER, { self: true }) as KrnFormControlAdapter<T, TControl>
  ).configure(owner, initialValue, options);
}

export interface KrnControlA11y {
  readonly id: Signal<string>;
  readonly describedBy: Signal<string | null>;
  readonly labelledBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly isFormFieldControl: Signal<boolean>;
  readonly field: KrnFormFieldController | null;
}

export interface KrnControlStateInputs {
  readonly required?: Signal<boolean>;
  readonly disabled?: Signal<boolean>;
  readonly readOnly?: Signal<boolean>;
  readonly inheritField?: boolean;
  readonly labelStrategy?: 'native' | 'group';
}

export function useKrnControlA11y(
  _owner: object,
  explicitId: Signal<string>,
  ownInvalid: Signal<boolean>,
  prefix: string,
  state: KrnControlStateInputs = {},
): KrnControlA11y {
  const injectedField = inject(KRN_FORM_FIELD, { optional: true });
  const field = state.inheritField === false ? null : injectedField;
  const generatedId = createKrnId(prefix);
  const destroyRef = inject(DestroyRef);
  const elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  const angular = (
    inject(KRN_FORM_CONTROL_ADAPTER, { self: true }) as KrnFormControlAdapter<unknown, unknown>
  ).angularState;
  const controlRequired = computed(() => Boolean(state.required?.() || angular.required()));
  const controlDisabled = computed(() => Boolean(state.disabled?.() || angular.disabled()));
  const controlReadOnly = computed(() => Boolean(state.readOnly?.()));
  const controlInteracted = computed(() => angular.touched() || angular.dirty());
  const controlInvalid = computed(
    () => !controlDisabled() && (ownInvalid() || (angular.invalid() && controlInteracted())),
  );
  const id = computed(() => explicitId() || generatedId);
  const registration = {
    element: elementRef.nativeElement,
    id,
    labelStrategy: state.labelStrategy ?? 'native',
    invalid: controlInvalid,
    required: controlRequired,
    disabled: controlDisabled,
    readOnly: controlReadOnly,
    pending: angular.pending,
    valid: angular.valid,
    touched: angular.touched,
    dirty: angular.dirty,
  } as const;
  const isFormFieldControl = computed(() => (field ? field.isPrimaryControl(registration) : false));

  if (field) {
    destroyRef.onDestroy(field.registerControl(registration));
  }

  return {
    id,
    describedBy: computed(() => (isFormFieldControl() ? field?.describedBy() || null : null)),
    labelledBy: computed(() => (isFormFieldControl() ? field?.labelledBy() || null : null)),
    invalid: computed(
      () => controlInvalid() || (isFormFieldControl() && Boolean(field?.invalid())),
    ),
    required: controlRequired,
    disabled: controlDisabled,
    readOnly: controlReadOnly,
    isFormFieldControl,
    field,
  };
}

export const requiredError = (value: unknown, required: boolean): ValidationErrors | null => {
  if (!required) {
    return null;
  }
  const empty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);
  return empty ? { required: true } : null;
};

export const requiredTrueError = (value: unknown, required: boolean): ValidationErrors | null =>
  required && value !== true ? { required: true } : null;

export const minLengthError = (
  value: unknown,
  requiredLength: number | undefined,
): ValidationErrors | null => {
  if (requiredLength === undefined || value === null || value === undefined || value === '') {
    return null;
  }
  const actualLength = typeof value === 'string' || Array.isArray(value) ? value.length : 0;
  return actualLength < requiredLength ? { minlength: { requiredLength, actualLength } } : null;
};

export const maxLengthError = (
  value: unknown,
  requiredLength: number | undefined,
): ValidationErrors | null => {
  if (requiredLength === undefined || value === null || value === undefined) {
    return null;
  }
  const actualLength = typeof value === 'string' || Array.isArray(value) ? value.length : 0;
  return actualLength > requiredLength ? { maxlength: { requiredLength, actualLength } } : null;
};

export const minError = (value: unknown, minimum: number | undefined): ValidationErrors | null => {
  if (minimum === undefined || value === null || value === undefined || value === '') {
    return null;
  }
  const actual = Number(value);
  return Number.isFinite(actual) && actual < minimum ? { min: { min: minimum, actual } } : null;
};

export const maxError = (value: unknown, maximum: number | undefined): ValidationErrors | null => {
  if (maximum === undefined || value === null || value === undefined || value === '') {
    return null;
  }
  const actual = Number(value);
  return Number.isFinite(actual) && actual > maximum ? { max: { max: maximum, actual } } : null;
};

export const mergeValidationErrors = (
  ...errors: readonly (ValidationErrors | null)[]
): ValidationErrors | null => {
  const merged = Object.assign({}, ...errors.filter((error) => error !== null));
  return Object.keys(merged).length > 0 ? merged : null;
};
