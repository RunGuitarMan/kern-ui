import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { KrnButton, KrnIconButton } from './button';
import { KrnToggleButton, KrnToggleGroup } from './button-group';
import { KrnCopyButton } from './copy-button';
import { KrnDropdownButton, KrnSplitButton } from './dropdown-button';

describe('Kern actions', () => {
  it('guards activation while a button is loading', async () => {
    const fixture = TestBed.createComponent(KrnButton);
    const activated = vi.fn();
    fixture.componentInstance.activated.subscribe(activated);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(activated).not.toHaveBeenCalled();
  });

  it('requires the icon button label on the actual native button', async () => {
    const fixture = TestBed.createComponent(KrnIconButton);
    fixture.componentRef.setInput('ariaLabel', 'Archive item');
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Archive item');
  });

  it('coordinates a single-select toggle group', async () => {
    @Component({
      imports: [KrnToggleGroup, KrnToggleButton],
      template: `
        <krn-toggle-group ariaLabel="View">
          <krn-toggle-button value="grid">Grid</krn-toggle-button>
          <krn-toggle-button value="list">List</krn-toggle-button>
        </krn-toggle-group>
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
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-select-trigger, .krn-action',
    ) as HTMLButtonElement;
    trigger.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();

    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
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
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.krn-action') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();
    expect((document.activeElement as HTMLElement | null)?.textContent).toContain('CSV');
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
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector(
      '.krn-action[aria-haspopup="menu"]',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();

    const firstAction = fixture.nativeElement.querySelector(
      '[role="menuitem"]',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(firstAction);
  });

  it('copies through the asynchronous Clipboard API', async () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      const fixture = TestBed.createComponent(KrnCopyButton);
      fixture.componentRef.setInput('value', 'Kern');
      await fixture.whenStable();
      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(writeText).toHaveBeenCalledWith('Kern');
      expect(fixture.componentInstance.state()).toBe('copied');
    } finally {
      if (original) {
        Object.defineProperty(window.navigator, 'clipboard', original);
      } else {
        Reflect.deleteProperty(window.navigator, 'clipboard');
      }
    }
  });
});
