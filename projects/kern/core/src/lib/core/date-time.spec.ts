import { TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KRN_PLATFORM, type KrnPlatformAdapter } from '@kern-ui/angular/cdk';
import { KRN_DATE_TIME_SNAPSHOT } from './date-time';

describe('Kern date/time snapshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('transfers one immutable server clock and time-zone reference to the browser injector', () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    const transferState = TestBed.inject(TransferState);
    const resolvedOptions = new Intl.DateTimeFormat().resolvedOptions();
    const resolvedOptionsSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ ...resolvedOptions, timeZone: 'Pacific/Kiritimati' });
    const serverNow = Date.UTC(2026, 2, 15, 12);
    const clientNow = Date.UTC(2026, 2, 16, 12);
    const serverPlatform: KrnPlatformAdapter = {
      ...defaultPlatform,
      isBrowser: false,
      localStorage: null,
      window: null,
      now: () => serverNow,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_PLATFORM, useValue: serverPlatform },
        { provide: TransferState, useValue: transferState },
      ],
    });
    const serverSnapshot = TestBed.inject(KRN_DATE_TIME_SNAPSHOT);
    const serializedSeed = transferState.toJson();

    expect(serverSnapshot.now).toBe(serverNow);
    expect(serverSnapshot.timeZone).toBe('Pacific/Kiritimati');
    expect(serverSnapshot.today).toBe('2026-03-16');
    expect(Object.isFrozen(serverSnapshot)).toBe(true);
    expect(serializedSeed).not.toBe('{}');

    const clientPlatform: KrnPlatformAdapter = {
      ...defaultPlatform,
      now: () => clientNow,
    };
    resolvedOptionsSpy.mockReturnValue({ ...resolvedOptions, timeZone: 'America/Adak' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_PLATFORM, useValue: clientPlatform },
        { provide: TransferState, useValue: transferState },
      ],
    });
    const clientSnapshot = TestBed.inject(KRN_DATE_TIME_SNAPSHOT);

    expect(clientSnapshot.now).toBe(serverSnapshot.now);
    expect(clientSnapshot.timeZone).toBe(serverSnapshot.timeZone);
    expect(clientSnapshot.today).toBe(serverSnapshot.today);
    expect(clientSnapshot.now).not.toBe(clientNow);
    expect(clientSnapshot.todayAt(clientNow)).toBe('2026-03-16');
    expect(Object.isFrozen(clientSnapshot)).toBe(true);
    expect(transferState.toJson()).toBe(serializedSeed);
  });

  it('keeps one TransferState seed for independent bundle copies and root injectors', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    const transferState = TestBed.inject(TransferState);
    const resolvedOptions = new Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      ...resolvedOptions,
      timeZone: 'UTC',
    });
    const firstBundle = await import('./date-time');
    vi.resetModules();
    const secondBundle = await import('./date-time');
    const firstNow = Date.UTC(2026, 0, 1, 12);

    expect(secondBundle.KRN_DATE_TIME_SNAPSHOT).not.toBe(firstBundle.KRN_DATE_TIME_SNAPSHOT);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KRN_PLATFORM,
          useValue: {
            ...defaultPlatform,
            isBrowser: false,
            localStorage: null,
            window: null,
            now: () => firstNow,
          } satisfies KrnPlatformAdapter,
        },
        { provide: TransferState, useValue: transferState },
      ],
    });
    const firstSnapshot = TestBed.inject(firstBundle.KRN_DATE_TIME_SNAPSHOT);
    const serializedSeed = transferState.toJson();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KRN_PLATFORM,
          useValue: {
            ...defaultPlatform,
            now: () => Date.UTC(2026, 0, 3, 12),
          } satisfies KrnPlatformAdapter,
        },
        { provide: TransferState, useValue: transferState },
      ],
    });
    const secondSnapshot = TestBed.inject(secondBundle.KRN_DATE_TIME_SNAPSHOT);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KRN_PLATFORM,
          useValue: {
            ...defaultPlatform,
            now: () => Date.UTC(2026, 0, 4, 12),
          } satisfies KrnPlatformAdapter,
        },
        { provide: TransferState, useValue: transferState },
      ],
    });
    const repeatedReader = TestBed.inject(firstBundle.KRN_DATE_TIME_SNAPSHOT);

    expect(secondSnapshot.today).toBe(firstSnapshot.today);
    expect(repeatedReader.today).toBe(firstSnapshot.today);
    expect(secondSnapshot.now).toBe(firstNow);
    expect(repeatedReader.now).toBe(firstNow);
    expect(transferState.toJson()).toBe(serializedSeed);
  });
});
