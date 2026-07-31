import { Component, ErrorHandler, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  KRN_CLIPBOARD_WRITER,
  KRN_PLATFORM,
  type KrnClipboardWriter,
  type KrnPlatformAdapter,
  type KrnScheduledHandle,
} from '@kern-ui/angular/cdk';
import { KRN_COPY_LABELS, type KrnCopyLabels } from '@kern-ui/angular/i18n';
import { KrnCopyButton } from './copy-button';
import {
  KRN_COPY_BUTTON_DEFAULT_OPTIONS,
  KRN_COPY_BUTTON_OPTIONS,
  provideKrnCopyButtonOptions,
} from './copy-button-options';

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

function writerFrom(
  writeText: (value: string) => Promise<void> = () => Promise.resolve(),
): KrnClipboardWriter {
  return { writeText };
}

async function flushSignals(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

interface ControlledScheduler {
  readonly platform: KrnPlatformAdapter;
  readonly delays: readonly number[];
  readonly cancelScheduled: ReturnType<typeof vi.fn>;
  run(handle: KrnScheduledHandle): void;
  latestHandle(): KrnScheduledHandle;
}

function createControlledScheduler(): ControlledScheduler {
  let nextHandle = 0;
  const callbacks = new Map<KrnScheduledHandle, () => void>();
  const handles: KrnScheduledHandle[] = [];
  const delays: number[] = [];
  const cancelScheduled = vi.fn((handle: KrnScheduledHandle | null): void => {
    if (handle !== null) {
      callbacks.delete(handle);
    }
  });
  const platform: KrnPlatformAdapter = {
    document,
    isBrowser: true,
    window,
    localStorage: null,
    matchMedia: () => null,
    requestAnimationFrame: () => null,
    cancelAnimationFrame: () => undefined,
    schedule: (callback, delay = 0) => {
      const handle = ++nextHandle as unknown as KrnScheduledHandle;
      handles.push(handle);
      delays.push(delay);
      callbacks.set(handle, callback);
      return handle;
    },
    cancelScheduled,
    queueMicrotask: (callback) => callback(),
    now: () => 0,
  };

  return {
    platform,
    delays,
    cancelScheduled,
    run: (handle) => {
      const callback = callbacks.get(handle);
      callbacks.delete(handle);
      callback?.();
    },
    latestHandle: () => {
      const handle = handles.at(-1);
      if (handle === undefined) {
        throw new Error('Expected the Copy Button to schedule feedback reset.');
      }
      return handle;
    },
  };
}

@Component({
  imports: [KrnCopyButton],
  template: `
    <form (submit)="recordSubmit($event)">
      <krn-copy-button
        ariaLabel="Copy access token"
        copiedLabel="Token copied"
        copyingLabel="Copying token"
        errorLabel="Copy failed"
        size="lg"
        tone="brand"
        value="α-token&#10;строка"
        variant="soft"
        (copied)="copiedValue.set($event)"
        (copyError)="copyFailure.set($event)"
      >
        <span>Copy access token</span>
      </krn-copy-button>
    </form>
  `,
})
class CopyButtonHost {
  readonly copiedValue = signal('');
  readonly copyFailure = signal<unknown>(undefined);
  readonly submitCount = signal(0);

  recordSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitCount.update((count) => count + 1);
  }
}

@Component({
  selector: 'krn-copy-options-child',
  imports: [KrnCopyButton],
  providers: [provideKrnCopyButtonOptions({ tone: 'danger', feedbackDuration: 2400 })],
  template: `<krn-copy-button data-testid="child" value="child">Child</krn-copy-button>`,
})
class CopyOptionsChild {}

@Component({
  imports: [CopyOptionsChild, KrnCopyButton],
  providers: [provideKrnCopyButtonOptions({ size: 'lg', variant: 'soft' })],
  template: `
    <krn-copy-button data-testid="parent" value="parent">Parent</krn-copy-button>
    <krn-copy-button
      data-testid="instance"
      feedbackDuration="75"
      size="sm"
      tone="success"
      value="instance"
      variant="ghost"
    >
      Instance
    </krn-copy-button>
    <krn-copy-options-child />
  `,
})
class CopyOptionsHost {}

