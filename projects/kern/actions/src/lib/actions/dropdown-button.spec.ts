import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { KrnDropdownButton } from './dropdown-button';
import {
  KRN_MENU_BUTTON_DEFAULT_OPTIONS,
  KRN_MENU_BUTTON_OPTIONS,
  provideKrnMenuButtonOptions,
} from './dropdown-button-options';

async function stabilize<T>(fixture: ComponentFixture<T>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  fixture.detectChanges();
}

function keydown(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
  });
  target.dispatchEvent(event);
  return event;
}

@Component({
  imports: [KrnDropdownButton],
  template: `
    <button type="button" class="before">Before</button>
    <krn-dropdown-button
      [(open)]="open"
      [closeOnSelection]="closeOnSelection()"
      [disabled]="disabled()"
      [loading]="loading()"
    >
      <span krnLabel>Bulk actions</span>
      <button krnMenu type="button" class="assign">Assign owner</button>
      <div krnMenu class="legacy-container">
        <button type="button" class="archive">Archive</button>
        <button
          type="button"
          class="locked"
          aria-disabled="true"
          (click)="lockedActivations.update(increment)"
        >
          Locked policy
        </button>
        <button type="button" class="native-disabled" disabled>Unavailable action</button>
      </div>
      <button krnMenu type="button" role="menuitemcheckbox" aria-checked="false" class="notify">
        Notify owner
      </button>
      <button krnMenu type="button" role="menuitemradio" aria-checked="false" class="json">
        JSON export
      </button>
      <button krnMenu type="button" data-krn-menu-keep-open class="keep-open">
        Keep menu open
      </button>
    </krn-dropdown-button>
    <button type="button" class="outside" (click)="outsideClicks.update(increment)">Outside</button>
  `,
})
class DropdownHost {
  readonly open = signal(false);
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly closeOnSelection = signal(true);
  readonly outsideClicks = signal(0);
  readonly lockedActivations = signal(0);
  readonly increment = (value: number): number => value + 1;
}

@Component({
  selector: 'krn-dropdown-options-child',
  imports: [KrnDropdownButton],
  providers: [provideKrnMenuButtonOptions({ tone: 'danger', menuOffset: 12 })],
  template: `
    <krn-dropdown-button data-testid="child">
      <span krnLabel>Child</span>
      <button krnMenu type="button">Child action</button>
    </krn-dropdown-button>
  `,
})
class DropdownOptionsChild {}

@Component({
  imports: [DropdownOptionsChild, KrnDropdownButton],
  providers: [
    provideKrnMenuButtonOptions({
      matchTriggerWidth: true,
      menuAlign: 'start',
      size: 'lg',
      variant: 'outline',
    }),
  ],
  template: `
    <krn-dropdown-button data-testid="parent">
      <span krnLabel>Parent</span>
      <button krnMenu type="button">Parent action</button>
    </krn-dropdown-button>
    <krn-dropdown-button
      data-testid="instance"
      matchTriggerWidth="false"
      menuAlign="end"
      menuOffset="4"
      size="sm"
      tone="success"
      variant="soft"
    >
      <span krnLabel>Instance</span>
      <button krnMenu type="button">Instance action</button>
    </krn-dropdown-button>
    <krn-dropdown-options-child />
  `,
})
class DropdownOptionsHost {}

@Component({
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button class="parent" [(open)]="parentOpen">
      <span krnLabel>Parent menu</span>
      <div krnMenu role="menuitem" data-krn-menu-keep-open>
        <krn-dropdown-button class="child" [(open)]="childOpen">
          <span krnLabel>Nested menu</span>
          <button krnMenu type="button">Nested action</button>
        </krn-dropdown-button>
      </div>
    </krn-dropdown-button>
  `,
})
class NestedDropdownHost {
  readonly parentOpen = signal(false);
  readonly childOpen = signal(false);
}

@Component({
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button [(open)]="open">
      <span krnLabel>Keyboard actions</span>
      <button
        krnMenu
        type="button"
        class="native-action"
        (click)="nativeActivations.update(increment)"
      >
        Native action
      </button>
      <div
        krnMenu
        role="menuitem"
        class="custom-action"
        (click)="customActivations.update(increment)"
      >
        Custom action
      </div>
    </krn-dropdown-button>
  `,
})
class KeyboardActivationDropdownHost {
  readonly open = signal(false);
  readonly nativeActivations = signal(0);
  readonly customActivations = signal(0);
  readonly increment = (value: number): number => value + 1;
}

