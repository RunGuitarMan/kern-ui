import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { KRN_MORE_ACTIONS_LABEL } from '@kern-ui/angular/i18n';
import { KrnDropdownButton, KrnSplitButton } from './dropdown-button';

async function stabilize<T>(fixture: ComponentFixture<T>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  fixture.detectChanges();
}

@Component({
  imports: [KrnSplitButton],
  template: `
    <krn-split-button
      [(open)]="open"
      menuAlign="start"
      menuLabel="Open publishing options"
      menuOffset="5"
      size="lg"
      tone="success"
      variant="outline"
      [disabled]="disabled()"
      [loading]="loading()"
      [matchTriggerWidth]="true"
      (primaryAction)="primaryActivations.update(increment)"
    >
      <span krnLabel>Publish changes</span>
      <button krnMenu type="button" class="publish-now">Publish now</button>
      <button krnMenu type="button" class="save-draft">Save as draft</button>
    </krn-split-button>
    <button type="button" class="outside-focus">Outside</button>
  `,
})
class SplitButtonHost {
  readonly open = signal(false);
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly primaryActivations = signal(0);
  readonly increment = (value: number): number => value + 1;
}

@Component({
  imports: [KrnSplitButton],
  template: `
    <krn-split-button>
      <span krnLabel>Publish</span>
      <button krnMenu type="button">Publish now</button>
    </krn-split-button>
  `,
})
class DefaultLabelSplitButtonHost {}

@Component({
  imports: [KrnDropdownButton, KrnSplitButton],
  template: `
    <krn-split-button class="parent" [(open)]="parentOpen" [loading]="loading()">
      <span krnLabel>Publish</span>
      <div krnMenu role="menuitem" data-krn-menu-keep-open>
        <krn-dropdown-button class="child" [(open)]="childOpen">
          <span krnLabel>Nested alternatives</span>
          <button krnMenu type="button">Nested action</button>
        </krn-dropdown-button>
      </div>
    </krn-split-button>
  `,
})
class NestedSplitButtonHost {
  readonly parentOpen = signal(false);
  readonly childOpen = signal(false);
  readonly loading = signal(false);
}

