import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnFormField } from './form-field';
import type { KrnSelectOption } from './form-types';
import { KrnSelect } from './select-controls';

interface Plan {
  readonly id: string;
  readonly name: string;
}

const plans: readonly KrnSelectOption<Plan>[] = [
  { value: { id: 'starter', name: 'Starter' }, label: 'Starter' },
  { value: { id: 'pro', name: 'Pro' }, label: 'Pro' },
  { value: { id: 'legacy', name: 'Legacy' }, label: 'Legacy', disabled: true },
];

const identityMatcher = (left: Plan, right: Plan): boolean => left.id === right.id;

const selectValues = <T>(select: KrnSelect<T>, values: T[]): void => {
  (
    select as unknown as {
      selectValues(values: T[]): void;
    }
  ).selectValues(values);
};

@Component({
  imports: [KrnSelect],
  template: `
    <krn-select
      [options]="options"
      [value]="value()"
      [identityMatcher]="identityMatcher"
      (valueChange)="value.set($event)"
    />
  `,
})
class StandaloneSelectHost {
  readonly options = plans;
  readonly identityMatcher = identityMatcher;
  readonly value = signal<Plan | null>({ id: 'starter', name: 'External starter' });
  readonly select = viewChild.required<KrnSelect<Plan>>(KrnSelect);
}

@Component({
  imports: [KrnSelect, ReactiveFormsModule],
  template: `
    <krn-select
      [formControl]="control"
      [options]="options"
      [value]="standaloneValue()"
      [identityMatcher]="identityMatcher"
    />
  `,
})
class AngularOwnedSelectHost {
  readonly options = plans;
  readonly identityMatcher = identityMatcher;
  readonly standaloneValue = signal<Plan | null>(plans[0]!.value);
  readonly control = new FormControl<Plan | null>(plans[1]!.value);
}

@Component({
  imports: [KrnFormField, KrnSelect],
  template: `
    <span id="external-label">External plan label</span>
    <span id="external-hint">External plan hint</span>
    <krn-form-field label="Plan" hint="Choose an active plan">
      <krn-select
        id="plan-select"
        ariaLabel="Fallback plan label"
        ariaLabelledBy="external-label"
        ariaDescribedBy="external-hint"
        tabindex="3"
        [disabled]="disabled()"
        [readonly]="readOnly()"
        [options]="options"
      />
    </krn-form-field>
  `,
})
class AccessibleSelectHost {
  readonly options = plans;
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly select = viewChild.required<KrnSelect<Plan>>(KrnSelect);
}

describe('KrnSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('owns a standalone value and emits only accepted identity changes', async () => {
    const fixture = TestBed.createComponent(StandaloneSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const select = host.select();
    const valueChange = vi.fn();
    const selectionChange = vi.fn();
    select.valueChange.subscribe(valueChange);
    select.selectionChange.subscribe(selectionChange);

    select.open.set(true);
    selectValues(select, [{ id: 'starter', name: 'Equivalent starter' }]);
    expect(valueChange).not.toHaveBeenCalled();
    expect(selectionChange).not.toHaveBeenCalled();
    expect(select.open()).toBe(false);

    select.open.set(true);
    selectValues(select, [{ id: 'pro', name: 'External pro' }]);
    expect(host.value()).toBe(plans[1]!.value);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(selectionChange).toHaveBeenCalledWith(plans[1]);

    selectValues(select, [plans[2]!.value]);
    selectValues(select, [{ id: 'missing', name: 'Missing' }]);
    expect(host.value()).toBe(plans[1]!.value);
    expect(valueChange).toHaveBeenCalledOnce();
    expect(selectionChange).toHaveBeenCalledOnce();
  });

  it('keeps Angular Forms as owner when value APIs are mixed', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(AngularOwnedSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector('.krn-select-trigger') as HTMLButtonElement;

    expect(trigger.textContent).toContain('Pro');
    host.standaloneValue.set(plans[0]!.value);
    await fixture.whenStable();
    expect(trigger.textContent).toContain('Pro');
    expect(host.control.value).toBe(plans[1]!.value);
    expect(warning).toHaveBeenCalledOnce();
  });

  it('composes ARIA ownership, focuses the trigger, and closes when non-interactive', async () => {
    const fixture = TestBed.createComponent(AccessibleSelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const select = host.select();
    const componentHost = fixture.nativeElement.querySelector('krn-select') as HTMLElement;
    const trigger = fixture.nativeElement.querySelector('.krn-select-trigger') as HTMLButtonElement;
    const positiveTabStops = fixture.nativeElement.querySelectorAll('[tabindex="3"]');

    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(positiveTabStops).toHaveLength(1);
    expect(positiveTabStops.item(0)).toBe(trigger);
    expect(trigger.id).toBe('plan-select');
    expect(trigger.getAttribute('aria-labelledby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-label']),
    );
    expect(trigger.getAttribute('aria-labelledby')).toContain('label');
    expect(trigger.getAttribute('aria-describedby')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['external-hint']),
    );
    expect(trigger.getAttribute('aria-describedby')).toContain('hint');
    expect(trigger.hasAttribute('aria-label')).toBe(false);
    expect(trigger.tabIndex).toBe(3);

    select.focus();
    expect(document.activeElement).toBe(trigger);

    select.open.set(true);
    host.disabled.set(true);
    await fixture.whenStable();
    expect(select.open()).toBe(false);
    expect(componentHost.hasAttribute('tabindex')).toBe(false);
    expect(trigger.disabled).toBe(true);
    expect(trigger.tabIndex).toBe(-1);

    host.disabled.set(false);
    await fixture.whenStable();
    select.open.set(true);
    host.readOnly.set(true);
    await fixture.whenStable();
    expect(select.open()).toBe(false);
    expect(trigger.getAttribute('aria-readonly')).toBe('true');
  });
});
