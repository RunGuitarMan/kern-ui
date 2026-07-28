import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KrnAppShell, KrnHeader, KrnSidebar } from './app-shell';
import { KrnStack } from './flex-layout';
import { KrnGrid } from './grid';
import { KrnResizablePanel, KrnResizablePanels, KrnResizeHandle } from './resizable-panels';

@Component({
  selector: 'krn-test-resizable-host',
  standalone: true,
  imports: [KrnResizablePanels, KrnResizablePanel, KrnResizeHandle],
  template: `
    <krn-resizable-panels [(sizes)]="sizes" [disabled]="disabled()" [step]="5">
      <krn-resizable-panel ariaLabel="Navigation">A</krn-resizable-panel>
      <krn-resize-handle />
      <krn-resizable-panel ariaLabel="Content">B</krn-resizable-panel>
    </krn-resizable-panels>
  `,
})
class ResizableHost {
  readonly sizes = signal<readonly number[]>([50, 50]);
  readonly disabled = signal(false);
}

function pointerEvent(type: string, clientX: number): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
  });
  Object.defineProperties(event, {
    pointerId: { value: 7 },
    pointerType: { value: 'mouse' },
  });
  return event as PointerEvent;
}

describe('Kern layout primitives', () => {
  it('maps spacing tokens to CSS custom properties', () => {
    const fixture = TestBed.createComponent(KrnStack);
    fixture.componentRef.setInput('gap', '6');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).style.getPropertyValue('--krn-stack-gap')).toBe(
      'var(--krn-space-6)',
    );
  });

  it('uses its own inline-size as the responsive grid boundary', () => {
    const fixture = TestBed.createComponent(KrnGrid);
    fixture.componentRef.setInput('columns', 3);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-responsive')).toBe('');
    expect(host.querySelector('.krn-grid__layout')).not.toBeNull();
  });

  it('provides a controlled modal navigation drawer at the mobile breakpoint', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    TestBed.resetTestingModule();
    const mediaQuery = {
      matches: true,
      media: '(max-width: 48rem)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    } as MediaQueryList;

    @Component({
      imports: [KrnAppShell, KrnHeader, KrnSidebar],
      template: `
        <krn-app-shell>
          <krn-header>Workspace</krn-header>
          <krn-sidebar><button type="button">Projects</button></krn-sidebar>
          <p>Workspace content</p>
        </krn-app-shell>
      `,
    })
    class MobileShellHost {}

    await TestBed.configureTestingModule({
      imports: [MobileShellHost],
      providers: [
        { provide: KRN_PLATFORM, useValue: { ...defaultPlatform, matchMedia: () => mediaQuery } },
        {
          provide: InteractivityChecker,
          useValue: {
            isFocusable: (element: HTMLElement) =>
              !element.hasAttribute('disabled') && element.tabIndex >= 0,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MobileShellHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.krn-shell__mobile-trigger',
    ) as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const shell = fixture.debugElement.query(By.directive(KrnAppShell))
      .componentInstance as KrnAppShell;
    const dialog = fixture.nativeElement.querySelector('.krn-shell__navigation') as HTMLElement;
    const close = fixture.nativeElement.querySelector(
      '.krn-shell__mobile-close',
    ) as HTMLButtonElement;
    expect(shell.mobileNavigation()).toBe('auto');
    expect(shell.mobileNavigationOpen()).toBe(true);
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(close);

    const alreadyHandled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    alreadyHandled.preventDefault();
    document.dispatchEvent(alreadyHandled);
    fixture.detectChanges();
    expect(shell.mobileNavigationOpen()).toBe(true);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(escape.defaultPrevented).toBe(true);
    expect(shell.mobileNavigationOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    fixture.destroy();
    fixture.nativeElement.remove();
  });
});

describe('KrnResizablePanels', () => {
  let fixture: ComponentFixture<ResizableHost>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();
    TestBed.tick();
  });

  it('exposes an operable separator and resizes with the keyboard', () => {
    const handle = fixture.nativeElement.querySelector('krn-resize-handle') as HTMLElement;

    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');

    handle.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.sizes()).toEqual([55, 45]);
    expect(handle.getAttribute('aria-valuenow')).toBe('55');
  });

  it('respects adjacent panel minimum sizes', () => {
    const handle = fixture.nativeElement.querySelector('krn-resize-handle') as HTMLElement;

    for (let index = 0; index < 20; index += 1) {
      handle.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          bubbles: true,
          cancelable: true,
        }),
      );
    }
    fixture.detectChanges();

    expect(fixture.componentInstance.sizes()[0]).toBe(10);
    expect(fixture.componentInstance.sizes()[1]).toBe(90);
  });

  it('removes a disabled resize handle from the tab sequence', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('krn-resize-handle') as HTMLElement;
    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.getAttribute('tabindex')).toBe('-1');
  });

  it('tracks pointer movement as a percentage of the panel group', () => {
    const groupDebug = fixture.debugElement.query(By.directive(KrnResizablePanels));
    const handleDebug = fixture.debugElement.query(By.directive(KrnResizeHandle));
    const group = groupDebug.componentInstance as KrnResizablePanels;
    const handle = handleDebug.componentInstance as KrnResizeHandle;
    vi.spyOn(groupDebug.nativeElement as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 500,
      top: 0,
      width: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    group.startPointerResize(pointerEvent('pointerdown', 250), handle);
    group.movePointerResize(pointerEvent('pointermove', 300));
    group.endPointerResize(pointerEvent('pointerup', 300));
    fixture.detectChanges();

    expect(fixture.componentInstance.sizes()).toEqual([60, 40]);
    expect(group.resizing()).toBe(false);
  });
});
