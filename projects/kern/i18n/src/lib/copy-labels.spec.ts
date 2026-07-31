import { TestBed } from '@angular/core/testing';
import { KRN_COPY_LABELS, KRN_DEFAULT_COPY_LABELS } from './copy-labels';

describe('KRN_COPY_LABELS', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('provides one tiny immutable English fallback without Core', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(KRN_COPY_LABELS)).toBe(KRN_DEFAULT_COPY_LABELS);
    expect(KRN_DEFAULT_COPY_LABELS).toEqual({
      copy: 'Copy to clipboard',
      copied: 'Copied',
      copying: 'Copying…',
      failed: 'Could not copy',
    });
    expect(Object.isFrozen(KRN_DEFAULT_COPY_LABELS)).toBe(true);
  });
});
