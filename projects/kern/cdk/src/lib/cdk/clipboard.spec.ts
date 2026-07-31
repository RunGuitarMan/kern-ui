import { Clipboard as CdkClipboard } from '@angular/cdk/clipboard';
import { TestBed } from '@angular/core/testing';

import { KRN_CLIPBOARD_WRITER, type KrnClipboardWriter } from './clipboard';
import { KRN_PLATFORM, type KrnPlatformAdapter } from './platform';

const WRITE_ERROR = 'KRN_CLIPBOARD_WRITE_FAILED: Clipboard writing is unavailable or failed.';

function createPlatform(
  clipboard: Pick<Clipboard, 'writeText'> | null,
  isBrowser = true,
): KrnPlatformAdapter {
  const window = isBrowser
    ? ({
        navigator: {
          ...(clipboard ? { clipboard } : {}),
        },
      } as unknown as Window & typeof globalThis)
    : null;

  return {
    document,
    isBrowser,
    window,
    localStorage: null,
    matchMedia: () => null,
    requestAnimationFrame: () => null,
    cancelAnimationFrame: () => undefined,
    schedule: () => null,
    cancelScheduled: () => undefined,
    queueMicrotask: (callback) => callback(),
    now: () => 0,
  };
}

function configureWriter({
  modern = null,
  fallback,
  isBrowser = true,
}: {
  modern?: Pick<Clipboard, 'writeText'> | null;
  fallback: { copy(value: string): boolean } | null;
  isBrowser?: boolean;
}): KrnClipboardWriter {
  TestBed.configureTestingModule({
    providers: [
      { provide: KRN_PLATFORM, useValue: createPlatform(modern, isBrowser) },
      { provide: CdkClipboard, useValue: fallback },
    ],
  });

  return TestBed.inject(KRN_CLIPBOARD_WRITER);
}

describe('KRN_CLIPBOARD_WRITER', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses the modern asynchronous Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const copy = vi.fn().mockReturnValue(true);
    const writer = configureWriter({
      modern: { writeText },
      fallback: { copy },
    });

    await expect(writer.writeText('KERN')).resolves.toBeUndefined();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith('KERN');
    expect(copy).not.toHaveBeenCalled();
  });

  it('propagates the exact modern API rejection without invoking the fallback', async () => {
    const rejection = new DOMException('Permission denied', 'NotAllowedError');
    const writeText = vi.fn().mockRejectedValue(rejection);
    const copy = vi.fn().mockReturnValue(true);
    const writer = configureWriter({
      modern: { writeText },
      fallback: { copy },
    });

    await expect(writer.writeText('KERN')).rejects.toBe(rejection);
    expect(copy).not.toHaveBeenCalled();
  });

  it('uses the Angular CDK fallback only when the modern API is absent', async () => {
    const copy = vi.fn().mockReturnValue(true);
    const writer = configureWriter({ fallback: { copy } });

    await expect(writer.writeText('fallback')).resolves.toBeUndefined();
    expect(copy).toHaveBeenCalledOnce();
    expect(copy).toHaveBeenCalledWith('fallback');
  });

  it('rejects with a stable Error when the Angular CDK fallback returns false', async () => {
    const writer = configureWriter({
      fallback: { copy: vi.fn().mockReturnValue(false) },
    });

    await expect(writer.writeText('failed')).rejects.toThrowError(WRITE_ERROR);
  });

  it('rejects with the same stable Error when the Angular CDK fallback is unavailable', async () => {
    const writer = configureWriter({ fallback: null });

    await expect(writer.writeText('unavailable')).rejects.toThrowError(WRITE_ERROR);
  });

  it('normalizes an Angular CDK fallback exception to the stable Error', async () => {
    const writer = configureWriter({
      fallback: {
        copy: vi.fn(() => {
          throw new Error('implementation detail');
        }),
      },
    });

    await expect(writer.writeText('failed')).rejects.toThrowError(WRITE_ERROR);
  });

  it('is SSR-safe and does not invoke the Angular CDK fallback', async () => {
    const copy = vi.fn().mockReturnValue(true);
    const writer = configureWriter({
      fallback: { copy },
      isBrowser: false,
    });

    await expect(writer.writeText('server')).rejects.toThrowError(WRITE_ERROR);
    expect(copy).not.toHaveBeenCalled();
  });

  it('passes Unicode and control characters to the selected writer exactly', async () => {
    const value = 'КЕРН 🧭\nمرحبا\u0000終';
    const writeText = vi.fn().mockResolvedValue(undefined);
    const writer = configureWriter({
      modern: { writeText },
      fallback: { copy: vi.fn().mockReturnValue(true) },
    });

    await writer.writeText(value);

    expect(writeText).toHaveBeenCalledWith(value);
  });

  it('can be replaced at an application injector boundary', () => {
    const replacement: KrnClipboardWriter = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: KRN_CLIPBOARD_WRITER, useValue: replacement }],
    });

    expect(TestBed.inject(KRN_CLIPBOARD_WRITER)).toBe(replacement);
  });
});
