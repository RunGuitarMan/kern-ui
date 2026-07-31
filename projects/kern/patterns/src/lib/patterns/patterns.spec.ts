import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_ENGLISH_TRANSLATIONS, KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { KrnDrawer } from '@kern-ui/angular/kit';

import { KrnLoginForm, KrnMultiStepForm, KrnProfileForm } from './form-patterns';
import {
  KrnCrudToolbar,
  KrnDashboardWidget,
  KrnFilterBar,
  KrnGlobalSearch,
  KrnMasterDetailLayout,
  KrnMobileNavigation,
  type KrnNotification,
  KrnNotificationCenter,
  KrnPageHeader,
  KrnResponsiveApplicationShell,
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

  it('renders a semantically labelled page header with normalized copy', async () => {
    await TestBed.configureTestingModule({ imports: [KrnPageHeader] }).compileComponents();
    const fixture = TestBed.createComponent(KrnPageHeader);
    fixture.componentRef.setInput('heading', '  Account overview  ');
    fixture.componentRef.setInput('eyebrow', '   ');
    fixture.componentRef.setInput('description', '  Current balances and activity.  ');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const header = element.querySelector('header') as HTMLElement;
    const heading = element.querySelector('h1') as HTMLHeadingElement;
    const description = element.querySelector('p') as HTMLParagraphElement;
    const index = element.querySelector('.index') as HTMLElement;
    expect(heading.textContent).toBe('Account overview');
    expect(header.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(header.getAttribute('aria-describedby')).toBe(description.id);
    expect(description.textContent).toBe('Current balances and activity.');
    expect(element.querySelector('.eyebrow')).toBeNull();
    expect(index.getAttribute('aria-hidden')).toBe('true');
    expect(header.hasAttribute('data-index')).toBe(true);
    const componentStyles = (
      KrnPageHeader as unknown as { ɵcmp: { styles: readonly string[] } }
    ).ɵcmp.styles.join('\n');
    expect(componentStyles).toMatch(
      /@container \(max-width: 42rem\) \{[\s\S]*?\.frame\[data-index\][^{]*\{\s*grid-template-columns: 1fr;/,
    );
  });

  it('rejects a blank page-header heading', async () => {
    await TestBed.configureTestingModule({ imports: [KrnPageHeader] }).compileComponents();
    const fixture = TestBed.createComponent(KrnPageHeader);
    fixture.componentRef.setInput('heading', '   ');
    expect(() => fixture.detectChanges()).toThrowError(/non-empty heading/);
  });

  it('announces crud-toolbar selection changes from a persistent status region', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCrudToolbar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCrudToolbar);
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentRef.setInput('selectedLabel', () => '   ');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const status = element.querySelector('.selection-status') as HTMLElement;
    expect(element.getAttribute('role')).toBe('toolbar');
    expect(element.getAttribute('aria-orientation')).toBe('horizontal');
    expect(element.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent?.trim()).toContain('0');

    fixture.componentRef.setInput('selectedCount', 2);
    fixture.detectChanges();
    expect(element.hasAttribute('data-bulk')).toBe(true);
    expect(status.textContent?.trim()).toBeTruthy();
    expect(element.querySelector('strong')?.getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('selectedCount', 0);
    fixture.detectChanges();
    expect(element.hasAttribute('data-bulk')).toBe(false);
    expect(status.textContent?.trim()).toContain('0');
  });

  it('rejects an invalid crud-toolbar selected count', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCrudToolbar] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCrudToolbar);
    fixture.componentRef.setInput('selectedCount', -1);
    expect(() => fixture.detectChanges()).toThrowError(/non-negative safe integer/);
  });

  it('uses responsive labelled regions for master-detail layout', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMasterDetailLayout] }).compileComponents();
    const fixture = TestBed.createComponent(KrnMasterDetailLayout);
    fixture.componentRef.setInput('masterLabel', '   ');
    fixture.componentRef.setInput('detailLabel', '  Account detail  ');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const master = element.querySelector('aside') as HTMLElement;
    const detail = element.querySelector('section') as HTMLElement;
    expect(master.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(detail.getAttribute('aria-label')).toBe('Account detail');
    expect(element.querySelector('main')).toBeNull();
    expect(element.hasAttribute('data-detail-open')).toBe(false);

    let compact = true;
    const styleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(
        (target) =>
          ({ display: compact && target === master ? 'none' : 'block' }) as CSSStyleDeclaration,
      );
    try {
      master.focus();
      fixture.componentInstance.detailOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(element.hasAttribute('data-detail-open')).toBe(true);
      expect(document.activeElement).toBe(detail);

      compact = false;
      detail.focus();
      fixture.componentInstance.detailOpen.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(detail);
    } finally {
      styleSpy.mockRestore();
    }

    const componentStyles = (
      KrnMasterDetailLayout as unknown as { ɵcmp: { styles: readonly string[] } }
    ).ɵcmp.styles.join('\n');
    expect(componentStyles).toMatch(
      /container-type: inline-size;[\s\S]*?@container \(max-width: 42rem\) \{[\s\S]*?\.layout[^{]*\{\s*grid-template-columns: 1fr;/,
    );
  });

  it('provides a labelled, height-filling dashboard widget without an empty footer gap', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDashboardWidget] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDashboardWidget);
    fixture.componentRef.setInput('heading', '  Annual recurring revenue  ');
    fixture.componentRef.setInput('eyebrow', '  Portfolio  ');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.getAttribute('role')).toBe('region');
    expect(element.getAttribute('aria-label')).toBe('Annual recurring revenue');
    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Annual recurring revenue');
    expect(element.querySelector('.eyebrow')?.textContent?.trim()).toBe('Portfolio');
    expect(element.querySelector('.footer')?.matches(':empty')).toBe(true);

    const componentStyles = (
      KrnDashboardWidget as unknown as { ɵcmp: { styles: readonly string[] } }
    ).ɵcmp.styles.join('\n');
    expect(componentStyles).toMatch(/\[hidden\][^{]*\{\s*display: none;/);
    expect(componentStyles).toMatch(/\.footer[^{]*\{[^}]*margin-block-start: auto;/);
    expect(componentStyles).toContain('@media (forced-colors: active)');
  });

  it('rejects a blank dashboard-widget heading', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDashboardWidget] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDashboardWidget);
    fixture.componentRef.setInput('heading', '   ');
    expect(() => fixture.detectChanges()).toThrowError(/heading must be a non-empty string/);
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
    fixture.componentRef.setInput('heading', '  Workspace settings  ');
    fixture.componentRef.setInput('closeLabel', '   ');
    fixture.componentRef.setInput('initialFocus', 'surface');
    fixture.componentRef.setInput('closeOnEscape', false);
    fixture.componentInstance.open.set(true);
    const closeReasons: string[] = [];
    fixture.componentInstance.closed.subscribe((reason) => closeReasons.push(reason));
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const title = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(title.textContent).toContain('Workspace settings');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    const drawer = fixture.debugElement.query(By.directive(KrnDrawer))
      .componentInstance as KrnDrawer;
    expect(drawer.initialFocus()).toBe('surface');
    expect(drawer.closeOnEscape()).toBe(false);
    expect(
      (fixture.nativeElement.querySelector('.close') as HTMLButtonElement)
        .getAttribute('aria-label')
        ?.trim(),
    ).toBeTruthy();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(fixture.componentInstance.open()).toBe(true);

    (fixture.nativeElement.querySelector('.close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(closeReasons).toEqual(['action']);
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

  it('keeps login labels and error references valid across loading and validation states', async () => {
    await TestBed.configureTestingModule({ imports: [KrnLoginForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnLoginForm);
    fixture.componentRef.setInput('emailLabel', '   ');
    fixture.componentRef.setInput('submitLabel', '   ');
    fixture.componentRef.setInput('recoveryHref', '   ');
    fixture.componentRef.setInput('errorMessage', '   ');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const form = element.querySelector('form') as HTMLFormElement;
    const email = element.querySelector('input[type="email"]') as HTMLInputElement;
    const submit = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(element.querySelector(`label[for="${email.id}"]`)?.textContent?.trim()).toBeTruthy();
    expect(submit.textContent?.trim()).toBeTruthy();
    expect(email.required).toBe(true);
    expect((element.querySelector('input[type="password"]') as HTMLInputElement).required).toBe(
      true,
    );
    expect(submit.disabled).toBe(false);
    expect(email.hasAttribute('aria-describedby')).toBe(false);
    expect(email.getAttribute('autocapitalize')).toBe('none');
    expect(email.spellcheck).toBe(false);
    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('[role="alert"]')).toBeNull();

    submit.click();
    fixture.detectChanges();
    const errorId = email.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(element.querySelector(`#${errorId}`)?.getAttribute('role')).toBe('alert');

    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(submit.disabled).toBe(false);
    expect(submit.getAttribute('aria-disabled')).toBe('true');
    expect(submit.textContent?.trim()).toBeTruthy();
    expect(element.querySelector('[aria-live="polite"]')?.textContent?.trim()).toBeTruthy();
  });

  it('rejects an invalid login password-length contract', async () => {
    await TestBed.configureTestingModule({ imports: [KrnLoginForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnLoginForm);
    fixture.componentRef.setInput('minimumPasswordLength', Number.NaN);
    expect(() => fixture.detectChanges()).toThrowError(/positive safe integer/);
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

  it('keeps profile labels, errors, save focus, and typed output coherent', async () => {
    await TestBed.configureTestingModule({ imports: [KrnProfileForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnProfileForm);
    fixture.componentRef.setInput('nameLabel', '   ');
    fixture.componentRef.setInput('saveLabel', '   ');
    fixture.componentRef.setInput('timezones', [
      { value: ' Europe/London ', label: ' London ' },
      { value: 'Europe/Berlin', label: 'Berlin' },
    ]);
    fixture.componentRef.setInput('value', {
      name: '',
      role: 'Engineer',
      bio: '',
      timezone: 'Europe/London',
    });
    const saved: unknown[] = [];
    fixture.componentInstance.saved.subscribe((value) => saved.push(value));
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const form = element.querySelector('form') as HTMLFormElement;
    const name = element.querySelector('input[autocomplete="name"]') as HTMLInputElement;
    const submit = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(name.required).toBe(true);
    expect(element.querySelector(`label[for="${name.id}"]`)?.textContent?.trim()).toBeTruthy();
    expect(name.hasAttribute('aria-describedby')).toBe(false);
    expect(submit.disabled).toBe(false);
    expect(submit.textContent?.trim()).toBeTruthy();

    submit.click();
    fixture.detectChanges();
    const errorId = name.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(element.querySelector(`#${errorId}`)?.getAttribute('role')).toBe('alert');
    expect(saved).toEqual([]);

    fixture.componentInstance.form.controls.timezone.setValue(' Europe/London ');
    expect(fixture.componentInstance.form.controls.timezone.hasError('unavailable')).toBe(true);
    fixture.componentInstance.form.controls.timezone.setValue('Europe/London');
    fixture.componentInstance.form.controls.name.setValue('Ada Lovelace');
    fixture.componentInstance.form.controls.name.markAsDirty();
    fixture.detectChanges();
    submit.focus();
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    expect(document.activeElement).toBe(submit);
    expect(submit.getAttribute('aria-disabled')).toBe('true');
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(element.querySelector('[role="status"]')?.textContent?.trim()).toBeTruthy();

    fixture.componentRef.setInput('saving', false);
    fixture.detectChanges();
    submit.click();
    fixture.detectChanges();
    expect(saved).toEqual([
      {
        name: 'Ada Lovelace',
        role: 'Engineer',
        bio: '',
        timezone: 'Europe/London',
      },
    ]);
    expect(fixture.componentInstance.form.dirty).toBe(true);
    expect(document.activeElement).toBe(submit);

    fixture.componentRef.setInput('value', saved[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.form.pristine).toBe(true);
  });

  it('rejects invalid profile limits and timezone identities', async () => {
    await TestBed.configureTestingModule({ imports: [KrnProfileForm] }).compileComponents();
    const invalidLimit = TestBed.createComponent(KrnProfileForm);
    invalidLimit.componentRef.setInput('bioMaxLength', Number.POSITIVE_INFINITY);
    expect(() => invalidLimit.detectChanges()).toThrowError(/non-negative safe integer/);

    const duplicateTimezones = TestBed.createComponent(KrnProfileForm);
    duplicateTimezones.componentRef.setInput('timezones', [
      { value: 'UTC', label: 'Universal' },
      { value: ' UTC ', label: 'Duplicate' },
    ]);
    expect(() => duplicateTimezones.detectChanges()).toThrowError(/non-empty unique values/);
  });

  it('reports profile bio and timezone values that fall outside current constraints', async () => {
    await TestBed.configureTestingModule({ imports: [KrnProfileForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnProfileForm);
    fixture.componentRef.setInput('value', {
      name: 'Ada Lovelace',
      role: '',
      bio: 'Long biography',
      timezone: ' Removed/Timezone ',
    });
    fixture.componentRef.setInput('bioMaxLength', 4);
    fixture.componentRef.setInput('timezones', [{ value: 'UTC', label: 'UTC' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const bio = element.querySelector('textarea') as HTMLTextAreaElement;
    const timezone = element.querySelector('select') as HTMLSelectElement;
    expect(bio.getAttribute('aria-invalid')).toBe('true');
    expect(bio.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    expect(
      element
        .querySelector(`#${bio.getAttribute('aria-describedby')?.split(' ')[1]}`)
        ?.textContent?.trim(),
    ).toBeTruthy();
    expect(timezone.value).toBe('');
    expect(timezone.getAttribute('aria-invalid')).toBe('true');
    expect(
      element.querySelector(`#${timezone.getAttribute('aria-describedby')}`)?.textContent?.trim(),
    ).toBeTruthy();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('prevents advancing an invalid multi-step form', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMultiStepForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnMultiStepForm);
    fixture.componentRef.setInput('steps', [
      { id: 'account', label: 'Account', valid: false },
      { id: 'profile', label: 'Profile', valid: true },
    ]);
    await fixture.whenStable();

    const futureStep = (fixture.nativeElement as HTMLElement).querySelectorAll('li')[1] as
      HTMLLIElement | undefined;
    expect(futureStep?.hasAttribute('data-complete')).toBe(false);
    expect(futureStep?.querySelector('button > span')?.textContent?.trim()).toBe('2');

    fixture.componentInstance.next();
    expect(fixture.componentInstance.current()).toBe(0);
    fixture.componentRef.setInput('steps', [
      { id: 'account', label: 'Account', valid: true },
      { id: 'profile', label: 'Profile', valid: true },
    ]);
    fixture.componentInstance.next();
    expect(fixture.componentInstance.current()).toBe(1);
  });

  it('reconciles multi-step state and exposes responsive, focus-safe navigation', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMultiStepForm] }).compileComponents();
    const fixture = TestBed.createComponent(KrnMultiStepForm);
    fixture.componentRef.setInput('steps', [
      { id: ' account ', label: ' Account ', valid: true },
      { id: 'profile', label: ' Profile ', description: ' Details ', valid: true },
    ]);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentRef.setInput('continueLabel', '   ');
    fixture.componentInstance.current.set(Number.NaN);
    fixture.componentInstance.furthestStep.set(99);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const nav = element.querySelector('nav') as HTMLElement;
    expect(fixture.componentInstance.current()).toBe(0);
    expect(fixture.componentInstance.furthestStep()).toBe(1);
    expect(element.getAttribute('data-orientation')).toBe('vertical');
    expect(element.style.getPropertyValue('--krn-step-count')).toBe('2');
    expect(nav.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(element.querySelector('strong')?.textContent).toBe('Account');
    expect(element.querySelector('small')?.textContent).toBe('Details');
    expect(element.querySelector('footer .primary')?.textContent?.trim()).toBeTruthy();

    fixture.componentInstance.next();
    fixture.detectChanges();
    await fixture.whenStable();
    const heading = element.querySelector('section h2') as HTMLHeadingElement;
    expect(fixture.componentInstance.current()).toBe(1);
    expect(document.activeElement).toBe(heading);
    expect(element.querySelector('[aria-live="polite"]')?.textContent).toContain('2');

    const componentStyles = (
      KrnMultiStepForm as unknown as { ɵcmp: { styles: readonly string[] } }
    ).ɵcmp.styles.join('\n');
    expect(componentStyles).toContain('container-type: inline-size');
    expect(componentStyles).toMatch(/\[data-orientation=["']vertical["']\]/);
    expect(componentStyles).toMatch(/:not\(\[data-orientation=["']vertical["']\]\)/);
    expect(componentStyles).toContain('@media (forced-colors: active)');
  });

  it('rejects invalid multi-step identities and boolean states', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMultiStepForm] }).compileComponents();
    const empty = TestBed.createComponent(KrnMultiStepForm);
    empty.componentRef.setInput('steps', []);
    expect(() => empty.detectChanges()).toThrowError(/at least one step/);

    const duplicate = TestBed.createComponent(KrnMultiStepForm);
    duplicate.componentRef.setInput('steps', [
      { id: 'same', label: 'First' },
      { id: ' same ', label: 'Second' },
    ]);
    expect(() => duplicate.detectChanges()).toThrowError(/non-empty unique ids/);

    const invalidState = TestBed.createComponent(KrnMultiStepForm);
    invalidState.componentRef.setInput('steps', [
      { id: 'state', label: 'State', valid: 'yes' as unknown as boolean },
    ]);
    expect(() => invalidState.detectChanges()).toThrowError(/states must be boolean/);
  });

  it('provides scoped, scroll-safe mobile navigation for native actions and links', async () => {
    @Component({
      imports: [KrnMobileNavigation],
      template: `
        <krn-mobile-navigation ariaLabel="   ">
          <a href="#home" aria-current="true">Home</a>
          <button type="button" disabled>Search</button>
          <a href="#empty" aria-current="">Empty current</a>
          <span><button type="button">Nested action</button></span>
        </krn-mobile-navigation>
      `,
    })
    class MobileNavigationHost {}

    const fixture = TestBed.createComponent(MobileNavigationHost);
    await fixture.whenStable();
    const navigation = fixture.nativeElement.querySelector('krn-mobile-navigation') as HTMLElement;
    expect(navigation.getAttribute('role')).toBe('navigation');
    expect(navigation.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(navigation.querySelector('a')?.getAttribute('aria-current')).toBe('true');

    const componentStyles = (
      KrnMobileNavigation as unknown as { ɵcmp: { styles: readonly string[] } }
    ).ɵcmp.styles.join('\n');
    expect(componentStyles).not.toContain('::ng-deep');
    expect(componentStyles).toContain('krn-mobile-navigation > :where(a, button):focus-visible');
    expect(componentStyles).not.toMatch(/krn-mobile-navigation\s+:where\(a, button\)/);
    expect(componentStyles).toMatch(
      /\[aria-current\]:not\(\[aria-current=["']?false["']?\]\):not\(\[aria-current=["']?["']?\]\)/,
    );
    expect(componentStyles).toContain('> button:disabled');
    expect(componentStyles).toContain('overflow-x: auto');
    expect(componentStyles).toContain('@media (forced-colors: active)');
  });

  it('coordinates responsive shell navigation as a focus-safe mobile modal', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    TestBed.resetTestingModule();
    let viewportListener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      matches: true,
      media: '(max-width: 48rem)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        viewportListener = listener as (event: MediaQueryListEvent) => void;
      },
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    } as MediaQueryList;
    await TestBed.configureTestingModule({
      imports: [KrnResponsiveApplicationShell],
      providers: [
        { provide: KRN_PLATFORM, useValue: { ...defaultPlatform, matchMedia: () => mediaQuery } },
        {
          provide: InteractivityChecker,
          useValue: {
            isFocusable: (element: HTMLElement) =>
              !element.hasAttribute('disabled') && element.tabIndex >= 0,
          },
        },
      ],
    }).compileComponents();

    const restoreTarget = document.createElement('button');
    restoreTarget.type = 'button';
    document.body.append(restoreTarget);
    const fixture = TestBed.createComponent(KrnResponsiveApplicationShell);
    document.body.append(fixture.nativeElement);
    fixture.componentRef.setInput('mainId', 'workspace-main');
    fixture.componentRef.setInput('navigationLabel', '   ');
    fixture.componentRef.setInput('closeNavigationLabel', '   ');
    fixture.detectChanges();
    restoreTarget.focus();

    fixture.componentInstance.navigationOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const element = fixture.nativeElement as HTMLElement;
    const overlay = element.querySelector('.navigation-overlay') as HTMLElement;
    const dialog = element.querySelector('aside') as HTMLElement;
    const main = element.querySelector('main') as HTMLElement;
    const close = element.querySelector('.navigation-close') as HTMLButtonElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(close.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(main.id).toBe('workspace-main');
    expect(document.activeElement).toBe(close);
    expect(overlay.inert).not.toBe(true);
    expect(main.inert).toBe(true);

    overlay.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(fixture.componentInstance.navigationOpen()).toBe(false);
    expect(document.activeElement).toBe(restoreTarget);

    restoreTarget.focus();
    fixture.componentInstance.navigationOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(fixture.componentInstance.navigationOpen()).toBe(false);
    expect(document.activeElement).toBe(restoreTarget);

    fixture.componentInstance.navigationOpen.set(true);
    fixture.detectChanges();
    viewportListener?.({ matches: false } as MediaQueryListEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.navigationOpen()).toBe(false);

    const invalidId = TestBed.createComponent(KrnResponsiveApplicationShell);
    invalidId.componentRef.setInput('mainId', 'bad id');
    expect(() => invalidId.detectChanges()).toThrowError(/non-whitespace DOM id token/);

    const componentStyles = (
      KrnResponsiveApplicationShell as unknown as { ɵcmp: { styles: readonly string[] } }
    ).ɵcmp.styles.join('\n');
    expect(componentStyles).toMatch(/visibility: hidden;[\s\S]*pointer-events: none;/);
    expect(componentStyles).toContain('inset-inline-start: 0');
    expect(componentStyles).toMatch(/data-krn-motion=["']reduce["'][\s\S]*transition: none;/);
    expect(componentStyles).toContain('@media (forced-colors: active)');

    invalidId.destroy();
    fixture.destroy();
    fixture.nativeElement.remove();
    restoreTarget.remove();
  });
});
