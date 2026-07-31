import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KRN_ENGLISH_TRANSLATIONS, KRN_TRANSLATIONS } from '@kern-ui/angular/core';

import { KrnLoginForm, KrnMultiStepForm, KrnProfileForm } from './form-patterns';
import {
  KrnFilterBar,
  KrnGlobalSearch,
  type KrnNotification,
  KrnNotificationCenter,
  KrnSettingsPanel,
  KrnUserMenu,
} from './product-patterns';

describe('Kern product patterns', () => {
  it('filters and chooses a global-search result', async () => {
    await TestBed.configureTestingModule({ imports: [KrnGlobalSearch] }).compileComponents();
    const fixture = TestBed.createComponent(KrnGlobalSearch);
    const buttonResult = { id: 'button', label: 'Button', keywords: ['action'] } as const;
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentRef.setInput('results', [
      buttonResult,
      { id: 'dialog', label: 'Dialog', keywords: ['overlay'] },
    ]);
    fixture.componentInstance.query.set('action');
    fixture.componentInstance.open.set(true);
    const selected: unknown[] = [];
    fixture.componentInstance.resultSelected.subscribe((value) => selected.push(value));
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement;
    expect(input.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(option.tabIndex).toBe(-1);
    expect(option.textContent).toContain('Button');
    input.focus();
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true });
    option.dispatchEvent(pointerDown);
    expect(pointerDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    option.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.query()).toBe('Button');
    expect(fixture.componentInstance.open()).toBe(false);
    expect(selected).toEqual([buttonResult]);

    const clear = fixture.nativeElement.querySelector('.searchbox button') as HTMLButtonElement;
    clear.focus();
    clear.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.query()).toBe('');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-controls')).toBe(false);
  });

  it('keeps global-search navigation bounded and validates its public data', async () => {
    await TestBed.configureTestingModule({ imports: [KrnGlobalSearch] }).compileComponents();
    const empty = TestBed.createComponent(KrnGlobalSearch);
    empty.componentInstance.activeIndex.set(4);
    empty.componentInstance.query.set('missing');
    empty.componentInstance.open.set(true);
    empty.detectChanges();
    await empty.whenStable();

    const input = empty.nativeElement.querySelector('input') as HTMLInputElement;
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(arrow);
    expect(empty.componentInstance.activeIndex()).toBe(0);
    expect(arrow.defaultPrevented).toBe(false);

    empty.componentRef.setInput('results', [
      { id: 'first', label: 'Item one' },
      { id: 'second', label: 'Item two' },
    ]);
    empty.componentInstance.query.set('item');
    empty.componentInstance.activeIndex.set(Number.NaN);
    empty.detectChanges();
    await empty.whenStable();
    expect(empty.componentInstance.activeIndex()).toBe(0);
    empty.componentInstance.activeIndex.set(1.8);
    empty.detectChanges();
    await empty.whenStable();
    expect(empty.componentInstance.activeIndex()).toBe(1);

    input.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
    );
    expect(empty.componentInstance.open()).toBe(false);

    const duplicate = TestBed.createComponent(KrnGlobalSearch);
    duplicate.componentRef.setInput('results', [
      { id: 'same', label: 'First' },
      { id: ' same ', label: 'Second' },
    ]);
    expect(() => duplicate.detectChanges()).toThrowError(/non-empty unique result ids/);

    const invalidMaximum = TestBed.createComponent(KrnGlobalSearch);
    invalidMaximum.componentRef.setInput('maxResults', 0);
    expect(() => invalidMaximum.detectChanges()).toThrowError(/positive safe integer/);

    const invalidResultsId = TestBed.createComponent(KrnGlobalSearch);
    invalidResultsId.componentRef.setInput('resultsId', 'search results');
    expect(() => invalidResultsId.detectChanges()).toThrowError(
      /single non-whitespace DOM id token/,
    );
  });

  it('keeps filter-bar values canonical and restores focus after clearing', async () => {
    await TestBed.configureTestingModule({ imports: [KrnFilterBar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnFilterBar);
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentRef.setInput('activeLabel', () => '   ');
    fixture.componentRef.setInput('filters', [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'open', label: 'Open', count: 2 },
          { value: 'closed', label: 'Closed', count: 0 },
        ],
      },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const status = element.querySelector('.filter-status') as HTMLElement;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent?.trim()).toBe('');

    fixture.componentInstance.values.set({ status: 'open' });
    fixture.detectChanges();
    const select = element.querySelector('select') as HTMLSelectElement;
    const badge = element.querySelector('krn-badge') as HTMLElement;
    expect(
      element.querySelector('[role="group"]')?.getAttribute('aria-label')?.trim(),
    ).toBeTruthy();
    expect(select.value).toBe('open');
    expect(status.textContent?.trim()).toBeTruthy();
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.textContent?.trim()).toBeTruthy();

    select.value = '';
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.values()).toEqual({});

    fixture.componentInstance.values.set({ status: 'closed' });
    fixture.detectChanges();
    const clear = element.querySelector('button') as HTMLButtonElement;
    clear.focus();
    clear.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toEqual({});
    expect(document.activeElement).toBe(select);
  });

  it('rejects inconsistent filter-bar definitions and controlled values', async () => {
    await TestBed.configureTestingModule({ imports: [KrnFilterBar] }).compileComponents();
    const duplicate = TestBed.createComponent(KrnFilterBar);
    duplicate.componentRef.setInput('filters', [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'same', label: 'First' },
          { value: ' same ', label: 'Second' },
        ],
      },
    ]);
    expect(() => duplicate.detectChanges()).toThrowError(/non-empty unique option values/);

    const invalidValue = TestBed.createComponent(KrnFilterBar);
    invalidValue.componentRef.setInput('filters', [
      {
        id: 'status',
        label: 'Status',
        options: [{ value: 'open', label: 'Open' }],
      },
    ]);
    invalidValue.componentInstance.values.set({ status: 'missing' });
    expect(() => invalidValue.detectChanges()).toThrowError(/is not an option/);
  });

  it('opens the user menu, moves focus to its first action, and closes on selection', async () => {
    @Component({
      imports: [KrnUserMenu],
      template: `
        <krn-user-menu name="Avery Cole">
          <button role="menuitem" type="button">Profile</button>
          <button role="menuitem" type="button">Sign out</button>
        </krn-user-menu>
      `,
    })
    class UserMenuHost {}

    const fixture = TestBed.createComponent(UserMenuHost);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const firstAction = fixture.nativeElement.querySelector(
      '[role="menuitem"]',
    ) as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(firstAction).not.toBeNull();
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
    expect(document.activeElement).toBe(firstAction);

    firstAction.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('normalizes the user-menu name and handles menuitem variants and disabled items', async () => {
    @Component({
      imports: [KrnUserMenu],
      template: `
        <krn-user-menu name="  Avery Cole  " menuAriaLabel="   ">
          <button
            role="menuitemradio"
            aria-checked="false"
            aria-disabled="true"
            type="button"
            (click)="disabledActions += 1"
          >
            Disabled workspace
          </button>
          <button role="menuitemcheckbox" aria-checked="false" type="button">Compact mode</button>
        </krn-user-menu>
      `,
    })
    class UserMenuVariantsHost {
      disabledActions = 0;
    }

    const fixture = TestBed.createComponent(UserMenuVariantsHost);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const element = fixture.nativeElement as HTMLElement;
    const menu = element.querySelector('[role="menu"]') as HTMLElement;
    const items = element.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]');
    expect(trigger.querySelector('strong')?.textContent).toBe('Avery Cole');
    expect(menu.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect([...items].map((item) => item.tabIndex)).toEqual([-1, -1]);
    expect(document.activeElement).toBe(items[1]);

    items[0]?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.disabledActions).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();

    const instance = fixture.debugElement.query(By.directive(KrnUserMenu))
      .componentInstance as KrnUserMenu;
    items[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await fixture.whenStable();
    expect(instance.open()).toBe(false);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    const reopenedItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[role="menuitemcheckbox"]',
    );
    reopenedItem?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    await fixture.whenStable();
    expect(instance.open()).toBe(false);

    instance.open.set(true);
    fixture.detectChanges();
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(instance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('rejects an empty user-menu name', async () => {
    await TestBed.configureTestingModule({ imports: [KrnUserMenu] }).compileComponents();
    const fixture = TestBed.createComponent(KrnUserMenu);
    fixture.componentRef.setInput('name', '   ');
    expect(() => fixture.detectChanges()).toThrowError(/non-empty name/);
  });

  it('renders notification-center structure with machine-readable time and stable selection', async () => {
    await TestBed.configureTestingModule({ imports: [KrnNotificationCenter] }).compileComponents();
    const notification: KrnNotification = {
      id: 'release',
      title: 'Release completed',
      detail: 'Version 0.2.0 is available.',
      timestamp: 'Two minutes ago',
      dateTime: '2026-07-31T15:30:00Z',
      read: false,
      tone: 'success',
    };
    const fixture = TestBed.createComponent(KrnNotificationCenter);
    fixture.componentRef.setInput('heading', '  Notifications  ');
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentRef.setInput('unreadLabel', () => '   ');
    fixture.componentRef.setInput('unreadStateLabel', '   ');
    fixture.componentRef.setInput('notifications', [notification]);
    const selected: KrnNotification[] = [];
    fixture.componentInstance.notificationSelected.subscribe((value) => selected.push(value));
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const list = element.querySelector('ol') as HTMLOListElement;
    const markAll = element.querySelector('header button') as HTMLButtonElement;
    const badge = element.querySelector('krn-badge') as HTMLElement;
    expect(element.querySelector('h2')?.textContent).toBe('Notifications');
    expect(element.querySelector('section')?.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(markAll.getAttribute('aria-controls')).toBe(list.id);
    expect(badge.getAttribute('aria-live')).toBe('polite');
    expect(badge.textContent?.trim()).toBeTruthy();
    expect(element.querySelector('.sr-only')?.textContent?.trim()).toBeTruthy();
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe(notification.dateTime);

    element.querySelector<HTMLButtonElement>('li button')?.click();
    expect(selected).toEqual([notification]);
  });

  it('rejects invalid notification-center data at the public boundary', async () => {
    await TestBed.configureTestingModule({ imports: [KrnNotificationCenter] }).compileComponents();
    const duplicate = TestBed.createComponent(KrnNotificationCenter);
    duplicate.componentRef.setInput('notifications', [
      { id: 'same', title: 'First', detail: 'Detail', timestamp: 'Now', read: false },
      { id: ' same ', title: 'Second', detail: 'Detail', timestamp: 'Now', read: true },
    ]);
    expect(() => duplicate.detectChanges()).toThrowError(/non-empty unique notification ids/);

    const invalidContent = TestBed.createComponent(KrnNotificationCenter);
    invalidContent.componentRef.setInput('notifications', [
      { id: 'invalid', title: ' ', detail: 'Detail', timestamp: 'Now', read: false },
    ]);
    expect(() => invalidContent.detectChanges()).toThrowError(/non-empty title/);

    const invalidDateTime = TestBed.createComponent(KrnNotificationCenter);
    invalidDateTime.componentRef.setInput('notifications', [
      {
        id: 'invalid-date',
        title: 'Invalid date',
        detail: 'Detail',
        timestamp: 'Soon',
        dateTime: 'soon',
        read: false,
      },
    ]);
    expect(() => invalidDateTime.detectChanges()).toThrowError(/valid ISO dateTime/);
  });

  it('preserves unread announcements and valid early ISO years with blank translations', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnNotificationCenter],
      providers: [
        {
          provide: KRN_TRANSLATIONS,
          useValue: {
            ...KRN_ENGLISH_TRANSLATIONS,
            patterns: {
              ...KRN_ENGLISH_TRANSLATIONS.patterns,
              unread: '   ',
              unreadCount: () => '   ',
            },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KrnNotificationCenter);
    fixture.componentRef.setInput('notifications', [
      {
        id: 'archive',
        title: 'Archive created',
        detail: 'Historical data is ready.',
        timestamp: 'Long ago',
        dateTime: '0099-01-01',
        read: false,
      },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('krn-badge')?.textContent?.trim()).toBe('1 unread notification');
    expect(element.querySelector('.sr-only')?.textContent?.trim()).toBe('Unread');
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe('0099-01-01');
  });

  it('composes settings with the coordinated drawer contract', async () => {
    await TestBed.configureTestingModule({ imports: [KrnSettingsPanel] }).compileComponents();
    const fixture = TestBed.createComponent(KrnSettingsPanel);
    fixture.componentRef.setInput('heading', 'Workspace settings');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const title = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(title.textContent).toContain('Workspace settings');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('emits only valid typed login credentials', async () => {
    await TestBed.configureTestingModule({ imports: [KrnLoginForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnLoginForm);
    const submitted: unknown[] = [];
    fixture.componentInstance.submitted.subscribe((value) => submitted.push(value));
    fixture.componentInstance.form.setValue({
      email: 'person@example.com',
      password: 'strong-password',
      remember: true,
    });
    fixture.componentInstance.submit();

    expect(submitted).toEqual([
      { email: 'person@example.com', password: 'strong-password', remember: true },
    ]);
  });

  it('keeps pattern field ids instance-safe and reacts to validation inputs', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnLoginForm, KrnProfileForm],
    }).compileComponents();
    const first = TestBed.createComponent(KrnLoginForm);
    const second = TestBed.createComponent(KrnLoginForm);
    first.componentRef.setInput('minimumPasswordLength', 16);
    first.componentRef.setInput('emailLabel', 'Work email');
    await Promise.all([first.whenStable(), second.whenStable()]);

    const firstEmail = first.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const secondEmail = second.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    expect(firstEmail.id).not.toBe(secondEmail.id);
    expect(
      first.nativeElement.querySelector(`label[for="${firstEmail.id}"]`)?.textContent,
    ).toContain('Work email');

    first.componentInstance.form.controls.password.setValue('short-password');
    await first.whenStable();
    expect(first.componentInstance.form.controls.password.hasError('minlength')).toBe(true);

    const profile = TestBed.createComponent(KrnProfileForm);
    profile.componentRef.setInput('bioMaxLength', 5);
    await profile.whenStable();
    profile.componentInstance.form.controls.bio.setValue('too long');
    expect(profile.componentInstance.form.controls.bio.hasError('maxlength')).toBe(true);
  });

  it('prevents advancing an invalid multi-step form', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMultiStepForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnMultiStepForm);
    fixture.componentRef.setInput('steps', [
      { id: 'account', label: 'Account', valid: false },
      { id: 'profile', label: 'Profile', valid: true },
    ]);
    await fixture.whenStable();

    fixture.componentInstance.next();
    expect(fixture.componentInstance.current()).toBe(0);
    fixture.componentRef.setInput('steps', [
      { id: 'account', label: 'Account', valid: true },
      { id: 'profile', label: 'Profile', valid: true },
    ]);
    fixture.componentInstance.next();
    expect(fixture.componentInstance.current()).toBe(1);
  });
});
