import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KrnAppShell, KrnHeader, KrnSidebar } from './app-shell';
import { KrnCluster, KrnInline, KrnSpacer, KrnStack } from './flex-layout';
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
  it('normalizes spacing and remains shrinkable inside nested layouts', () => {
    const fixture = TestBed.createComponent(KrnStack);
    fixture.componentRef.setInput('gap', 12);
    fixture.componentRef.setInput('align', 'center');
    fixture.componentRef.setInput('justify', 'space-between');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-stack-gap')).toBe('12px');
    expect(host.getAttribute('data-align')).toBe('center');
    expect(host.getAttribute('data-justify')).toBe('space-between');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flexDirection).toBe('column');
    expect(style.getPropertyValue('--krn-stack-align')).toBe('center');
    expect(style.getPropertyValue('--krn-stack-justify')).toBe('space-between');
  });

  it('falls back to the default gap and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnStack);
    fixture.componentRef.setInput('gap', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-stack-gap')).toBe('var(--krn-space-4)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('maps inline wrapping and alignment without escaping nested layouts', () => {
    const fixture = TestBed.createComponent(KrnInline);
    fixture.componentRef.setInput('gap', '2');
    fixture.componentRef.setInput('align', 'baseline');
    fixture.componentRef.setInput('justify', 'end');
    fixture.componentRef.setInput('wrap', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-inline-gap')).toBe('var(--krn-space-2)');
    expect(host.getAttribute('data-align')).toBe('baseline');
    expect(host.getAttribute('data-justify')).toBe('end');
    expect(host.hasAttribute('data-wrap')).toBe(true);
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flexDirection).toBe('row');
    expect(style.flexWrap).toBe('wrap');
    expect(style.getPropertyValue('--krn-inline-align')).toBe('baseline');
    expect(style.getPropertyValue('--krn-inline-justify')).toBe('flex-end');
  });

  it('keeps inline content unwrapped by default and honors native hidden', () => {
    const fixture = TestBed.createComponent(KrnInline);
    fixture.componentRef.setInput('gap', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-inline-gap')).toBe('var(--krn-space-3)');
    expect(host.hasAttribute('data-wrap')).toBe(false);
    expect(style.flexWrap).toBe('nowrap');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('inherits or overrides cluster gaps without escaping nested layouts', () => {
    const fixture = TestBed.createComponent(KrnCluster);
    fixture.componentRef.setInput('gap', '4');
    fixture.componentRef.setInput('rowGap', '');
    fixture.componentRef.setInput('columnGap', 12);
    fixture.componentRef.setInput('align', 'stretch');
    fixture.componentRef.setInput('justify', 'space-evenly');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-cluster-row-gap')).toBe('var(--krn-space-4)');
    expect(host.style.getPropertyValue('--krn-cluster-column-gap')).toBe('12px');
    expect(host.getAttribute('data-align')).toBe('stretch');
    expect(host.getAttribute('data-justify')).toBe('space-evenly');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flexWrap).toBe('wrap');
    expect(style.getPropertyValue('--krn-cluster-align')).toBe('stretch');
    expect(style.getPropertyValue('--krn-cluster-justify')).toBe('space-evenly');
  });

  it('falls back both cluster axes and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnCluster);
    fixture.componentRef.setInput('gap', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-cluster-row-gap')).toBe('var(--krn-space-2)');
    expect(host.style.getPropertyValue('--krn-cluster-column-gap')).toBe('var(--krn-space-2)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('reserves horizontal space without a cross-axis artifact', () => {
    const fixture = TestBed.createComponent(KrnSpacer);
    fixture.componentRef.setInput('axis', 'horizontal');
    fixture.componentRef.setInput('size', 24);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('data-axis')).toBe('horizontal');
    expect(host.style.getPropertyValue('--krn-spacer-size')).toBe('24px');
    expect(style.boxSizing).toBe('border-box');
    expect(style.inlineSize).toBe('var(--krn-spacer-size)');
    expect(style.blockSize).toBe('0px');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flex).toBe('0 0 auto');
    expect(style.pointerEvents).toBe('none');
  });

  it('reserves vertical token space and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnSpacer);
    fixture.componentRef.setInput('size', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.getAttribute('data-axis')).toBe('vertical');
    expect(host.style.getPropertyValue('--krn-spacer-size')).toBe('var(--krn-space-4)');
    expect(style.inlineSize).toBe('0px');
    expect(style.blockSize).toBe('var(--krn-spacer-size)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
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