describe('KrnSplitButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('composes two form-safe native KrnButton segments with stable menu ownership', async () => {
    const fixture = TestBed.createComponent(SplitButtonHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);

    const host = fixture.nativeElement.querySelector('krn-split-button') as HTMLElement;
    const primary = host.querySelector('.krn-split-button__primary') as HTMLButtonElement;
    const menuTrigger = host.querySelector('.krn-split-button__menu-trigger') as HTMLButtonElement;

    expect(host.dataset).toMatchObject({
      loading: 'false',
      menuAlign: 'start',
      open: 'false',
      size: 'lg',
      tone: 'success',
      variant: 'outline',
    });
    expect(host.querySelectorAll('button[krnButton]')).toHaveLength(2);
    expect(host.querySelector('.krn-split-button')).not.toBeNull();
    expect(host.querySelector('.krn-split')).toBeNull();
    expect(primary.type).toBe('button');
    expect(primary.textContent).toContain('Publish changes');
    expect(primary.hasAttribute('aria-haspopup')).toBe(false);
    expect(menuTrigger.type).toBe('button');
    expect(menuTrigger.getAttribute('aria-label')).toBe('Open publishing options');
    expect(menuTrigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(menuTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(menuTrigger.getAttribute('aria-controls')).toMatch(/^krn-.+-menu-\d+$/);

    menuTrigger.click();
    await stabilize(fixture);

    const menu = overlay.querySelector('[role="menu"]') as HTMLElement;
    expect(fixture.componentInstance.open()).toBe(true);
    expect(menu.id).toBe(menuTrigger.getAttribute('aria-controls'));
    expect(menu.getAttribute('aria-labelledby')).toBe(menuTrigger.id);
    expect(
      [...menu.querySelectorAll('[role="menuitem"]')].map((item) => item.textContent?.trim()),
    ).toEqual(['Publish now', 'Save as draft']);
  });

  it('resolves the default menu name through the lightweight i18n boundary', async () => {
    TestBed.overrideProvider(KRN_MORE_ACTIONS_LABEL, {
      useValue: 'Alternative publishing actions',
    });
    const fixture = TestBed.createComponent(DefaultLabelSplitButtonHost);
    await stabilize(fixture);

    const trigger = fixture.nativeElement.querySelector(
      '.krn-split-button__menu-trigger',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toBe('Alternative publishing actions');
  });

  it('closes alternatives before primary activation and blocks disabled activation', async () => {
    const fixture = TestBed.createComponent(SplitButtonHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const host = fixture.nativeElement.querySelector('krn-split-button') as HTMLElement;
    const primary = host.querySelector('.krn-split-button__primary') as HTMLButtonElement;
    const menuTrigger = host.querySelector('.krn-split-button__menu-trigger') as HTMLButtonElement;

    menuTrigger.click();
    await stabilize(fixture);
    expect(overlay.querySelector('[role="menu"]')).not.toBeNull();

    primary.click();
    await stabilize(fixture);
    expect(fixture.componentInstance.primaryActivations()).toBe(1);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();

    fixture.componentInstance.disabled.set(true);
    await stabilize(fixture);
    expect(primary.disabled).toBe(true);
    expect(menuTrigger.disabled).toBe(true);
    primary.click();
    await stabilize(fixture);
    expect(fixture.componentInstance.primaryActivations()).toBe(1);
  });

  it('keeps the loading primary focusable while disabling the alternatives trigger', async () => {
    const fixture = TestBed.createComponent(SplitButtonHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const host = fixture.nativeElement.querySelector('krn-split-button') as HTMLElement;
    const primary = host.querySelector('.krn-split-button__primary') as HTMLButtonElement;
    const menuTrigger = host.querySelector('.krn-split-button__menu-trigger') as HTMLButtonElement;

    menuTrigger.click();
    await stabilize(fixture);
    expect(document.activeElement).toBe(overlay.querySelector('.publish-now') as HTMLButtonElement);

    fixture.componentInstance.loading.set(true);
    await stabilize(fixture);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
    expect(host.dataset['loading']).toBe('true');
    expect(primary.disabled).toBe(false);
    expect(primary.getAttribute('aria-disabled')).toBe('true');
    expect(primary.dataset['loading']).toBe('true');
    expect(menuTrigger.disabled).toBe(true);
    expect(menuTrigger.dataset['loading']).toBe('false');
    expect(document.activeElement).toBe(primary);

    primary.click();
    await stabilize(fixture);
    expect(fixture.componentInstance.primaryActivations()).toBe(0);

    fixture.componentInstance.open.set(true);
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
  });

  it('does not steal focus when an externally opened menu becomes loading without owning focus', async () => {
    const fixture = TestBed.createComponent(SplitButtonHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const outside = fixture.nativeElement.querySelector('.outside-focus') as HTMLButtonElement;

    outside.focus();
    fixture.componentInstance.open.set(true);
    await stabilize(fixture);

    expect(overlay.querySelector('[role="menu"]')).not.toBeNull();
    expect(document.activeElement).toBe(outside);

    fixture.componentInstance.loading.set(true);
    await stabilize(fixture);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('returns focus from a recursively owned nested overlay to the loading primary action', async () => {
    const fixture = TestBed.createComponent(NestedSplitButtonHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const host = fixture.nativeElement.querySelector('krn-split-button') as HTMLElement;
    const primary = host.querySelector('.krn-split-button__primary') as HTMLButtonElement;
    const menuTrigger = host.querySelector('.krn-split-button__menu-trigger') as HTMLButtonElement;

    menuTrigger.click();
    await stabilize(fixture);
    const nestedTrigger = overlay.querySelector(
      '.child > .krn-dropdown > button',
    ) as HTMLButtonElement;
    nestedTrigger.click();
    await stabilize(fixture);

    expect(overlay.querySelectorAll('[role="menu"]')).toHaveLength(2);
    expect((document.activeElement as HTMLElement).textContent).toContain('Nested action');

    fixture.componentInstance.loading.set(true);
    await stabilize(fixture);

    expect(fixture.componentInstance.parentOpen()).toBe(false);
    expect(overlay.querySelectorAll('[role="menu"]')).toHaveLength(0);
    expect(primary.disabled).toBe(false);
    expect(primary.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(primary);
  });
});
