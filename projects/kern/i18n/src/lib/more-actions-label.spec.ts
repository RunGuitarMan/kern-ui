import { TestBed } from '@angular/core/testing';
import { KRN_DEFAULT_MORE_ACTIONS_LABEL, KRN_MORE_ACTIONS_LABEL } from './more-actions-label';
import { krnReadI18nValue } from './reactive-value';

describe('KRN_MORE_ACTIONS_LABEL', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('provides compact English copy without the complete translation registry', () => {
    TestBed.configureTestingModule({});

    expect(KRN_DEFAULT_MORE_ACTIONS_LABEL).toBe('More actions');
    expect(krnReadI18nValue(TestBed.inject(KRN_MORE_ACTIONS_LABEL))).toBe(
      KRN_DEFAULT_MORE_ACTIONS_LABEL,
    );
  });
});
