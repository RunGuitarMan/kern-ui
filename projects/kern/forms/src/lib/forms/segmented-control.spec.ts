import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { KrnSegmentOption } from './form-types';
import { KrnSegmentedControl } from './selection-controls';

const viewOptions: readonly KrnSegmentOption<string>[] = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board', disabled: true },
  { value: 'timeline', label: 'Timeline' },
  { value: 'calendar', label: 'Calendar', disabled: true },
];

@Component({
  imports: [KrnSegmentedControl],
  template: `
    <span id="view-label">View</span>
    <span id="view-help">Choose how results are arranged.</span>
    <ng-template #segment>
      <span aria-hidden="true">◆</span>
    </ng-template>
    <krn-segmented-control
      ariaLabel="Fallback view"
      ariaDescribedBy="view-help"
      ariaLabelledBy="view-label"
      orientation="vertical"
      tabindex="3"
      [optionTemplate]="segment"
      [options]="options"
      [readonly]="readOnly()"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class SegmentedHost {
  readonly options = viewOptions;
  readonly readOnly = signal(false);
  readonly value = signal<string | null>('list');
  readonly segmented = viewChild.required(KrnSegmentedControl);
}

describe('KrnSegmentedControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value and emits only accepted canonical changes', async () => {
    const fixture = TestBed.createComponent(SegmentedHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.segmented();
    const buttons = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ];
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);

    expect(buttons.map((button) => button.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    buttons[0]!.click();
    expect(valueChange).not.toHaveBeenCalled();

    buttons[2]!.click();
    await fixture.whenStable();
    expect(host.value()).toBe('timeline');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith('timeline');

    buttons[2]!.click();
    expect(valueChange).toHaveBeenCalledOnce();

    host.value.set('list');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(buttons[0]!.getAttribute('aria-checked')).toBe('true');
  });

  it('composes group semantics and names custom-template segments', async () => {
    const fixture = TestBed.createComponent(SegmentedHost);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    const buttons = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ];

    expect(group.getAttribute('aria-label')).toBeNull();
    expect(group.getAttribute('aria-labelledby')).toBe('view-label');
    expect(group.getAttribute('aria-describedby')).toBe('view-help');
    expect(group.getAttribute('aria-orientation')).toBe('vertical');
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'List',
      'Board',
      'Timeline',
      'Calendar',
    ]);
    expect(buttons.map((button) => button.tabIndex)).toEqual([3, -1, -1, -1]);
  });

  it('navigates from focused segments, skips disabled options, and preserves readonly value', async () => {
    const fixture = TestBed.createComponent(SegmentedHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.segmented();
    const buttons = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ];
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);
    const view = buttons[0]!.ownerDocument.defaultView!;

    buttons[0]!.focus();
    const modifiedArrow = new view.KeyboardEvent('keydown', {
      altKey: true,
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    buttons[0]!.dispatchEvent(modifiedArrow);
    expect(modifiedArrow.defaultPrevented).toBe(false);
    expect(buttons[0]!.ownerDocument.activeElement).toBe(buttons[0]);
    expect(host.value()).toBe('list');
    expect(valueChange).not.toHaveBeenCalled();

    const cancelledArrow = new view.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    cancelledArrow.preventDefault();
    buttons[0]!.dispatchEvent(cancelledArrow);
    expect(buttons[0]!.ownerDocument.activeElement).toBe(buttons[0]);
    expect(host.value()).toBe('list');
    expect(valueChange).not.toHaveBeenCalled();

    buttons[0]!.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'End',
      }),
    );
    expect(host.value()).toBe('timeline');
    expect(buttons[0]!.ownerDocument.activeElement).toBe(buttons[2]);
    expect(valueChange).toHaveBeenCalledOnce();

    host.readOnly.set(true);
    await fixture.whenStable();
    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'ArrowRight',
      }),
    );
    expect(buttons[0]!.ownerDocument.activeElement).toBe(buttons[2]);
    expect(host.value()).toBe('timeline');
    expect(valueChange).toHaveBeenCalledOnce();

    buttons[2]!.dispatchEvent(
      new view.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'ArrowRight',
      }),
    );
    expect(buttons[0]!.ownerDocument.activeElement).toBe(buttons[0]);
    expect(host.value()).toBe('timeline');
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('touches only after focus leaves the radiogroup and forwards focus methods', async () => {
    const fixture = TestBed.createComponent(KrnSegmentedControl);
    fixture.componentRef.setInput('options', viewOptions);
    fixture.componentInstance.writeValue('timeline');
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const buttons = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ];

    component.focus({ preventScroll: true });
    expect(buttons[0]!.ownerDocument.activeElement).toBe(buttons[2]);

    buttons[0]!.focus();
    buttons[2]!.focus();
    expect(touched).not.toHaveBeenCalled();

    component.blur();
    expect(buttons[0]!.ownerDocument.activeElement).not.toBe(buttons[2]);
    expect(touched).toHaveBeenCalledOnce();
  });
});
