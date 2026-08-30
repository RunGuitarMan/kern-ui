import { Component } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { KrnToggleButton } from './toggle-button';
import { KrnToggleGroup } from './toggle-group';
import { KrnDropdownButton, KrnSplitButton } from './dropdown-button';

describe('Kern actions', () => {
  it('coordinates a single-select toggle group', async () => {
    @Component({
      imports: [KrnToggleGroup, KrnToggleButton],
      template: `
        <div krnToggleGroup aria-label="View">
          <button krnToggleButton value="grid">Grid</button>
          <button krnToggleButton value="list">List</button>
        </div>
      `,
    })
    class ToggleHost {}

    const fixture = TestBed.createComponent(ToggleHost);
    await fixture.whenStable();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[1]?.click();
    await fixture.whenStable();

    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('opens and closes a dropdown menu with Escape', async () => {
    @Component({
      imports: [KrnDropdownButton],
      template: `
        <krn-dropdown-button>
          <span krnLabel>Export</span>
          <button krnMenu role="menuitem">CSV</button>
        </krn-dropdown-button>
      `,
    })
    class DropdownHost {}

    const fixture: ComponentFixture<DropdownHost> = TestBed.createComponent(DropdownHost);
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-select-trigger, .krn-action',
    ) as HTMLButtonElement;
    trigger.click();
    await fixture.whenStable();
    expect(overlayContainer.querySelector('[role="menu"]')).not.toBeNull();

    const menu = overlayContainer.querySelector('[role="menu"]') as HTMLElement;
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    menu.dispatchEvent(escape);
    await fixture.whenStable();
    expect(escape.defaultPrevented).toBe(true);
    expect(overlayContainer.querySelector('[role="menu"]')).toBeNull();
  });

  it('opens a dropdown from the keyboard and moves focus into its menu', async () => {
    @Component({
      imports: [KrnDropdownButton],
      template: `
        <krn-dropdown-button>
          <span krnLabel>Export</span>
          <button krnMenu role="menuitem">CSV</button>
          <button krnMenu role="menuitem">JSON</button>
        </krn-dropdown-button>
      `,
    })
    class KeyboardDropdownHost {}

    const fixture = TestBed.createComponent(KeyboardDropdownHost);
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.krn-action') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(overlayContainer.querySelector('[role="menu"]')).not.toBeNull();
    expect((document.activeElement as HTMLElement | null)?.textContent).toContain('CSV');
  });

  it('closes a dropdown when focus leaves its connected overlay', async () => {
    @Component({
      imports: [KrnDropdownButton],
      template: `
        <krn-dropdown-button>
          <span krnLabel>Export</span>
          <button krnMenu role="menuitem">CSV</button>
        </krn-dropdown-button>
        <button type="button" class="after-menu">After menu</button>
      `,
    })
    class FocusOutDropdownHost {}

    const fixture = TestBed.createComponent(FocusOutDropdownHost);
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.krn-action') as HTMLButtonElement).click();
    await fixture.whenStable();

    const menu = overlayContainer.querySelector('[role="menu"]') as HTMLElement;
    const next = fixture.nativeElement.querySelector('.after-menu') as HTMLButtonElement;
    menu.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: next,
      }),
    );
    await fixture.whenStable();

    expect(overlayContainer.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes dropdown and split menus after Tab exits without trapping focus', async () => {
    @Component({
      imports: [KrnDropdownButton, KrnSplitButton],
      template: `
        <krn-dropdown-button>
          <span krnLabel>Export</span>
          <button krnMenu role="menuitem">CSV</button>
        </krn-dropdown-button>
        <krn-split-button>
          <span krnLabel>Publish</span>
          <button krnMenu role="menuitem">Publish now</button>
        </krn-split-button>
      `,
    })
    class TabbingMenuButtonsHost {}

    const fixture = TestBed.createComponent(TabbingMenuButtonsHost);
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
    const triggers = fixture.nativeElement.querySelectorAll(
      '.krn-action[aria-haspopup="menu"]',
    ) as NodeListOf<HTMLButtonElement>;

    for (const [index, shiftKey] of [false, true].entries()) {
      triggers[index]?.click();
      await fixture.whenStable();
      const menu = overlayContainer.querySelector('[role="menu"]') as HTMLElement;
      expect(menu).not.toBeNull();

      const tab = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
        shiftKey,
      });
      menu.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(triggers[index]);
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();

      expect(overlayContainer.querySelector('[role="menu"]')).toBeNull();
    }
  });

  it('moves focus from a split-button trigger into its first menu action', async () => {
    @Component({
      imports: [KrnSplitButton],
      template: `
        <krn-split-button>
          <span krnLabel>Publish</span>
          <button krnMenu role="menuitem">Publish now</button>
          <button krnMenu role="menuitem">Save as draft</button>
        </krn-split-button>
      `,
    })
    class KeyboardSplitButtonHost {}

    const fixture = TestBed.createComponent(KeyboardSplitButtonHost);
    const overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-action[aria-haspopup="menu"]',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();

    const firstAction = overlayContainer.querySelector('[role="menuitem"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(firstAction);
  });
});
