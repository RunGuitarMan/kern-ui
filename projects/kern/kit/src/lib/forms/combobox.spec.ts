import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnFormField } from './form-field';
import { KrnCombobox } from './select-controls';

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'legacy', label: 'Legacy', disabled: true },
] as const;

const selectValues = (combobox: KrnCombobox, values: string[]): void => {
  (
    combobox as unknown as {
      selectValues(values: string[]): void;
    }
  ).selectValues(values);
};

@Component({
  imports: [KrnCombobox],
  template: `
    <krn-combobox
      [options]="options"
      [optionsState]="optionsState()"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class StandaloneComboboxHost {
  readonly options = options;
  readonly optionsState = signal<'ready' | 'loading'>('ready');
  readonly value = signal('alpha');
  readonly combobox = viewChild.required(KrnCombobox);
}

@Component({
  imports: [KrnCombobox],
  template: `<krn-combobox [open]="open()" [options]="options" />`,
})
class ControlledOpenComboboxHost {
  readonly open = signal(false);
  readonly options = options;
  readonly combobox = viewChild.required(KrnCombobox);
}

@Component({
  imports: [KrnCombobox, KrnFormField],
  template: `
    <span id="external-label">External plan label</span>
    <span id="external-hint">External plan hint</span>
    <krn-form-field label="Plan" hint="Choose an active plan">
      <krn-combobox
        id="plan-combobox"
        name="plan"
        ariaLabel="Fallback plan label"
        ariaLabelledBy="external-label"
        ariaDescribedBy="external-hint"
        tabindex="7"
        [disabled]="disabled()"
        [options]="options"
        [readonly]="readOnly()"
        value="alpha"
      />
    </krn-form-field>
  `,
})
class AccessibleComboboxHost {
  readonly options = options;
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly combobox = viewChild.required(KrnCombobox);
}

describe('KrnCombobox', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value and commits only enabled option changes', async () => {
    const fixture = TestBed.createComponent(StandaloneComboboxHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const combobox = host.combobox();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const valueChange = vi.fn();
    const optionSelected = vi.fn();
    combobox.valueChange.subscribe(valueChange);
    combobox.optionSelected.subscribe(optionSelected);

    expect(input.value).toBe('Alpha');
    input.click();
    await fixture.whenStable();
    const currentOption = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="option"]'),
    ].find((option) => option.textContent?.includes('Alpha'));
    expect(currentOption).toBeDefined();
    currentOption!.click();
    await fixture.whenStable();
    expect(combobox.open()).toBe(false);
    expect(valueChange).not.toHaveBeenCalled();
    expect(optionSelected).not.toHaveBeenCalled();

    selectValues(combobox, ['legacy']);
    selectValues(combobox, ['missing']);
    expect(host.value()).toBe('alpha');
    expect(valueChange).not.toHaveBeenCalled();

    input.focus();
    input.value = 'Legacy';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    input.blur();
    await fixture.whenStable();
    expect(input.value).toBe('Alpha');
    expect(host.value()).toBe('alpha');
    expect(valueChange).not.toHaveBeenCalled();

    host.optionsState.set('loading');
    input.focus();
    input.value = 'Remote draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    input.blur();
    await fixture.whenStable();
    expect(input.value).toBe('Alpha');
    expect(valueChange).not.toHaveBeenCalled();
    host.optionsState.set('ready');
    await fixture.whenStable();

    combobox.focus();
    await fixture.whenStable();
    input.value = 'B';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(combobox.open()).toBe(true);
    await fixture.whenStable();
    expect(combobox.open()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(1);
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      }),
    );
    await fixture.whenStable();
    expect(input.getAttribute('aria-activedescendant')).not.toBeNull();
    const openEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(openEnter);
    await fixture.whenStable();
    expect(openEnter.defaultPrevented).toBe(true);
    expect(host.value()).toBe('beta');
    expect(valueChange).toHaveBeenCalledOnce();
    expect(optionSelected).toHaveBeenCalledWith(options[1]);

    const closedEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(closedEnter);
    expect(closedEnter.defaultPrevented).toBe(false);
  });

  it('composes ARIA and delegates the native input interaction API', async () => {
    const fixture = TestBed.createComponent(AccessibleComboboxHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const combobox = host.combobox();
    const componentHost = fixture.nativeElement.querySelector('krn-combobox') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('.krn-combobox-toggle') as HTMLButtonElement;
    const positiveTabStops = fixture.nativeElement.querySelectorAll('[tabindex="7"]');

    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(positiveTabStops).toHaveLength(1);
    expect(positiveTabStops.item(0)).toBe(input);
    expect(input.id).toBe('plan-combobox');
    expect(input.name).toBe('plan');
    expect(input.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-label']),
    );
    expect(input.getAttribute('aria-labelledby')).toContain('label');
    expect(input.getAttribute('aria-describedby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-hint']),
    );
    expect(input.getAttribute('aria-describedby')).toContain('hint');
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect(input.tabIndex).toBe(7);
    expect(toggle.tabIndex).toBe(-1);

    combobox.focus();
    expect(document.activeElement).toBe(input);
    combobox.setSelectionRange(1, 3);
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(3);
    combobox.select();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);

    input.value = 'Uncommitted';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(combobox.open()).toBe(true);
    await fixture.whenStable();
    expect(combobox.open()).toBe(true);
    host.readOnly.set(true);
    await fixture.whenStable();
    expect(combobox.open()).toBe(false);
    expect(input.value).toBe('Alpha');
    expect(input.readOnly).toBe(true);
    expect(toggle.disabled).toBe(true);
    combobox.blur();
    expect(document.activeElement).not.toBe(input);

    host.readOnly.set(false);
    host.disabled.set(true);
    await fixture.whenStable();
    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(input.disabled).toBe(true);
    expect(input.tabIndex).toBe(-1);
  });

  it('cancels deferred Enter closing when the popup state advances or the component dies', async () => {
    const fixture = TestBed.createComponent(ControlledOpenComboboxHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const combobox = fixture.componentInstance.combobox();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    vi.useFakeTimers();

    host.open.set(true);
    fixture.detectChanges();
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    host.open.set(false);
    fixture.detectChanges();
    host.open.set(true);
    fixture.detectChanges();
    expect(combobox.open()).toBe(true);
    vi.runAllTimers();
    expect(combobox.open()).toBe(true);

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    fixture.destroy();
    expect(() => vi.runAllTimers()).not.toThrow();
  });
});