@Component({
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button [(open)]="open">
      <span krnLabel>Dynamic actions</span>
      <button krnMenu type="button">Stable action</button>
      @if (showDynamic()) {
        <button krnMenu type="button" class="dynamic-action" [hidden]="hideDynamic()">
          Dynamic action
        </button>
      }
    </krn-dropdown-button>
  `,
})
class DynamicDropdownHost {
  readonly open = signal(false);
  readonly showDynamic = signal(false);
  readonly hideDynamic = signal(false);
}

@Component({
  imports: [KrnDropdownButton],
  template: `
    <krn-dropdown-button>
      <span krnLabel>Visibility actions</span>
      <div krnMenu>
        <button type="button" class="visible-first">Visible first</button>
        <button type="button" class="display-none" style="display: none">Display none</button>
        <button type="button" class="visibility-hidden" style="visibility: hidden">
          Visibility hidden
        </button>
        <fieldset disabled>
          <button type="button" class="fieldset-disabled">Disabled fieldset</button>
        </fieldset>
        <details>
          <button type="button" class="collapsed-details">Collapsed details</button>
        </details>
        <button type="button" class="visible-last">Visible last</button>
      </div>
    </krn-dropdown-button>
  `,
})
class FocusabilityDropdownHost {}

describe('KrnDropdownButton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders one form-safe native KrnButton trigger with deterministic ARIA ownership', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const host = fixture.nativeElement.querySelector('krn-dropdown-button') as HTMLElement;
    const trigger = host.querySelector('button[krnButton]') as HTMLButtonElement;

    expect(host.querySelectorAll(':scope .krn-dropdown > button')).toHaveLength(1);
    expect(trigger.type).toBe('button');
    expect(trigger.textContent).toContain('Bulk actions');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toMatch(/^krn-.+-menu-\d+$/);
    expect(trigger.id).toMatch(/^krn-.+-menu-button-trigger-\d+$/);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();

    trigger.click();
    await stabilize(fixture);

    const menu = overlay.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.id).toBe(trigger.getAttribute('aria-controls'));
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(host.dataset).toMatchObject({
      menuAlign: 'end',
      open: 'true',
      size: 'md',
      tone: 'brand',
      variant: 'solid',
    });
  });

  it('normalizes direct and legacy projected actions into one roving ARIA menu', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    (fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement).click();
    await stabilize(fixture);

    const items = Array.from(
      overlay.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
      ),
    );
    const assign = overlay.querySelector('.assign') as HTMLButtonElement;
    const archive = overlay.querySelector('.archive') as HTMLButtonElement;
    const locked = overlay.querySelector('.locked') as HTMLButtonElement;
    const unavailable = overlay.querySelector('.native-disabled') as HTMLButtonElement;

    expect(items.map((item) => item.textContent?.trim())).toEqual([
      'Assign owner',
      'Archive',
      'Locked policy',
      'Unavailable action',
      'Notify owner',
      'JSON export',
      'Keep menu open',
    ]);
    expect(assign.getAttribute('role')).toBe('menuitem');
    expect(archive.getAttribute('role')).toBe('menuitem');
    expect(unavailable.getAttribute('role')).toBe('menuitem');
    expect(items.filter((item) => item.tabIndex === 0)).toEqual([assign]);
    expect(document.activeElement).toBe(assign);

    keydown(assign, 'ArrowDown');
    expect(document.activeElement).toBe(archive);
    keydown(archive, 'ArrowDown');
    expect(document.activeElement).toBe(locked);
    keydown(locked, 'End');
    expect((document.activeElement as HTMLElement).textContent).toContain('Keep menu open');
    keydown(document.activeElement as HTMLElement, 'Home');
    expect(document.activeElement).toBe(assign);
    expect(items.filter((item) => item.tabIndex === 0)).toEqual([assign]);
  });

  it('supports first-character typeahead across all supported menuitem roles', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const trigger = fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement;
    keydown(trigger, 'ArrowDown');
    await stabilize(fixture);

    const assign = overlay.querySelector('.assign') as HTMLButtonElement;
    const json = overlay.querySelector('.json') as HTMLButtonElement;
    const event = keydown(assign, 'j');

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(json);
    expect(json.tabIndex).toBe(0);
    expect(assign.tabIndex).toBe(-1);
  });

  it('preserves native Enter/Space and activates custom menuitem roles from the keyboard', async () => {
    const fixture = TestBed.createComponent(KeyboardActivationDropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const trigger = fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement;

    trigger.click();
    await stabilize(fixture);
    const nativeAction = overlay.querySelector('.native-action') as HTMLButtonElement;
    expect(document.activeElement).toBe(nativeAction);

    const nativeEnter = keydown(nativeAction, 'Enter');
    const nativeSpace = keydown(nativeAction, ' ');
    expect(nativeEnter.defaultPrevented).toBe(false);
    expect(nativeSpace.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.open()).toBe(true);

    nativeAction.click();
    await stabilize(fixture);
    expect(fixture.componentInstance.nativeActivations()).toBe(1);
    expect(fixture.componentInstance.open()).toBe(false);

    trigger.click();
    await stabilize(fixture);
    const customAction = overlay.querySelector('.custom-action') as HTMLElement;
    keydown(overlay.querySelector('.native-action') as HTMLElement, 'ArrowDown');
    expect(document.activeElement).toBe(customAction);

    const customEnter = keydown(customAction, 'Enter');
    await stabilize(fixture);
    expect(customEnter.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.customActivations()).toBe(1);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await stabilize(fixture);
    keydown(overlay.querySelector('.native-action') as HTMLElement, 'ArrowDown');
    const customSpace = keydown(overlay.querySelector('.custom-action') as HTMLElement, ' ');
    await stabilize(fixture);
    expect(customSpace.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.customActivations()).toBe(2);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('normalizes dynamic items and recovers focus when the active item is hidden or removed', async () => {
    const fixture = TestBed.createComponent(DynamicDropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    (fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement).click();
    await stabilize(fixture);
    const stable = overlay.querySelector('[role="menuitem"]') as HTMLButtonElement;

    fixture.componentInstance.showDynamic.set(true);
    await stabilize(fixture);

    let dynamic = overlay.querySelector('.dynamic-action') as HTMLButtonElement;
    expect(dynamic.getAttribute('role')).toBe('menuitem');
    expect(dynamic.tabIndex).toBe(-1);

    keydown(stable, 'ArrowDown');
    expect(document.activeElement).toBe(dynamic);

    fixture.componentInstance.hideDynamic.set(true);
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(document.activeElement).toBe(stable);
    expect(stable.tabIndex).toBe(0);
    expect(dynamic.tabIndex).toBe(-1);

    fixture.componentInstance.hideDynamic.set(false);
    await stabilize(fixture);
    keydown(stable, 'ArrowDown');
    expect(document.activeElement).toBe(dynamic);

    fixture.componentInstance.showDynamic.set(false);
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(document.activeElement).toBe(stable);
    expect(stable.tabIndex).toBe(0);

    fixture.componentInstance.showDynamic.set(true);
    await stabilize(fixture);
    dynamic = overlay.querySelector('.dynamic-action') as HTMLButtonElement;
    expect(dynamic.getAttribute('role')).toBe('menuitem');
    expect(dynamic.tabIndex).toBe(-1);

    dynamic.click();
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('excludes CSS-hidden and structurally disabled items from roving focus', async () => {
    const fixture = TestBed.createComponent(FocusabilityDropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    (fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement).click();
    await stabilize(fixture);

    const first = overlay.querySelector('.visible-first') as HTMLButtonElement;
    const last = overlay.querySelector('.visible-last') as HTMLButtonElement;
    const skipped = [
      '.display-none',
      '.visibility-hidden',
      '.fieldset-disabled',
      '.collapsed-details',
    ].map((selector) => overlay.querySelector(selector) as HTMLButtonElement);

    expect(document.activeElement).toBe(first);
    expect(skipped.every((item) => item.tabIndex === -1)).toBe(true);
    keydown(first, 'ArrowDown');
    expect(document.activeElement).toBe(last);
    expect(last.tabIndex).toBe(0);
  });

  it('closes only for an enabled selection and restores focus to the trigger', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const trigger = fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement;

    trigger.click();
    await stabilize(fixture);
    (overlay.querySelector('.locked') as HTMLButtonElement).click();
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.lockedActivations()).toBe(0);

    (overlay.querySelector('[role="menu"]') as HTMLElement).click();
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);

    (overlay.querySelector('.keep-open') as HTMLButtonElement).click();
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);

    fixture.componentInstance.closeOnSelection.set(false);
    await stabilize(fixture);
    (overlay.querySelector('.archive') as HTMLButtonElement).click();
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);

    fixture.componentInstance.closeOnSelection.set(true);
    await stabilize(fixture);
    (overlay.querySelector('.archive') as HTMLButtonElement).click();
    await stabilize(fixture);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps loading focusable, rejects disabled/external open, and closes an active menu', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const trigger = fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement;

    trigger.focus();
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.open.set(true);
    await stabilize(fixture);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();

    trigger.click();
    keydown(trigger, 'ArrowDown');
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.open.set(true);
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(trigger.disabled).toBe(true);

    fixture.componentInstance.disabled.set(false);
    await stabilize(fixture);
    trigger.click();
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    fixture.componentInstance.loading.set(true);
    await stabilize(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('lets the same outside click activate its target while closing the menu', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    (fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement).click();
    await stabilize(fixture);

    (fixture.nativeElement.querySelector('.outside') as HTMLButtonElement).click();
    await stabilize(fixture);

    expect(fixture.componentInstance.outsideClicks()).toBe(1);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes on Tab and moves focus relative to the trigger despite portal DOM order', async () => {
    const fixture = TestBed.createComponent(DropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const trigger = fixture.nativeElement.querySelector('button[krnButton]') as HTMLButtonElement;

    trigger.click();
    await stabilize(fixture);
    const firstItem = overlay.querySelector('.assign') as HTMLButtonElement;
    const forward = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    });
    firstItem.dispatchEvent(forward);
    await stabilize(fixture);

    expect(forward.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.focus();
    trigger.click();
    await stabilize(fixture);
    const backward = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: true,
    });
    (overlay.querySelector('.assign') as HTMLButtonElement).dispatchEvent(backward);
    await stabilize(fixture);

    expect(backward.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps a parent menu open while focus moves into an owned nested overlay', async () => {
    const fixture = TestBed.createComponent(NestedDropdownHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const parentTrigger = fixture.nativeElement.querySelector(
      '.parent > .krn-dropdown > button',
    ) as HTMLButtonElement;
    parentTrigger.click();
    await stabilize(fixture);

    const nestedTrigger = overlay.querySelector(
      '.child > .krn-dropdown > button',
    ) as HTMLButtonElement;
    nestedTrigger.click();
    await stabilize(fixture);

    const menus = overlay.querySelectorAll('[role="menu"]');
    expect(menus).toHaveLength(2);
    expect(fixture.componentInstance.parentOpen()).toBe(true);
    expect(fixture.componentInstance.childOpen()).toBe(true);
    expect((document.activeElement as HTMLElement).textContent).toContain('Nested action');

    (
      overlay.querySelectorAll('[role="menu"]')[1]?.querySelector('button') as HTMLButtonElement
    ).click();
    await stabilize(fixture);
    expect(fixture.componentInstance.parentOpen()).toBe(true);
    expect(fixture.componentInstance.childOpen()).toBe(false);
    expect(overlay.querySelectorAll('[role="menu"]')).toHaveLength(1);

    nestedTrigger.click();
    await stabilize(fixture);
    expect(overlay.querySelectorAll('[role="menu"]')).toHaveLength(2);
    keydown(overlay.querySelectorAll('[role="menu"]')[1]!, 'Escape');
    await stabilize(fixture);
    expect(fixture.componentInstance.parentOpen()).toBe(true);
    expect(fixture.componentInstance.childOpen()).toBe(false);
    expect(overlay.querySelectorAll('[role="menu"]')).toHaveLength(1);
    expect(document.activeElement).toBe(nestedTrigger);
  });

  it('inherits immutable scoped options and lets instances override them', async () => {
    const fixture = TestBed.createComponent(DropdownOptionsHost);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await stabilize(fixture);
    const find = (id: string): HTMLElement =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    const trigger = (id: string): HTMLButtonElement =>
      find(id).querySelector('button[krnButton]') as HTMLButtonElement;

    expect(trigger('parent').dataset).toMatchObject({
      size: 'lg',
      tone: 'brand',
      variant: 'outline',
    });
    expect(find('parent').dataset).toMatchObject({ menuAlign: 'start' });
    expect(trigger('child').dataset).toMatchObject({
      size: 'lg',
      tone: 'danger',
      variant: 'outline',
    });
    expect(find('child').dataset).toMatchObject({ menuAlign: 'start' });
    expect(trigger('instance').dataset).toMatchObject({
      size: 'sm',
      tone: 'success',
      variant: 'soft',
    });
    expect(find('instance').dataset).toMatchObject({ menuAlign: 'end' });
    expect(Object.isFrozen(TestBed.inject(KRN_MENU_BUTTON_OPTIONS))).toBe(true);
    expect(KRN_MENU_BUTTON_DEFAULT_OPTIONS).toEqual({
      size: 'md',
      variant: 'solid',
      tone: 'brand',
      menuAlign: 'end',
      menuOffset: 8,
      matchTriggerWidth: false,
    });

    trigger('parent').click();
    await stabilize(fixture);
    expect(overlay.querySelector('[role="menu"]')?.getAttribute('data-match-trigger-width')).toBe(
      'true',
    );
  });
});
