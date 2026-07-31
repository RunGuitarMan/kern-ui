import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnToggleButton } from './toggle-button';
import { KrnToggleGroup } from './toggle-group';
import {
  KRN_TOGGLE_GROUP_DEFAULT_OPTIONS,
  KRN_TOGGLE_GROUP_OPTIONS,
  provideKrnToggleGroupOptions,
} from './toggle-group-options';

@Component({
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <h2 id="formatting-label">Formatting</h2>
    <div
      krnToggleGroup
      aria-labelledby="formatting-label"
      [disabled]="disabled()"
      [multiple]="multiple()"
      [orientation]="orientation()"
      [values]="values()"
      (valuesChange)="recordValues($event)"
    >
      <button krnToggleButton value="bold">Bold</button>
      <button krnToggleButton value="italic">Italic</button>
      <button krnToggleButton value="underline" [disabled]="underlineDisabled()">Underline</button>
    </div>
  `,
})
class ControlledToggleGroupHost {
  readonly disabled = signal(false);
  readonly multiple = signal(false);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly underlineDisabled = signal(false);
  readonly values = signal<readonly string[]>(['italic']);
  readonly valueEvents = signal<readonly (readonly string[])[]>([]);

  recordValues(values: readonly string[]): void {
    this.values.set(values);
    this.valueEvents.update((events) => [...events, values]);
  }
}

@Component({
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <krn-toggle-group [ariaLabel]="label()">
      <button krnToggleButton value="legacy">Legacy</button>
    </krn-toggle-group>
  `,
})
class LegacyToggleGroupHost {
  readonly label = signal<string | null | undefined>('Legacy formatting');
}

@Component({
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <krn-toggle-group [attr.aria-label]="nativeLabel()" [ariaLabel]="label()">
      <button krnToggleButton value="legacy">Legacy</button>
    </krn-toggle-group>
  `,
})
class TransitionalToggleGroupHost {
  readonly nativeLabel = signal('Native formatting');
  readonly label = signal<string | null | undefined>('Temporary legacy formatting');
}

@Component({
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <div krnToggleGroup aria-label="Reorder controls">
      @for (item of items(); track item) {
        <button krnToggleButton [value]="item">{{ item }}</button>
      }
    </div>
  `,
})
class ReorderedToggleGroupHost {
  readonly items = signal<readonly string[]>(['alpha', 'beta', 'gamma']);
}

@Component({
  imports: [KrnToggleButton, KrnToggleGroup],
  providers: [
    provideKrnToggleGroupOptions({
      multiple: true,
      orientation: 'vertical',
    }),
  ],
  template: `
    <div krnToggleGroup aria-label="Scoped controls" [(values)]="values">
      <button krnToggleButton value="one">One</button>
      <button krnToggleButton value="two">Two</button>
    </div>
    <div krnToggleGroup aria-label="Instance controls" orientation="horizontal" [multiple]="false">
      <button krnToggleButton value="override">Override</button>
    </div>
  `,
})
class ToggleGroupOptionsHost {
  readonly values = signal<readonly string[]>([]);
}

