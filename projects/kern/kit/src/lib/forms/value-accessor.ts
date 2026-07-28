import type { Provider, Signal, Type, WritableSignal } from '@angular/core';
import { computed, DestroyRef, effect, forwardRef, inject, signal } from '@angular/core';
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
  statusSubscription: { unsubscribe(): void } | null;
}

const angularControlStates = new WeakMap<object, KrnAngularControlState>();

function angularControlState(owner: object): KrnAngularControlState {
  const state = angularControlStates.get(owner);
  if (!state) {
    throw new Error('KERN form control state must be initialized before a11y bindings.');
  }
  return state;
}

export function provideKrnFormControl(type: () => Type<unknown>): Provider[] {
  return [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(type),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(type),
      multi: true,
    },
  ];
}

/**
 * Base ControlValueAccessor and Validator contract for custom KERN form controls.
 *
 * @publicApi
 * @experimental
 */
export abstract class KrnValueAccessor<T> implements ControlValueAccessor, Validator {
  protected readonly controlValue: WritableSignal<T>;
  protected readonly formDisabled = signal(false);
  private readonly accessorDestroyRef = inject(DestroyRef);
  private readonly initialValue: T;
  private onChange: (value: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  protected constructor(initialValue: T) {
    this.initialValue = initialValue;
    this.controlValue = signal(initialValue);
    const state: KrnAngularControlState = {
      control: null,
      invalid: signal(false),
      required: signal(false),
      statusSubscription: null,
    };
    angularControlStates.set(this, state);
    this.accessorDestroyRef.onDestroy(() => {
      state.statusSubscription?.unsubscribe();
      angularControlStates.delete(this);
    });
  }

  writeValue(value: unknown): void {
    this.controlValue.set(this.normalizeIncomingValue(value));
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const state = this.bindAngularControl(control);
    const errors = this.validateValue(control.value);
    state.invalid.set(Boolean(control.invalid || errors));
    return errors;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected normalizeIncomingValue(value: unknown): T {
    return (value ?? this.initialValue) as T;
  }

  protected validateValue(_value: unknown): ValidationErrors | null {
    return null;
  }

  protected watchValidationInputs(...dependencies: readonly Signal<unknown>[]): void {
    effect(() => {
      for (const dependency of dependencies) {
        dependency();
      }
      this.onValidatorChange();
    });
  }

  protected commitValue(value: T): void {
    this.controlValue.set(value);
    this.onChange(value);
  }

  protected touch(): void {
    this.onTouched();
  }

  private bindAngularControl(control: AbstractControl): KrnAngularControlState {
    const state = angularControlState(this);
    if (state.control !== control) {
      state.statusSubscription?.unsubscribe();
      state.control = control;
      state.statusSubscription = control.statusChanges.subscribe(() => {
        this.syncAngularControlState(control, state);
      });
    }
    this.syncAngularControlState(control, state);
    return state;
  }

  private syncAngularControlState(control: AbstractControl, state: KrnAngularControlState): void {
    if (state.control !== control) {
      return;
    }
    state.invalid.set(Boolean(control.invalid));
    state.required.set(
      control.hasValidator(Validators.required) || control.hasValidator(Validators.requiredTrue),
    );
  }
}

export interface KrnControlA11y {
  readonly id: Signal<string>;
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly field: KrnFormFieldController | null;
}

export interface KrnControlStateInputs {
  readonly required?: Signal<boolean>;
  readonly disabled?: Signal<boolean>;
  readonly readOnly?: Signal<boolean>;
  readonly inheritField?: boolean;
}

export function useKrnControlA11y(
  owner: object,
  explicitId: Signal<string>,
  ownInvalid: Signal<boolean>,
  prefix: string,
  state: KrnControlStateInputs = {},
): KrnControlA11y {
  const injectedField = inject(KRN_FORM_FIELD, { optional: true });
  const field = state.inheritField === false ? null : injectedField;
  const generatedId = createKrnId(prefix);
  const angular = angularControlState(owner);
  const controlInvalid = computed(() => ownInvalid() || angular.invalid());
  const controlRequired = computed(() => Boolean(state.required?.() || angular.required()));

  return {
    id: computed(() => explicitId() || field?.controlId() || generatedId),
    describedBy: computed(() => field?.describedBy() || null),
    invalid: computed(() => controlInvalid() || Boolean(field?.invalid())),
    required: computed(() => controlRequired() || Boolean(field?.required())),
    disabled: computed(() => Boolean(state.disabled?.() || field?.disabled())),
    readOnly: computed(() => Boolean(state.readOnly?.() || field?.readOnly())),
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