describe('KrnCopyButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders one form-safe native button with a stable action label and persistent status', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KRN_CLIPBOARD_WRITER,
          useValue: writerFrom(),
        },
      ],
    });
    const fixture = TestBed.createComponent(CopyButtonHost);
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('krn-copy-button') as HTMLElement;
    const button = host.querySelector('button[krnButton]') as HTMLButtonElement;
    const status = host.querySelector('.krn-copy-status') as HTMLElement;
    const labels = Array.from(host.querySelectorAll<HTMLElement>('.krn-copy-label'));
    const indicator = host.querySelector('.krn-copy-indicator') as HTMLElement;

    expect(host.querySelectorAll('button')).toHaveLength(1);
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Copy access token');
    expect(button.disabled).toBe(false);
    expect(button.dataset).toMatchObject({
      size: 'lg',
      tone: 'brand',
      variant: 'soft',
    });
    expect(host.dataset).toMatchObject({
      pending: 'false',
      size: 'lg',
      state: 'idle',
      tone: 'brand',
      variant: 'soft',
    });
    expect(labels).toHaveLength(1);
    expect(labels[0]?.textContent?.trim()).toBe('Copy access token');
    expect(indicator.dataset['state']).toBe('idle');
    expect(indicator.textContent?.trim()).toBe('');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(status.textContent?.trim()).toBe('');

    button.click();
    await flushSignals();
    fixture.detectChanges();

    expect(fixture.componentInstance.submitCount()).toBe(0);
    expect(labels[0]?.textContent?.trim()).toBe('Copy access token');
    expect(indicator.dataset['state']).toBe('copied');
    expect(indicator.textContent?.trim()).toBe('✓');
    expect(status.textContent?.trim()).toBe('Token copied');
  });

  it('emits the exact immutable value snapshot only after a confirmed write', async () => {
    const pendingWrite = deferred();
    const writeText = vi.fn(() => pendingWrite.promise);
    TestBed.configureTestingModule({
      providers: [{ provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom(writeText) }],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'A\nКЕРН 🧭');
    await fixture.whenStable();
    const copied = vi.fn();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    let stateDuringOutput:
      | {
          readonly loadingStatus: string;
          readonly pending: string | undefined;
          readonly resultStatus: string;
          readonly state: string | undefined;
        }
      | undefined;
    fixture.componentInstance.copied.subscribe((value) => {
      copied(value);
      fixture.detectChanges();
      stateDuringOutput = {
        loadingStatus: button.querySelector('[role="status"]')?.textContent?.trim() ?? '',
        pending: fixture.nativeElement.dataset.pending,
        resultStatus:
          (
            fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement
          ).textContent?.trim() ?? '',
        state: fixture.nativeElement.dataset.state,
      };
    });

    button.click();
    fixture.componentRef.setInput('value', 'B');
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith('A\nКЕРН 🧭');
    expect(copied).not.toHaveBeenCalled();
    expect(fixture.nativeElement.dataset.pending).toBe('true');
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(
      (fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement).textContent?.trim(),
    ).toBe('Copying…');

    pendingWrite.resolve();
    await flushSignals();
    fixture.detectChanges();

    expect(copied).toHaveBeenCalledOnce();
    expect(copied).toHaveBeenCalledWith('A\nКЕРН 🧭');
    expect(stateDuringOutput).toEqual({
      loadingStatus: '',
      pending: 'false',
      resultStatus: 'Copied',
      state: 'copied',
    });
    expect(fixture.nativeElement.dataset).toMatchObject({
      pending: 'false',
      state: 'copied',
    });
  });

  it('uses a focus-preserving single-flight policy for repeated activation', async () => {
    const pendingWrite = deferred();
    const writeText = vi.fn(() => pendingWrite.promise);
    TestBed.configureTestingModule({
      providers: [{ provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom(writeText) }],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'single-flight');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.focus();
    button.click();
    button.click();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(
      (fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement).textContent?.trim(),
    ).toBe('Copying…');

    pendingWrite.resolve();
    await flushSignals();
    fixture.detectChanges();

    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });

  it('preserves the exact writer error and supports a subsequent retry', async () => {
    const rejection = new DOMException('Denied by user', 'NotAllowedError');
    const writeText = vi
      .fn<(value: string) => Promise<void>>()
      .mockRejectedValueOnce(rejection)
      .mockResolvedValueOnce(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom(writeText) }],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'retry');
    await fixture.whenStable();
    const copied = vi.fn();
    const copyError = vi.fn();
    fixture.componentInstance.copied.subscribe(copied);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    let stateDuringError:
      | {
          readonly loadingStatus: string;
          readonly pending: string | undefined;
          readonly resultStatus: string;
          readonly state: string | undefined;
        }
      | undefined;
    fixture.componentInstance.copyError.subscribe((error) => {
      copyError(error);
      fixture.detectChanges();
      stateDuringError = {
        loadingStatus: button.querySelector('[role="status"]')?.textContent?.trim() ?? '',
        pending: fixture.nativeElement.dataset.pending,
        resultStatus:
          (
            fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement
          ).textContent?.trim() ?? '',
        state: fixture.nativeElement.dataset.state,
      };
    });

    button.click();
    await flushSignals();
    fixture.detectChanges();

    expect(copyError).toHaveBeenCalledOnce();
    expect(copyError).toHaveBeenCalledWith(rejection);
    expect(copied).not.toHaveBeenCalled();
    expect(stateDuringError).toEqual({
      loadingStatus: '',
      pending: 'false',
      resultStatus: 'Could not copy',
      state: 'error',
    });
    expect(fixture.nativeElement.dataset.state).toBe('error');
    expect(
      (fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement).textContent?.trim(),
    ).toBe('Could not copy');

    button.click();
    await flushSignals();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(copied).toHaveBeenCalledWith('retry');
    expect(fixture.nativeElement.dataset.state).toBe('copied');
  });

  it('does not reinterpret a throwing terminal listener as a clipboard failure', async () => {
    const listenerFailure = new Error('consumer listener failed');
    const errorHandler = { handleError: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandler, useValue: errorHandler },
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom() },
      ],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'listener');
    await fixture.whenStable();
    const copyError = vi.fn();
    fixture.componentInstance.copyError.subscribe(copyError);
    fixture.componentInstance.copied.subscribe(() => {
      throw listenerFailure;
    });

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await flushSignals();
    fixture.detectChanges();

    expect(errorHandler.handleError).toHaveBeenCalledWith(listenerFailure);
    expect(copyError).not.toHaveBeenCalled();
    expect(fixture.nativeElement.dataset).toMatchObject({
      pending: 'false',
      state: 'copied',
    });
  });

  it('does not update state, emit, or schedule after destroy', async () => {
    const pendingWrite = deferred();
    const writeText = vi.fn(() => pendingWrite.promise);
    const scheduler = createControlledScheduler();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom(writeText) },
        { provide: KRN_PLATFORM, useValue: scheduler.platform },
      ],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'late');
    await fixture.whenStable();
    const copied = vi.fn();
    const copyError = vi.fn();
    fixture.componentInstance.copied.subscribe(copied);
    fixture.componentInstance.copyError.subscribe(copyError);

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.destroy();
    pendingWrite.resolve();
    await flushSignals();

    expect(copied).not.toHaveBeenCalled();
    expect(copyError).not.toHaveBeenCalled();
    expect(scheduler.delays).toEqual([]);
  });

  it('does not create a feedback timer when an output listener destroys the component', async () => {
    const scheduler = createControlledScheduler();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom() },
        { provide: KRN_PLATFORM, useValue: scheduler.platform },
      ],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'destroy-from-output');
    await fixture.whenStable();
    fixture.componentInstance.copied.subscribe(() => fixture.destroy());

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await flushSignals();

    expect(scheduler.delays).toEqual([]);
  });

  it('cancels the previous reset and applies scoped and instance durations', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const scheduler = createControlledScheduler();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom(writeText) },
        { provide: KRN_PLATFORM, useValue: scheduler.platform },
      ],
    });
    const fixture = TestBed.createComponent(CopyOptionsHost);
    await fixture.whenStable();
    const button = (id: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"] button`) as HTMLButtonElement;
    const host = (id: string): HTMLElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;

    button('parent').click();
    await flushSignals();
    fixture.detectChanges();
    const firstHandle = scheduler.latestHandle();
    expect(scheduler.delays.at(-1)).toBe(1800);

    button('parent').click();
    await flushSignals();
    fixture.detectChanges();
    expect(scheduler.cancelScheduled).toHaveBeenCalledWith(firstHandle);
    expect(scheduler.delays.at(-1)).toBe(1800);

    button('instance').click();
    await flushSignals();
    fixture.detectChanges();
    expect(scheduler.delays.at(-1)).toBe(75);

    button('child').click();
    await flushSignals();
    fixture.detectChanges();
    expect(scheduler.delays.at(-1)).toBe(2400);
    expect(host('parent').dataset).toMatchObject({
      size: 'lg',
      tone: 'neutral',
      variant: 'soft',
    });
    expect(host('instance').dataset).toMatchObject({
      size: 'sm',
      tone: 'success',
      variant: 'ghost',
    });
    expect(host('child').dataset).toMatchObject({
      size: 'lg',
      tone: 'danger',
      variant: 'soft',
    });
    expect(Object.isFrozen(TestBed.inject(KRN_COPY_BUTTON_OPTIONS))).toBe(true);
    expect(KRN_COPY_BUTTON_DEFAULT_OPTIONS).toEqual({
      feedbackDuration: 1800,
      size: 'md',
      tone: 'neutral',
      variant: 'outline',
    });
  });

  it('returns settled state to idle and ignores a canceled stale timer', async () => {
    const scheduler = createControlledScheduler();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom() },
        { provide: KRN_PLATFORM, useValue: scheduler.platform },
      ],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'timer');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    await flushSignals();
    fixture.detectChanges();
    const staleHandle = scheduler.latestHandle();

    button.click();
    await flushSignals();
    fixture.detectChanges();
    const currentHandle = scheduler.latestHandle();
    scheduler.run(staleHandle);
    fixture.detectChanges();
    expect(fixture.nativeElement.dataset.state).toBe('copied');

    scheduler.run(currentHandle);
    fixture.detectChanges();
    expect(fixture.nativeElement.dataset.state).toBe('idle');
    expect(
      (fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement).textContent?.trim(),
    ).toBe('');
  });

  it('falls back from invalid duration and never leaves stale feedback without a scheduler', async () => {
    const scheduler = createControlledScheduler();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom() },
        { provide: KRN_PLATFORM, useValue: scheduler.platform },
      ],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'duration');
    fixture.componentRef.setInput('feedbackDuration', -1);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await flushSignals();
    fixture.detectChanges();

    expect(scheduler.delays).toEqual([1800]);

    const noSchedulerPlatform: KrnPlatformAdapter = {
      ...scheduler.platform,
      schedule: () => null,
    };
    fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom() },
        { provide: KRN_PLATFORM, useValue: noSchedulerPlatform },
      ],
    });
    const noSchedulerFixture = TestBed.createComponent(KrnCopyButton);
    noSchedulerFixture.componentRef.setInput('value', 'no-scheduler');
    await noSchedulerFixture.whenStable();

    (noSchedulerFixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await flushSignals();
    noSchedulerFixture.detectChanges();

    expect(noSchedulerFixture.nativeElement.dataset).toMatchObject({
      pending: 'false',
      state: 'idle',
    });
  });

  it('honors disabled state without invoking the writer or submitting a form', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom(writeText) }],
    });

    @Component({
      imports: [KrnCopyButton],
      template: `
        <form (submit)="submits.update(increment)">
          <krn-copy-button disabled value="blocked">Copy</krn-copy-button>
        </form>
      `,
    })
    class DisabledHost {
      readonly submits = signal(0);
      readonly increment = (value: number): number => value + 1;
    }

    const fixture = TestBed.createComponent(DisabledHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(true);
    expect(button.type).toBe('button');
    expect(writeText).not.toHaveBeenCalled();
    expect(fixture.componentInstance.submits()).toBe(0);
  });

  it('resolves leaf labels from a direct lightweight override with instance precedence', async () => {
    const labels: Readonly<KrnCopyLabels> = Object.freeze({
      copy: 'Copier le jeton',
      copying: 'Copie en cours…',
      copied: 'Jeton copié',
      failed: 'Échec de la copie',
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: KRN_CLIPBOARD_WRITER, useValue: writerFrom() },
        { provide: KRN_COPY_LABELS, useValue: labels },
      ],
    });
    const fixture = TestBed.createComponent(KrnCopyButton);
    fixture.componentRef.setInput('value', 'localized');
    fixture.componentRef.setInput('copiedLabel', 'Instance copied');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBeNull();
    expect(button.querySelector('.krn-copy-label')?.textContent?.trim()).toBe('Copier le jeton');
    button.click();
    fixture.detectChanges();
    expect(button.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(
      (fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement).textContent?.trim(),
    ).toBe('Copie en cours…');
    await flushSignals();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('.krn-copy-status') as HTMLElement).textContent?.trim(),
    ).toBe('Instance copied');
  });
});
