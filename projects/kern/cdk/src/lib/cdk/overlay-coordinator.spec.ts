import { InteractivityChecker } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { KrnOverlayCoordinator } from './overlay-coordinator';
import {
  KRN_PLATFORM,
  type KrnCloseWatcher,
  type KrnCloseWatcherFactory,
  type KrnPlatformAdapter,
} from './platform';

class TestCloseWatcher extends EventTarget implements KrnCloseWatcher {
  destroyCalls = 0;

  emitClose(): void {
    this.dispatchEvent(new Event('close'));
  }

  destroy(): void {
    this.destroyCalls += 1;
  }
}

function createPlatform(createCloseWatcher?: KrnCloseWatcherFactory): KrnPlatformAdapter {
  const view = document.defaultView;
  if (!view) throw new Error('Overlay coordinator tests require a browser document.');

  return {
    document,
    isBrowser: true,
    window: view,
    localStorage: null,
    createCloseWatcher,
    matchMedia: () => null,
    requestAnimationFrame: () => null,
    cancelAnimationFrame: () => undefined,
    schedule: () => null,
    cancelScheduled: () => undefined,
    queueMicrotask: (callback) => callback(),
    now: () => 1_000,
  };
}

function createCoordinator(platform: KrnPlatformAdapter): KrnOverlayCoordinator {
  TestBed.configureTestingModule({
    providers: [
      { provide: KRN_PLATFORM, useValue: platform },
      { provide: InteractivityChecker, useValue: { isFocusable: () => true } },
    ],
  });
  return TestBed.inject(KrnOverlayCoordinator);
}

describe('KrnOverlayCoordinator close requests', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.body.style.overflow = '';
  });

  it('keeps exactly one native watcher bound to the top closable overlay', () => {
    const watchers: TestCloseWatcher[] = [];
    const platform = createPlatform(() => {
      const watcher = new TestCloseWatcher();
      watchers.push(watcher);
      return watcher;
    });
    const coordinator = createCoordinator(platform);
    const firstRequest = vi.fn(() => coordinator.deactivate('first', 0, false));
    const secondRequest = vi.fn(() => coordinator.deactivate('second', 0, false));

    coordinator.activate('first', null, false, firstRequest);
    expect(watchers).toHaveLength(1);
    coordinator.activate('second', null, false, secondRequest);
    expect(watchers).toHaveLength(2);
    expect(watchers[0]?.destroyCalls).toBe(1);
    expect(watchers[1]?.destroyCalls).toBe(0);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
    expect(firstRequest).not.toHaveBeenCalled();
    expect(secondRequest).not.toHaveBeenCalled();

    watchers[0]?.emitClose();
    expect(firstRequest).not.toHaveBeenCalled();
    watchers[1]?.emitClose();
    expect(secondRequest).toHaveBeenCalledOnce();
    expect(watchers).toHaveLength(3);
    expect(watchers[1]?.destroyCalls).toBe(1);

    watchers[2]?.emitClose();
    expect(firstRequest).toHaveBeenCalledOnce();
    expect(watchers[2]?.destroyCalls).toBe(1);
  });

  it('updates close behavior without reordering the active stack', () => {
    const watchers: TestCloseWatcher[] = [];
    const coordinator = createCoordinator(
      createPlatform(() => {
        const watcher = new TestCloseWatcher();
        watchers.push(watcher);
        return watcher;
      }),
    );
    const firstRequest = vi.fn();
    const replacementFirstRequest = vi.fn();
    const secondRequest = vi.fn();

    coordinator.activate('first', null, false, firstRequest);
    coordinator.activate('second', null, false, secondRequest);
    coordinator.updateCloseRequest('first', replacementFirstRequest);
    expect(watchers).toHaveLength(2);
    expect(watchers[1]?.destroyCalls).toBe(0);

    coordinator.updateCloseRequest('second', null);
    expect(watchers[1]?.destroyCalls).toBe(1);
    watchers[1]?.emitClose();
    expect(secondRequest).not.toHaveBeenCalled();
    expect(replacementFirstRequest).not.toHaveBeenCalled();

    const closeSecond = vi.fn(() => coordinator.updateCloseRequest('second', null));
    coordinator.updateCloseRequest('second', closeSecond);
    expect(watchers).toHaveLength(3);
    watchers[2]?.emitClose();
    expect(closeSecond).toHaveBeenCalledOnce();
    expect(replacementFirstRequest).not.toHaveBeenCalled();
  });

  it('uses a document Escape fallback only when no native watcher exists', () => {
    const coordinator = createCoordinator(createPlatform(() => null));
    const closeRequest = vi.fn(() => coordinator.updateCloseRequest('dialog', null));
    coordinator.activate('dialog', null, false, closeRequest);

    const prevented = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    prevented.preventDefault();
    document.dispatchEvent(prevented);
    expect(closeRequest).not.toHaveBeenCalled();

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(closeRequest).toHaveBeenCalledOnce();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(closeRequest).toHaveBeenCalledOnce();
  });

  it('prioritizes explicit focus, consumes pointer origins and supports suppression', () => {
    const coordinator = createCoordinator(createPlatform());
    const origin = document.createElement('button');
    const replacement = document.createElement('button');
    document.body.append(origin, replacement);

    try {
      origin.focus();
      origin.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      coordinator.activate('pointer-origin');
      replacement.focus();
      coordinator.deactivate('pointer-origin');
      expect(document.activeElement).toBe(origin);

      origin.focus();
      origin.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      coordinator.activate('explicit-origin', null, replacement);
      origin.focus();
      coordinator.deactivate('explicit-origin');
      expect(document.activeElement).toBe(replacement);

      coordinator.activate('parent-auto-origin');
      origin.focus();
      coordinator.activate('child-auto-origin');
      replacement.focus();
      coordinator.deactivate('child-auto-origin');
      expect(document.activeElement).toBe(origin);
      coordinator.deactivate('parent-auto-origin');
      expect(document.activeElement).toBe(replacement);

      origin.focus();
      origin.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      coordinator.activate('disabled-origin', null, false);
      replacement.focus();
      coordinator.deactivate('disabled-origin');
      expect(document.activeElement).toBe(replacement);

      coordinator.activate('disabled-deactivate', null, origin);
      replacement.focus();
      coordinator.deactivate('disabled-deactivate', 0, false);
      expect(document.activeElement).toBe(replacement);
    } finally {
      origin.remove();
      replacement.remove();
    }
  });

  it('destroys its watcher and restores global state with the injector', () => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'clip';
    const watcher = new TestCloseWatcher();
    const coordinator = createCoordinator(createPlatform(() => watcher));
    coordinator.activate('dialog', null, false, vi.fn());
    expect(document.body.style.overflow).toBe('hidden');

    TestBed.resetTestingModule();
    expect(watcher.destroyCalls).toBe(1);
    expect(document.body.style.overflow).toBe('clip');
    document.body.style.overflow = previousOverflow;
  });
});
