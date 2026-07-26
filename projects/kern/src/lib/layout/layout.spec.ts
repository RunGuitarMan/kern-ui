import { Component, signal } from '@angular/core';
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KrnStack } from './flex-layout';
import { KrnResizablePanel, KrnResizablePanels, KrnResizeHandle } from './resizable-panels';

@Component({
  selector: 'krn-test-resizable-host',
  standalone: true,
  imports: [KrnResizablePanels, KrnResizablePanel, KrnResizeHandle],
  template: `
    <krn-resizable-panels [(sizes)]="sizes" [step]="5">
      <krn-resizable-panel ariaLabel="Navigation">A</krn-resizable-panel>
      <krn-resize-handle />
      <krn-resizable-panel ariaLabel="Content">B</krn-resizable-panel>
    </krn-resizable-panels>
  `,
})
class ResizableHost {
  readonly sizes = signal<readonly number[]>([50, 50]);
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
