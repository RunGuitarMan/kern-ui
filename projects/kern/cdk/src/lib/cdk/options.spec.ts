import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  InjectionToken,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { createKrnOptions } from './options';

interface TestOptions {
  readonly label: string;
  readonly size: 'sm' | 'md' | 'lg';
  readonly tone: 'neutral' | 'danger' | null;
}

const TEST_DEFAULTS: TestOptions = {
  label: 'Default label',
  size: 'md',
  tone: 'neutral',
};

const [TEST_OPTIONS, provideTestOptions] = createKrnOptions<TestOptions>(
  'TEST_OPTIONS',
  TEST_DEFAULTS,
);
const TEST_LABEL = new InjectionToken<string>('TEST_LABEL');
const SYMBOL_OPTION = Symbol('SYMBOL_OPTION');

interface PrototypeOptions {
  readonly label: string;
  readonly __proto__?: object;
  readonly [SYMBOL_OPTION]?: string;
}

class OptionsClassInstance {
  readonly label = 'Class instance';
}

@Component({
  selector: 'krn-options-child-spec',
  providers: [
    provideTestOptions({
      label: undefined,
      size: undefined,
      tone: 'danger',
    }),
  ],
  template: '',
})
class OptionsChildSpec {
  readonly options = inject(TEST_OPTIONS);
}

@Component({
  imports: [OptionsChildSpec],
  providers: [provideTestOptions({ label: 'Parent label', size: 'lg' })],
  template: '<krn-options-child-spec />',
})
class OptionsParentSpec {
  readonly options = inject(TEST_OPTIONS);
  readonly child = viewChild.required(OptionsChildSpec);
}

@Component({
  providers: [
    { provide: TEST_LABEL, useValue: 'Injected label' },
    provideTestOptions(() => ({ label: inject(TEST_LABEL) })),
  ],
  template: '',
})
class OptionsFactorySpec {
  readonly options = inject(TEST_OPTIONS);
}

function resolveWithManualParent(parent: unknown): Readonly<TestOptions> {
  const parentInjector = createEnvironmentInjector(
    [{ provide: TEST_OPTIONS, useValue: parent }],
    TestBed.inject(EnvironmentInjector),
  );
  const childInjector = createEnvironmentInjector(
    [provideTestOptions({ tone: 'danger' })],
    parentInjector,
  );

  try {
    return childInjector.get(TEST_OPTIONS);
  } finally {
    childInjector.destroy();
    parentInjector.destroy();
  }
}

