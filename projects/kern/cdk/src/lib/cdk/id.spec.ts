import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnIdService } from './id';

describe('KrnIdService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates deterministic application-scoped sequential IDs', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ID, useValue: 'Enterprise Shell' }],
    });
    const ids = TestBed.inject(KrnIdService);

    expect(ids.next('field label')).toBe('krn-enterprise-shell-field-label-1');
    expect(ids.next('field label')).toBe('krn-enterprise-shell-field-label-2');
    expect(ids.next('hint')).toBe('krn-enterprise-shell-hint-1');
  });

  it('creates order-independent IDs from stable keys', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ID, useValue: 'server' }],
    });
    const ids = TestBed.inject(KrnIdService);

    const first = ids.fromKey('row', 'customer-42');
    ids.next('unrelated');
    const second = ids.fromKey('row', 'customer-42');

    expect(first).toBe(second);
    expect(first).toMatch(/^krn-server-row-[a-z0-9]+$/);
    expect(ids.fromKey('row', 'customer-43')).not.toBe(first);
  });
});
