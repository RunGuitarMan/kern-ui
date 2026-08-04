import { TestBed } from '@angular/core/testing';
import { KRN_DEFAULT_LOADING_LABEL, KRN_LOADING_LABEL } from './loading-label';
import { krnReadI18nValue } from './reactive-value';

describe('KRN_LOADING_LABEL', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('provides a tiny English fallback without a root configuration provider', () => {
    TestBed.configureTestingModule({});

    expect(KRN_DEFAULT_LOADING_LABEL).toBe('Loading…');
    expect(krnReadI18nValue(TestBed.inject(KRN_LOADING_LABEL))).toBe(KRN_DEFAULT_LOADING_LABEL);
  });
});