describe('createKrnOptions', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns a frozen shallow clone of the library defaults', () => {
    const options = TestBed.inject(TEST_OPTIONS);

    expect(options).toEqual(TEST_DEFAULTS);
    expect(options).not.toBe(TEST_DEFAULTS);
    expect(Object.isFrozen(options)).toBe(true);
    expect(Object.isFrozen(TEST_DEFAULTS)).toBe(false);
  });

  it('merges a local provider over the defaults without mutating either input', () => {
    const patch: Partial<TestOptions> = {
      label: 'Local label',
      size: 'sm',
    };
    TestBed.configureTestingModule({
      providers: [provideTestOptions(patch)],
    });

    const options = TestBed.inject(TEST_OPTIONS);

    expect(options).toEqual({
      label: 'Local label',
      size: 'sm',
      tone: 'neutral',
    });
    expect(Object.isFrozen(options)).toBe(true);
    expect(TEST_DEFAULTS).toEqual({
      label: 'Default label',
      size: 'md',
      tone: 'neutral',
    });
    expect(patch).toEqual({
      label: 'Local label',
      size: 'sm',
    });
  });

  it('inherits a parent scope and applies only defined child overrides', () => {
    const fixture = TestBed.createComponent(OptionsParentSpec);
    fixture.detectChanges();

    const parent = fixture.componentInstance.options;
    const child = fixture.componentInstance.child().options;

    expect(parent).toEqual({
      label: 'Parent label',
      size: 'lg',
      tone: 'neutral',
    });
    expect(child).toEqual({
      label: 'Parent label',
      size: 'lg',
      tone: 'danger',
    });
    expect(Object.isFrozen(parent)).toBe(true);
    expect(Object.isFrozen(child)).toBe(true);
    expect(parent).not.toBe(child);
  });

  it('runs patch factories in the provider injection context', () => {
    const fixture = TestBed.createComponent(OptionsFactorySpec);

    expect(fixture.componentInstance.options).toEqual({
      label: 'Injected label',
      size: 'md',
      tone: 'neutral',
    });
  });

  it('inherits undefined properties while preserving explicit null', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestOptions({
          label: undefined,
          size: undefined,
          tone: null,
        }),
      ],
    });

    expect(TestBed.inject(TEST_OPTIONS)).toEqual({
      label: 'Default label',
      size: 'md',
      tone: null,
    });
  });

  it('defines __proto__ and symbol overrides as safe own data properties', () => {
    const attackerPrototype: Record<string, string> = {
      inheritedBeforeMerge: 'attacker value',
    };
    const patch = Object.create(null) as Partial<PrototypeOptions>;
    Object.defineProperty(patch, '__proto__', {
      enumerable: true,
      value: attackerPrototype,
    });
    Object.defineProperty(patch, SYMBOL_OPTION, {
      enumerable: true,
      value: 'symbol value',
    });
    const [prototypeOptions, providePrototypeOptions] = createKrnOptions<PrototypeOptions>(
      'PROTOTYPE_OPTIONS',
      {
        label: 'Safe options',
      },
    );
    TestBed.configureTestingModule({
      providers: [providePrototypeOptions(patch)],
    });

    const options = TestBed.inject(prototypeOptions);

    expect(Object.prototype.hasOwnProperty.call(options, '__proto__')).toBe(true);
    expect(Reflect.get(options, '__proto__')).toBe(attackerPrototype);
    expect(Object.getPrototypeOf(options)).toBe(Object.prototype);
    expect(Object.isFrozen(options)).toBe(true);
    expect(options[SYMBOL_OPTION]).toBe('symbol value');
    expect(Reflect.get(options, 'inheritedBeforeMerge')).toBeUndefined();

    attackerPrototype['injectedAfterMerge'] = 'later attacker value';
    expect(Reflect.get(options, 'injectedAfterMerge')).toBeUndefined();
  });

  it('accepts null-prototype defaults and patches', () => {
    const defaults = Object.assign(Object.create(null), TEST_DEFAULTS) as TestOptions;
    const patch = Object.assign(Object.create(null), {
      label: undefined,
      size: 'lg',
    }) as Partial<TestOptions>;
    const [nullPrototypeOptions, provideNullPrototypeOptions] = createKrnOptions<TestOptions>(
      'NULL_PROTOTYPE_OPTIONS',
      defaults,
    );
    TestBed.configureTestingModule({
      providers: [provideNullPrototypeOptions(patch)],
    });

    const options = TestBed.inject(nullPrototypeOptions);

    expect(options).toEqual({
      label: 'Default label',
      size: 'lg',
      tone: 'neutral',
    });
    expect(Object.isFrozen(options)).toBe(true);
  });

  it('accepts cross-realm plain defaults and patches', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);

    try {
      const realm = frame.contentWindow as (Window & typeof globalThis) | null;
      const RealmObject = realm?.Object;
      if (!RealmObject) {
        throw new Error('Expected an iframe Object constructor');
      }

      const defaults = RealmObject.assign(new RealmObject(), TEST_DEFAULTS) as TestOptions;
      const patch = RealmObject.assign(new RealmObject(), {
        label: 'Cross-realm label',
        tone: null,
      }) as Partial<TestOptions>;
      const [crossRealmOptions, provideCrossRealmOptions] = createKrnOptions<TestOptions>(
        'CROSS_REALM_OPTIONS',
        defaults,
      );
      TestBed.configureTestingModule({
        providers: [provideCrossRealmOptions(patch)],
      });

      expect(TestBed.inject(crossRealmOptions)).toEqual({
        label: 'Cross-realm label',
        size: 'md',
        tone: null,
      });
    } finally {
      frame.remove();
    }
  });

  it.each([null, [], () => ({})])('rejects an invalid factory result %#', (result) => {
    TestBed.configureTestingModule({
      providers: [provideTestOptions(() => result as unknown as Partial<TestOptions>)],
    });

    expect(() => TestBed.inject(TEST_OPTIONS)).toThrowError(
      'KRN_OPTIONS_INVALID_PATCH: TEST_OPTIONS must resolve to a plain record with Object.prototype or null prototype.',
    );
  });

  it.each([
    ['null', null],
    ['array', []],
    ['function', () => ({})],
    ['class instance', new OptionsClassInstance()],
    ['Date', new Date()],
    ['Map', new Map()],
    ['Promise', Promise.resolve('value')],
  ])('rejects %s defaults eagerly with a stable runtime error', (_name, value) => {
    expect(() =>
      createKrnOptions<TestOptions>('INVALID_OPTIONS', value as unknown as TestOptions),
    ).toThrowError(
      'KRN_OPTIONS_INVALID_DEFAULTS: INVALID_OPTIONS must be a plain record with Object.prototype or null prototype.',
    );
  });

  it.each([
    ['string', 'label', 'Hidden label'],
    ['symbol', SYMBOL_OPTION, 'Hidden symbol value'],
  ])('rejects a non-enumerable %s own key in defaults', (_name, key, value) => {
    const defaults = { label: 'Visible label' } as PrototypeOptions;
    Object.defineProperty(defaults, key, {
      enumerable: false,
      value,
    });

    expect(() =>
      createKrnOptions<PrototypeOptions>('NON_ENUMERABLE_OPTIONS', defaults),
    ).toThrowError(
      'KRN_OPTIONS_INVALID_DEFAULTS: NON_ENUMERABLE_OPTIONS must define only enumerable own data properties.',
    );
  });

  it.each([
    ['string', 'label', 'Accessor label'],
    ['symbol', SYMBOL_OPTION, 'Accessor symbol value'],
  ])(
    'rejects an enumerable %s accessor in defaults without invoking its getter',
    (_name, key, value) => {
      const getterState = { mutated: false };
      const defaults = { label: 'Visible label' } as PrototypeOptions;
      Object.defineProperty(defaults, key, {
        enumerable: true,
        get: () => {
          getterState.mutated = true;
          return value;
        },
      });

      expect(() => createKrnOptions<PrototypeOptions>('ACCESSOR_OPTIONS', defaults)).toThrowError(
        'KRN_OPTIONS_INVALID_DEFAULTS: ACCESSOR_OPTIONS must define only enumerable own data properties.',
      );
      expect(getterState.mutated).toBe(false);
    },
  );

  it.each([
    ['null', null],
    ['array', []],
    ['class instance', new OptionsClassInstance()],
    ['Date', new Date()],
    ['Map', new Map()],
    ['Promise', Promise.resolve('value')],
  ])('rejects a %s patch with a stable runtime error', (_name, value) => {
    TestBed.configureTestingModule({
      providers: [provideTestOptions(value as unknown as Partial<TestOptions>)],
    });

    expect(() => TestBed.inject(TEST_OPTIONS)).toThrowError(
      'KRN_OPTIONS_INVALID_PATCH: TEST_OPTIONS must resolve to a plain record with Object.prototype or null prototype.',
    );
  });

  it.each([
    ['string', 'label', 'Hidden label'],
    ['symbol', SYMBOL_OPTION, 'Hidden symbol value'],
  ])('rejects a non-enumerable %s own key in a patch', (_name, key, value) => {
    const [prototypeOptions, providePrototypeOptions] = createKrnOptions<PrototypeOptions>(
      'NON_ENUMERABLE_OPTIONS',
      { label: 'Visible label' },
    );
    const patch: Partial<PrototypeOptions> = {};
    Object.defineProperty(patch, key, {
      enumerable: false,
      value,
    });
    TestBed.configureTestingModule({
      providers: [providePrototypeOptions(patch)],
    });

    expect(() => TestBed.inject(prototypeOptions)).toThrowError(
      'KRN_OPTIONS_INVALID_PATCH: NON_ENUMERABLE_OPTIONS must resolve to a record that defines only enumerable own data properties.',
    );
  });

  it.each([
    ['string', 'label', 'Accessor label'],
    ['symbol', SYMBOL_OPTION, 'Accessor symbol value'],
  ])(
    'rejects an enumerable %s accessor in a patch without invoking its getter',
    (_name, key, value) => {
      const getterState = { mutated: false };
      const [prototypeOptions, providePrototypeOptions] = createKrnOptions<PrototypeOptions>(
        'ACCESSOR_OPTIONS',
        { label: 'Visible label' },
      );
      const patch: Partial<PrototypeOptions> = {};
      Object.defineProperty(patch, key, {
        enumerable: true,
        get: () => {
          getterState.mutated = true;
          return value;
        },
      });
      TestBed.configureTestingModule({
        providers: [providePrototypeOptions(patch)],
      });

      expect(() => TestBed.inject(prototypeOptions)).toThrowError(
        'KRN_OPTIONS_INVALID_PATCH: ACCESSOR_OPTIONS must resolve to a record that defines only enumerable own data properties.',
      );
      expect(getterState.mutated).toBe(false);
    },
  );

  it('rebases a manual partial parent over the library defaults before applying the patch', () => {
    const options = resolveWithManualParent({
      label: 'Manual parent label',
    });

    expect(options).toEqual({
      label: 'Manual parent label',
      size: 'md',
      tone: 'danger',
    });
    expect(Object.isFrozen(options)).toBe(true);
  });

  it.each([
    ['array', []],
    ['class instance', new OptionsClassInstance()],
    ['Date', new Date()],
  ])('rejects a %s manual parent with a stable runtime error', (_name, parent) => {
    expect(() => resolveWithManualParent(parent)).toThrowError(
      'KRN_OPTIONS_INVALID_PARENT: TEST_OPTIONS inherited parent must be a plain record with Object.prototype or null prototype.',
    );
  });

  it.each([
    ['string', 'label', 'Hidden label'],
    ['symbol', SYMBOL_OPTION, 'Hidden symbol value'],
  ])('rejects a non-enumerable %s own key in a manual parent', (_name, key, value) => {
    const parent = { label: 'Visible label' };
    Object.defineProperty(parent, key, {
      enumerable: false,
      value,
    });

    expect(() => resolveWithManualParent(parent)).toThrowError(
      'KRN_OPTIONS_INVALID_PARENT: TEST_OPTIONS inherited parent must define only enumerable own data properties.',
    );
  });

  it.each([
    ['string', 'label', 'Accessor label'],
    ['symbol', SYMBOL_OPTION, 'Accessor symbol value'],
  ])(
    'rejects an enumerable %s accessor in a manual parent without invoking its getter',
    (_name, key, value) => {
      const getterState = { mutated: false };
      const parent = { label: 'Visible label' };
      Object.defineProperty(parent, key, {
        enumerable: true,
        get: () => {
          getterState.mutated = true;
          return value;
        },
      });

      expect(() => resolveWithManualParent(parent)).toThrowError(
        'KRN_OPTIONS_INVALID_PARENT: TEST_OPTIONS inherited parent must define only enumerable own data properties.',
      );
      expect(getterState.mutated).toBe(false);
    },
  );

  it('rebases a cross-realm manual parent without losing library defaults', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);

    try {
      const realm = frame.contentWindow as (Window & typeof globalThis) | null;
      const RealmObject = realm?.Object;
      if (!RealmObject) {
        throw new Error('Expected an iframe Object constructor');
      }
      const parent = RealmObject.assign(new RealmObject(), {
        label: 'Cross-realm parent label',
      });

      expect(resolveWithManualParent(parent)).toEqual({
        label: 'Cross-realm parent label',
        size: 'md',
        tone: 'danger',
      });
    } finally {
      frame.remove();
    }
  });

  it('copies a manual __proto__ parent property without changing the resolved prototype', () => {
    const attackerPrototype: Record<string, string> = {
      inheritedBeforeMerge: 'attacker value',
    };
    const parent = Object.create(null) as Partial<TestOptions>;
    Object.defineProperty(parent, 'label', {
      enumerable: true,
      value: 'Manual parent label',
    });
    Object.defineProperty(parent, '__proto__', {
      enumerable: true,
      value: attackerPrototype,
    });

    const options = resolveWithManualParent(parent);

    expect(Object.prototype.hasOwnProperty.call(options, '__proto__')).toBe(true);
    expect(Reflect.get(options, '__proto__')).toBe(attackerPrototype);
    expect(Object.getPrototypeOf(options)).toBe(Object.prototype);
    expect(Reflect.get(options, 'inheritedBeforeMerge')).toBeUndefined();
  });
});