function buttons(fixture: { nativeElement: HTMLElement }): readonly HTMLButtonElement[] {
  return [...fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button[krnToggleButton]')];
}

function dispatchKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe('KrnToggleGroup', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('uses a labelled toolbar host with deterministic pressed state and one tab stop', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('div[krnToggleGroup]') as HTMLElement;
    const [bold, italic, underline] = buttons(fixture);

    expect(group.localName).toBe('div');
    expect(group.getAttribute('role')).toBe('toolbar');
    expect(group.getAttribute('aria-labelledby')).toBe('formatting-label');
    expect(group.getAttribute('aria-orientation')).toBe('horizontal');
    expect(group.getAttribute('aria-disabled')).toBeNull();
    expect(group.dataset).toMatchObject({
      multiple: 'false',
      orientation: 'horizontal',
    });
    expect(bold?.getAttribute('aria-pressed')).toBe('false');
    expect(italic?.getAttribute('aria-pressed')).toBe('true');
    expect(underline?.getAttribute('aria-pressed')).toBe('false');
    expect(buttons(fixture).map((button) => button.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('canonicalizes duplicate and overfull controlled values before the next user transition', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    fixture.componentInstance.values.set(['bold', 'bold', null as unknown as string, 'italic']);
    await fixture.whenStable();
    const [bold, italic] = buttons(fixture);

    expect(bold?.getAttribute('aria-pressed')).toBe('true');
    expect(italic?.getAttribute('aria-pressed')).toBe('false');

    italic?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.values()).toEqual(['italic']);
    expect(Object.isFrozen(fixture.componentInstance.values())).toBe(true);
    expect(fixture.componentInstance.valueEvents()).toEqual([['italic']]);
  });

  it('supports immutable multiple selection and optional deselection without duplicate events', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.values.set(['bold', 'bold']);
    await fixture.whenStable();
    const [bold, italic] = buttons(fixture);

    italic?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual(['bold', 'italic']);
    expect(fixture.componentInstance.valueEvents()).toHaveLength(1);

    fixture.componentInstance.multiple.set(false);
    await fixture.whenStable();
    expect(bold?.getAttribute('aria-pressed')).toBe('true');
    expect(italic?.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.componentInstance.valueEvents()).toHaveLength(1);

    fixture.componentInstance.multiple.set(true);
    await fixture.whenStable();
    expect(italic?.getAttribute('aria-pressed')).toBe('true');

    bold?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual(['italic']);
    expect(fixture.componentInstance.valueEvents()).toHaveLength(2);

    italic?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual([]);
    expect(fixture.componentInstance.valueEvents()).toHaveLength(3);
  });

  it('inherits disabled state with native buttons and blocks model transitions', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('div[krnToggleGroup]') as HTMLElement;

    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(buttons(fixture).every((button) => button.disabled)).toBe(true);
    expect(buttons(fixture).every((button) => button.tabIndex === -1)).toBe(true);

    buttons(fixture)[0]?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual(['italic']);
    expect(fixture.componentInstance.valueEvents()).toEqual([]);
  });

  it('moves focus without selection, wraps, and skips disabled items horizontally', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    fixture.componentInstance.values.set([]);
    fixture.componentInstance.underlineDisabled.set(true);
    await fixture.whenStable();
    const [bold, italic, underline] = buttons(fixture);

    bold?.focus();
    const next = dispatchKey(bold as HTMLButtonElement, 'ArrowRight');
    await fixture.whenStable();
    expect(next.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(italic);
    expect(fixture.componentInstance.values()).toEqual([]);
    expect(buttons(fixture).map((button) => button.tabIndex)).toEqual([-1, 0, -1]);

    dispatchKey(italic as HTMLButtonElement, 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(bold);

    dispatchKey(bold as HTMLButtonElement, 'End');
    await fixture.whenStable();
    expect(document.activeElement).toBe(italic);
    expect(underline?.disabled).toBe(true);
  });

  it('uses the vertical axis and preserves unrelated arrow-key behavior', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    fixture.componentInstance.orientation.set('vertical');
    fixture.componentInstance.values.set([]);
    await fixture.whenStable();
    const [bold, italic, underline] = buttons(fixture);
    const group = fixture.nativeElement.querySelector('div[krnToggleGroup]') as HTMLElement;

    expect(group.getAttribute('aria-orientation')).toBe('vertical');
    bold?.focus();
    const ignored = dispatchKey(bold as HTMLButtonElement, 'ArrowRight');
    expect(ignored.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(bold);

    dispatchKey(bold as HTMLButtonElement, 'ArrowDown');
    await fixture.whenStable();
    expect(document.activeElement).toBe(italic);

    dispatchKey(italic as HTMLButtonElement, 'End');
    await fixture.whenStable();
    expect(document.activeElement).toBe(underline);

    dispatchKey(underline as HTMLButtonElement, 'Home');
    await fixture.whenStable();
    expect(document.activeElement).toBe(bold);
  });

  it('reverses horizontal Arrow navigation in RTL', async () => {
    const fixture = TestBed.createComponent(ControlledToggleGroupHost);
    fixture.componentInstance.values.set([]);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('div[krnToggleGroup]') as HTMLElement;
    group.style.direction = 'rtl';
    const [bold, italic, underline] = buttons(fixture);

    bold?.focus();
    dispatchKey(bold as HTMLButtonElement, 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(underline);

    dispatchKey(underline as HTMLButtonElement, 'ArrowLeft');
    await fixture.whenStable();
    expect(document.activeElement).toBe(bold);
    expect(italic?.tabIndex).toBe(-1);
  });

  it('follows current DOM order after projected children are reordered', async () => {
    const fixture = TestBed.createComponent(ReorderedToggleGroupHost);
    await fixture.whenStable();
    fixture.componentInstance.items.set(['gamma', 'beta', 'alpha']);
    await fixture.whenStable();
    const reordered = buttons(fixture);
    const alpha = reordered.find((button) => button.value === 'alpha');
    const gamma = reordered.find((button) => button.value === 'gamma');

    expect(reordered.map((button) => button.value)).toEqual(['gamma', 'beta', 'alpha']);
    alpha?.focus();
    dispatchKey(alpha as HTMLButtonElement, 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(gamma);

    fixture.componentInstance.items.set(['beta', 'alpha']);
    await fixture.whenStable();
    const afterRemoval = buttons(fixture);
    expect(afterRemoval.map((button) => button.value)).toEqual(['beta', 'alpha']);
    expect(afterRemoval.map((button) => button.tabIndex)).toEqual([0, -1]);
  });

  it('keeps the deprecated ariaLabel bridge isolated from native naming attributes', async () => {
    const nativeFixture = TestBed.createComponent(ControlledToggleGroupHost);
    await nativeFixture.whenStable();
    const nativeGroup = nativeFixture.nativeElement.querySelector(
      'div[krnToggleGroup]',
    ) as HTMLElement;
    expect(nativeGroup.getAttribute('aria-labelledby')).toBe('formatting-label');
    expect(nativeGroup.getAttribute('aria-label')).toBeNull();

    const legacyFixture = TestBed.createComponent(LegacyToggleGroupHost);
    await legacyFixture.whenStable();
    const legacyGroup = legacyFixture.nativeElement.querySelector(
      'krn-toggle-group',
    ) as HTMLElement;
    expect(legacyGroup.getAttribute('aria-label')).toBe('Legacy formatting');

    legacyFixture.componentInstance.label.set(undefined);
    await legacyFixture.whenStable();
    expect(legacyGroup.getAttribute('aria-label')).toBeNull();

    const transitionalFixture = TestBed.createComponent(TransitionalToggleGroupHost);
    await transitionalFixture.whenStable();
    const transitionalGroup = transitionalFixture.nativeElement.querySelector(
      'krn-toggle-group',
    ) as HTMLElement;
    expect(transitionalGroup.getAttribute('aria-label')).toBe('Temporary legacy formatting');

    transitionalFixture.componentInstance.nativeLabel.set('Updated native formatting');
    await transitionalFixture.whenStable();
    expect(transitionalGroup.getAttribute('aria-label')).toBe('Updated native formatting');

    transitionalFixture.componentInstance.label.set(undefined);
    await transitionalFixture.whenStable();
    expect(transitionalGroup.getAttribute('aria-label')).toBe('Updated native formatting');

    transitionalFixture.componentInstance.label.set('Collision label');
    await transitionalFixture.whenStable();
    expect(transitionalGroup.getAttribute('aria-label')).toBe('Collision label');

    transitionalFixture.componentInstance.nativeLabel.set('Collision label');
    transitionalFixture.componentInstance.label.set(undefined);
    await transitionalFixture.whenStable();
    expect(transitionalGroup.getAttribute('aria-label')).toBe('Collision label');
    expect(transitionalGroup.getAttribute('data-krn-legacy-aria-label-before')).toBeNull();
  });

  it('resolves frozen scoped defaults and preserves explicit instance overrides', async () => {
    const fixture = TestBed.createComponent(ToggleGroupOptionsHost);
    await fixture.whenStable();
    const [scoped, override] = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'div[krnToggleGroup]',
      ),
    ];

    expect(scoped?.dataset).toMatchObject({
      multiple: 'true',
      orientation: 'vertical',
    });
    expect(override?.dataset).toMatchObject({
      multiple: 'false',
      orientation: 'horizontal',
    });
    expect(KRN_TOGGLE_GROUP_DEFAULT_OPTIONS).toEqual({
      orientation: 'horizontal',
      multiple: false,
    });
    expect(Object.isFrozen(KRN_TOGGLE_GROUP_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(TestBed.inject(KRN_TOGGLE_GROUP_OPTIONS))).toBe(true);
  });
});
