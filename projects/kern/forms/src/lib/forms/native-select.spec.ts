import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnFormField } from './form-field';
import type { KrnSelectOption } from './form-types';
import { KrnNativeSelect } from './select-controls';

interface Region {
  readonly code: string;
  readonly name: string;
}

const regions: readonly KrnSelectOption<Region>[] = [
  { value: { code: 'eu', name: 'Europe' }, label: 'Europe' },
  { value: { code: 'us', name: 'United States' }, label: 'United States' },
  { value: { code: 'legacy', name: 'Legacy' }, label: 'Legacy', disabled: true },
];

const identityMatcher = (left: Region, right: Region): boolean => left.code === right.code;

@Component({
  imports: [KrnNativeSelect],
  template: `
    <krn-native-select
      [identityMatcher]="identityMatcher"
      [options]="options"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class StandaloneNativeSelectHost {
  readonly identityMatcher = identityMatcher;
  readonly options = regions;
  readonly value = signal<Region | null>({ code: 'eu', name: 'External Europe' });
  readonly select = viewChild.required<KrnNativeSelect<Region>>(KrnNativeSelect);
}

@Component({
  imports: [KrnFormField, KrnNativeSelect],
  template: `
    <span id="external-label">External region label</span>
    <span id="external-hint">External region hint</span>
    <krn-form-field label="Region" hint="Choose an active region">
      <krn-native-select
        id="region-select"
        ariaLabel="Fallback region label"
        ariaLabelledBy="external-label"
        ariaDescribedBy="external-hint"
        tabindex="4"
        [disabled]="disabled()"
        [identityMatcher]="identityMatcher"
        [options]="options"
        [readonly]="readOnly()"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </krn-form-field>
  `,
})
class AccessibleNativeSelectHost {
  readonly identityMatcher = identityMatcher;
  readonly options = regions;
  readonly value = signal<Region | null>(regions[0]!.value);
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly select = viewChild.required<KrnNativeSelect<Region>>(KrnNativeSelect);
}

describe('KrnNativeSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value and emits only accepted canonical changes', async () => {
    const fixture = TestBed.createComponent(StandaloneNativeSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.select();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);

    expect(select.selectedIndex).toBe(1);
    select.dispatchEvent(new Event('change'));
    expect(valueChange).not.toHaveBeenCalled();

    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));
    expect(host.value()).toBe(regions[1]!.value);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith(regions[1]!.value);

    select.selectedIndex = 3;
    select.dispatchEvent(new Event('change'));
    expect(select.selectedIndex).toBe(2);
    expect(host.value()).toBe(regions[1]!.value);
    expect(valueChange).toHaveBeenCalledOnce();

    select.value = 'stale-option';
    select.dispatchEvent(new Event('change'));
    expect(select.selectedIndex).toBe(2);
    expect(valueChange).toHaveBeenCalledOnce();

    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change'));
    expect(host.value()).toBeNull();
    expect(valueChange).toHaveBeenCalledTimes(2);
  });

  it('composes ARIA, keeps one tab stop, and protects readonly interaction', async () => {
    const fixture = TestBed.createComponent(AccessibleNativeSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.select();
    const componentHost = fixture.nativeElement.querySelector('krn-native-select') as HTMLElement;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const positiveTabStops = fixture.nativeElement.querySelectorAll('[tabindex="4"]');

    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(positiveTabStops).toHaveLength(1);
    expect(positiveTabStops.item(0)).toBe(select);
    expect(select.id).toBe('region-select');
    expect(select.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-label']),
    );
    expect(select.getAttribute('aria-labelledby')).toContain('label');
    expect(select.getAttribute('aria-describedby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-hint']),
    );
    expect(select.getAttribute('aria-describedby')).toContain('hint');
    expect(select.hasAttribute('aria-label')).toBe(false);
    expect(select.tabIndex).toBe(4);

    component.focus();
    expect(document.activeElement).toBe(select);
    component.blur();
    expect(document.activeElement).not.toBe(select);

    host.readOnly.set(true);
    await fixture.whenStable();
    const shortcutEvent = new KeyboardEvent('keydown', {
      key: 'l',
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const navigationEvent = new KeyboardEvent('keydown', {
      key: 'F6',
      bubbles: true,
      cancelable: true,
    });
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    select.dispatchEvent(shortcutEvent);
    select.dispatchEvent(tabEvent);
    select.dispatchEvent(navigationEvent);
    select.dispatchEvent(keyboardEvent);
    expect(shortcutEvent.defaultPrevented).toBe(false);
    expect(tabEvent.defaultPrevented).toBe(false);
    expect(navigationEvent.defaultPrevented).toBe(false);
    expect(keyboardEvent.defaultPrevented).toBe(true);
    expect(select.getAttribute('aria-readonly')).toBe('true');

    const focus = vi.spyOn(select, 'focus');
    const pointerEvent = new Event('pointerdown', {
      bubbles: true,
      cancelable: true,
    });
    select.dispatchEvent(pointerEvent);
    expect(pointerEvent.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });

    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));
    expect(host.value()).toBe(regions[0]!.value);
    expect(select.selectedIndex).toBe(1);

    host.disabled.set(true);
    await fixture.whenStable();
    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(select.disabled).toBe(true);
    expect(select.tabIndex).toBe(-1);
  });
});
