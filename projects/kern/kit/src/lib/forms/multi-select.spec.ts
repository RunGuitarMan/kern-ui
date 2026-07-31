import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnFormField } from './form-field';
import type { KrnSelectOption } from './form-types';
import { KrnMultiSelect } from './select-controls';

interface Team {
  readonly id: string;
  readonly name: string;
}

const teams: readonly KrnSelectOption<Team>[] = [
  { value: { id: 'alpha', name: 'Alpha' }, label: 'Alpha' },
  { value: { id: 'beta', name: 'Beta' }, label: 'Beta' },
  { value: { id: 'legacy', name: 'Legacy' }, label: 'Legacy', disabled: true },
];

const identityMatcher = (left: Team, right: Team): boolean => left.id === right.id;

const selectValues = <T>(select: KrnMultiSelect<T>, values: T[]): void => {
  (
    select as unknown as {
      selectValues(values: T[]): void;
    }
  ).selectValues(values);
};

@Component({
  imports: [KrnMultiSelect],
  template: `
    <krn-multi-select
      [identityMatcher]="identityMatcher"
      [options]="options"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class StandaloneMultiSelectHost {
  readonly identityMatcher = identityMatcher;
  readonly options = teams;
  readonly value = signal<readonly Team[]>([{ id: 'alpha', name: 'External Alpha' }]);
  readonly select = viewChild.required<KrnMultiSelect<Team>>(KrnMultiSelect);
}

@Component({
  imports: [KrnFormField, KrnMultiSelect],
  template: `
    <span id="external-label">External team label</span>
    <span id="external-hint">External team hint</span>
    <krn-form-field label="Teams" hint="Choose active teams">
      <krn-multi-select
        id="team-select"
        ariaLabel="Fallback team label"
        ariaLabelledBy="external-label"
        ariaDescribedBy="external-hint"
        tabindex="6"
        [disabled]="disabled()"
        [identityMatcher]="identityMatcher"
        [maxVisible]="maxVisible()"
        [options]="options"
        [readonly]="readOnly()"
        [value]="value"
      />
    </krn-form-field>
  `,
})
class AccessibleMultiSelectHost {
  readonly identityMatcher = identityMatcher;
  readonly options = teams;
  readonly value = teams.map((option) => option.value);
  readonly maxVisible = signal(-1);
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly select = viewChild.required<KrnMultiSelect<Team>>(KrnMultiSelect);
}

describe('KrnMultiSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns standalone values and commits canonical enabled-option changes', async () => {
    const fixture = TestBed.createComponent(StandaloneMultiSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.select();
    const valueChange = vi.fn();
    component.valueChange.subscribe(valueChange);

    selectValues(component, [
      { id: 'alpha', name: 'Equivalent Alpha' },
      { id: 'legacy', name: 'Forged Legacy' },
    ]);
    expect(host.value()).toEqual([{ id: 'alpha', name: 'External Alpha' }]);
    expect(valueChange).not.toHaveBeenCalled();

    host.value.set([{ id: 'alpha', name: 'External Alpha' }, teams[2]!.value]);
    await fixture.whenStable();
    selectValues(component, [
      { id: 'alpha', name: 'Equivalent Alpha' },
      { id: 'beta', name: 'External Beta' },
    ]);
    expect(host.value()).toEqual([teams[0]!.value, teams[1]!.value, teams[2]!.value]);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(valueChange).toHaveBeenLastCalledWith([
      teams[0]!.value,
      teams[1]!.value,
      teams[2]!.value,
    ]);

    selectValues(component, [{ id: 'missing', name: 'Missing' }]);
    selectValues(component, [
      teams[0]!.value,
      teams[1]!.value,
      { id: 'beta', name: 'Duplicate Beta' },
    ]);
    expect(valueChange).toHaveBeenCalledOnce();
  });

  it('composes ARIA, keeps one tab stop, and normalizes visible tokens', async () => {
    const fixture = TestBed.createComponent(AccessibleMultiSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const component = host.select();
    const componentHost = fixture.nativeElement.querySelector('krn-multi-select') as HTMLElement;
    const trigger = fixture.nativeElement.querySelector(
      '.krn-select-trigger--multiple',
    ) as HTMLButtonElement;
    const positiveTabStops = fixture.nativeElement.querySelectorAll('[tabindex="6"]');

    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(positiveTabStops).toHaveLength(1);
    expect(positiveTabStops.item(0)).toBe(trigger);
    expect(trigger.id).toBe('team-select');
    expect(trigger.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-label']),
    );
    expect(trigger.getAttribute('aria-labelledby')).toContain('label');
    expect(trigger.getAttribute('aria-describedby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-hint']),
    );
    expect(trigger.getAttribute('aria-describedby')).toContain('hint');
    expect(trigger.hasAttribute('aria-label')).toBe(false);
    expect(trigger.tabIndex).toBe(6);
    expect(trigger.querySelectorAll('.krn-token')).toHaveLength(1);
    expect(trigger.textContent).toContain('+3');

    host.maxVisible.set(1);
    await fixture.whenStable();
    expect(trigger.querySelectorAll('.krn-token')).toHaveLength(2);
    expect(trigger.textContent).toContain('Alpha');
    expect(trigger.textContent).toContain('+2');

    component.focus();
    expect(document.activeElement).toBe(trigger);

    component.open.set(true);
    host.disabled.set(true);
    await fixture.whenStable();
    expect(component.open()).toBe(false);
    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(trigger.disabled).toBe(true);
    expect(trigger.tabIndex).toBe(-1);

    host.disabled.set(false);
    await fixture.whenStable();
    component.open.set(true);
    host.readOnly.set(true);
    await fixture.whenStable();
    expect(component.open()).toBe(false);
    expect(trigger.getAttribute('aria-readonly')).toBe('true');
  });
});
