import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import {
  createKrnTranslations,
  KRN_LOCALE,
  KRN_TRANSLATIONS,
  type KrnTranslationsPatch,
} from '@kern-ui/angular/core';
import { KrnBreadcrumbs } from './breadcrumbs';
import { KrnCommandPalette, type KrnCommandPaletteLabels } from './command-palette';
import { KrnContextMenu, KrnMenu, KrnMenubar } from './menu';
import {
  KrnBackButton,
  KrnBottomNavigation,
  KrnSkipLink,
  KrnTableOfContents,
} from './navigation-extras';
import { KrnPagination } from './pagination';
import { KrnStepper } from './stepper';
import { KrnTabs } from './tabs';
import { KrnTreeNavigation } from './tree-navigation';

describe('Kern navigation', () => {
  it('exposes the complete navigation family as standalone building blocks', () => {
    expect([
      KrnMenu,
      KrnMenubar,
      KrnContextMenu,
      KrnBottomNavigation,
      KrnTableOfContents,
      KrnBackButton,
      KrnSkipLink,
    ]).toHaveLength(7);
  });

  it('collapses and reveals long breadcrumbs accessibly', async () => {
    const fixture = await create(KrnBreadcrumbs, {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Workspace', href: '/workspace' },
        { label: 'Settings', href: '/settings' },
        { label: 'Members', current: true },
      ],
      maxItems: 3,
    });
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(3);
    const reveal = fixture.nativeElement.querySelector('.ellipsis') as HTMLButtonElement | null;
    expect(reveal?.getAttribute('aria-label')).toContain('Show all');
    reveal?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent).toContain(
      'Members',
    );
  });

  it('normalizes invalid limits and exposes exactly one visible current breadcrumb', async () => {
    const fixture = await create(KrnBreadcrumbs, {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Workspace', href: '/workspace', current: true },
        { label: 'Settings', href: '/settings' },
        { label: 'Members', href: '/members' },
        { label: 'Invitations', href: '/invitations' },
        { label: 'Details' },
      ],
      maxItems: Number.NaN,
      ariaLabel: '   ',
    });

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('li')).toHaveLength(5);
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(element.querySelector('[aria-current="page"]')?.textContent).toContain('Details');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBeTruthy();
  });

  it('recollapses breadcrumbs when their source items change after expansion', async () => {
    const fixture = await create(KrnBreadcrumbs, {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Workspace', href: '/workspace' },
        { label: 'Settings', href: '/settings' },
        { label: 'Members', current: true },
      ],
      maxItems: 3,
    });

    (fixture.nativeElement.querySelector('.ellipsis') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(4);

    fixture.componentRef.setInput('items', [
      { label: 'Home', href: '/' },
      { label: 'Workspace', href: '/workspace' },
      { label: 'Settings', href: '/settings' },
      { label: 'Members', href: '/members' },
      { label: 'Details', current: true },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.ellipsis')).not.toBeNull();
  });

  it('moves tabs with arrow keys and updates the tabpanel relationship', async () => {
    const fixture = await create(KrnTabs, {
      items: [
        { id: 'overview', label: 'Overview' },
        { id: 'disabled', label: 'Disabled', disabled: true },
        { id: 'activity', label: 'Activity' },
      ],
      value: 'overview',
    });
    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(tabs[2].getAttribute('aria-controls')).toBe(
      fixture.nativeElement.querySelector('[role="tabpanel"]')?.id,
    );
  });

  it('mirrors horizontal tab navigation in RTL', async () => {
    const fixture = await create(KrnTabs, {
      items: [
        { id: 'first', label: 'First' },
        { id: 'second', label: 'Second' },
        { id: 'third', label: 'Third' },
      ],
      value: 'first',
    });
    const element = fixture.nativeElement as HTMLElement;
    element.style.direction = 'rtl';
    const tabs = element.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(tabs[2]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('uses the first and last enabled tabs for Home and End and normalizes ARIA inputs', async () => {
    const fixture = await create(KrnTabs, {
      items: [
        { id: 'first', label: 'First' },
        { id: 'middle', label: 'Middle' },
        { id: 'disabled-last', label: 'Disabled last', disabled: true },
      ],
      value: 'middle',
      ariaLabel: '   ',
    });
    fixture.componentRef.setInput('orientation', 'diagonal');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const tablist = element.querySelector<HTMLElement>('[role="tablist"]');
    const tabs = element.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    tabs[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);

    tabs[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[0]);
    expect(tablist?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(tablist?.getAttribute('aria-label')).toBeTruthy();
  });

  it('keeps a controlled selection visible after selection and container resize', async () => {
    const originalResizeObserver = window.ResizeObserver;
    let resizeCallback: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    class TestResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {
        disconnect();
      }
    }
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: TestResizeObserver,
    });

    let fixture: ComponentFixture<KrnTabs> | undefined;
    const scrollBy = vi.fn();
    const scrollIntoView = vi.fn();
    let listRight = 100;
    let selectedLeft = 140;
    let selectedRight = 180;

    try {
      fixture = await create(KrnTabs, {
        items: [
          { id: 'first', label: 'First' },
          { id: 'second', label: 'Second' },
          { id: 'third', label: 'Third' },
          { id: 'fourth', label: 'Fourth' },
          { id: 'fifth', label: 'Fifth' },
          { id: 'sixth', label: 'Sixth' },
        ],
        value: 'first',
      });
      const element = fixture.nativeElement as HTMLElement;
      const tablist = element.querySelector<HTMLElement>('[role="tablist"]')!;
      const tabs = element.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      Object.defineProperty(tablist, 'scrollBy', { configurable: true, value: scrollBy });
      Object.defineProperty(tablist, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 0, right: listRight }) as DOMRect,
      });
      Object.defineProperty(tabs[5]!, 'scrollIntoView', {
        configurable: true,
        value: scrollIntoView,
      });
      Object.defineProperty(tabs[5]!, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: selectedLeft, right: selectedRight }) as DOMRect,
      });

      fixture.componentRef.setInput('value', 'sixth');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(tabs[5]?.getAttribute('aria-selected')).toBe('true');
      expect(scrollBy).toHaveBeenCalledWith({ behavior: 'auto', left: 80 });
      expect(scrollIntoView).not.toHaveBeenCalled();

      scrollBy.mockClear();
      selectedLeft = 40;
      selectedRight = 80;
      listRight = 60;
      resizeCallback?.([], {} as ResizeObserver);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(scrollBy).toHaveBeenCalledWith({ behavior: 'auto', left: 20 });
      fixture.destroy();
      fixture = undefined;
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      fixture?.destroy();
      Object.defineProperty(window, 'ResizeObserver', {
        configurable: true,
        value: originalResizeObserver,
      });
    }
  });

  it('calculates pagination tokens and announces the visible result range', async () => {
    const fixture = await create(KrnPagination, { totalItems: 203, pageSize: 20, page: 5 });
    const current = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(current?.textContent?.trim()).toBe('5');
    expect(fixture.nativeElement.querySelector('.summary')?.textContent).toContain(
      '81 to 100 of 203',
    );
    (
      fixture.nativeElement.querySelector('.direction:last-of-type') as HTMLButtonElement | null
    )?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(6);
  });

  it('normalizes invalid pagination numbers and preserves accessible fallback labels', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: Number.POSITIVE_INFINITY,
      pageSize: Number.NaN,
      siblingCount: Number.POSITIVE_INFINITY,
      page: Number.NaN,
      ariaLabel: '   ',
      previousLabel: '   ',
      nextLabel: '   ',
      pageLabel: '   ',
      emptyLabel: '   ',
    });
    const element = fixture.nativeElement as HTMLElement;
    const directions = element.querySelectorAll<HTMLButtonElement>('.direction');

    expect(fixture.componentInstance.page()).toBe(1);
    expect(element.querySelectorAll('.desktop-pages button')).toHaveLength(1);
    expect(element.querySelector('.desktop-pages button')?.getAttribute('aria-label')).toBeTruthy();
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBeTruthy();
    expect(directions[0]?.textContent?.trim()).toBeTruthy();
    expect(directions[1]?.textContent?.trim()).toBeTruthy();
    expect(element.querySelector('.summary')?.textContent?.trim()).toBeTruthy();
  });

  it('preserves legacy pagination translation patches', async () => {
    const patch = {
      navigation: {
        pageLabel: 'Seite {page}',
        resultRangeLabel: '{start}–{end} von {total}',
      },
    } satisfies KrnTranslationsPatch;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KRN_TRANSLATIONS,
          useValue: createKrnTranslations(patch),
        },
      ],
    });
    const fixture = await create(KrnPagination, {
      totalItems: 45,
      pageSize: 20,
      page: 2,
    });
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe(
      'Seite 2',
    );
    expect(element.querySelector('.summary')?.textContent?.trim()).toBe('21–40 von 45');
  });

  it('prefers typed pagination formatter inputs when supplied', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: 45,
      pageSize: 20,
      page: 2,
      pageLabel: 'ignored {page}',
      pageLabelFormatter: (page: number) => `Blatt ${page}`,
      rangeLabel: 'ignored {start} {end} {total}',
      rangeLabelFormatter: (start: number, end: number, total: number) =>
        `${start}–${end} aus insgesamt ${total}`,
    });
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe(
      'Blatt 2',
    );
    expect(element.querySelector('.summary')?.textContent?.trim()).toBe('21–40 aus insgesamt 45');
  });

  it('keeps the current page inside a stable five-slot mobile pagination window', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: 200,
      pageSize: 20,
      page: 1,
    });

    for (const page of [1, 3, 4, 8]) {
      fixture.componentRef.setInput('page', page);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.mobile-pages > li')).toHaveLength(5);
      expect(
        fixture.nativeElement
          .querySelector('.mobile-pages > li[data-current] button')
          ?.textContent?.trim(),
      ).toBe(`${page}`);

      if (page === 4) {
        const visibleTokens = Array.from(
          fixture.nativeElement.querySelectorAll('.mobile-pages > li'),
          (item: Element) => item.textContent?.trim(),
        );
        expect(visibleTokens).toEqual(['1', '…', '4', '…', '10']);
      }
    }
  });

  it('keeps mobile pagination bounded for wide desktop sibling ranges', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: 500,
      pageSize: 20,
      siblingCount: 10,
      page: 13,
    });
    const element = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(element.querySelectorAll('.desktop-pages > li'), (item) =>
        item.textContent?.trim(),
      ),
    ).toHaveLength(25);
    expect(
      Array.from(element.querySelectorAll('.mobile-pages > li'), (item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['1', '…', '13', '…', '25']);
  });

  it('keeps expanded sibling boundaries current in the mobile token list', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: 400,
      pageSize: 20,
      siblingCount: 2,
      page: 4,
    });
    const element = fixture.nativeElement as HTMLElement;

    for (const page of [4, 17]) {
      fixture.componentRef.setInput('page', page);
      fixture.detectChanges();

      expect(
        Array.from(element.querySelectorAll('.mobile-pages > li'), (item) =>
          item.textContent?.trim(),
        ),
      ).toEqual(['1', '…', `${page}`, '…', '20']);
      expect(
        element.querySelector('.mobile-pages > li[data-current] button')?.textContent?.trim(),
      ).toBe(`${page}`);
    }
  });

  it('opens a menu on the last enabled item when ArrowUp skips a disabled tail', async () => {
    const fixture = await create(KrnMenu, {
      items: [
        { id: 'overview', label: 'Overview' },
        { id: 'archive', label: 'Archive', disabled: true },
      ],
    });
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));

    expect(document.activeElement?.textContent?.trim()).toBe('Overview');
  });

  it('skips disabled menu items while moving upward inside an open menu', async () => {
    const fixture = await create(KrnMenu, {
      items: [
        { id: 'overview', label: 'Overview' },
        { id: 'archive', label: 'Archive', disabled: true },
        { id: 'reports', label: 'Reports' },
      ],
    });
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement?.textContent?.trim()).toBe('Reports');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));

    expect(document.activeElement?.textContent?.trim()).toBe('Overview');
    expect((document.activeElement as HTMLButtonElement).disabled).toBe(false);
  });

  it('lets only an unhandled Escape close an open menu', async () => {
    const fixture = await create(KrnMenu, {
      items: [{ id: 'overview', label: 'Overview' }],
    });
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    const menuItem = document.querySelector('.menu-panel [role="menuitem"]') as HTMLElement | null;
    if (!menuItem) throw new Error('Expected an open menu item');
    const alreadyHandled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    alreadyHandled.preventDefault();
    menuItem.dispatchEvent(alreadyHandled);
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    menuItem.dispatchEvent(escape);
    fixture.detectChanges();
    expect(escape.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('keeps table-of-contents and skip-link anchors on the current route', async () => {
    const originalUrl = `${location.pathname}${location.search}${location.hash}`;
    history.pushState({}, '', '/components/table-of-contents?theme=dark');
    await TestBed.configureTestingModule({
      imports: [KrnTableOfContents, KrnSkipLink],
    }).compileComponents();
    const toc = TestBed.createComponent(KrnTableOfContents);
    toc.componentRef.setInput('items', [{ id: 'api-contract', label: 'API contract', level: 2 }]);
    toc.componentRef.setInput('observe', false);
    toc.detectChanges();
    const skip = TestBed.createComponent(KrnSkipLink);
    skip.componentRef.setInput('targetId', 'main-specimen');
    skip.detectChanges();
    const target = document.createElement('main');
    target.id = 'main-specimen';
    target.tabIndex = -1;
    document.body.append(target);

    try {
      expect((toc.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toBe(
        '/components/table-of-contents?theme=dark#api-contract',
      );
      expect(
        (skip.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href'),
      ).toBe('/components/table-of-contents?theme=dark#main-specimen');

      (skip.nativeElement.querySelector('a') as HTMLAnchorElement).click();

      expect(location.pathname).toBe('/components/table-of-contents');
      expect(location.hash).toBe('#main-specimen');
      expect(document.activeElement).toBe(target);
    } finally {
      target.remove();
      history.replaceState({}, '', originalUrl || '/');
    }
  });

  it('opens nested context-menu destinations and supports ArrowLeft return', async () => {
    const fixture = await create(KrnContextMenu, {
      items: [
        { id: 'open', label: 'Open', icon: '↗' },
        {
          id: 'move',
          label: 'Move to',
          children: [
            { id: 'operations', label: 'Operations' },
            { id: 'archive', label: 'Archive', disabled: true },
          ],
        },
      ],
    });

    (fixture.nativeElement as HTMLElement).dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 24,
        clientY: 24,
      }),
    );
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const move = Array.from(buttons).find((button) => button.textContent?.includes('Move to'));
    move?.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(fixture.nativeElement.querySelectorAll('[role="menu"]')).toHaveLength(2);
    expect(document.activeElement?.textContent?.trim()).toBe('Operations');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(document.activeElement?.textContent).toContain('Move to');
    expect(fixture.nativeElement.querySelectorAll('[role="menu"]')).toHaveLength(1);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.activeElement?.dispatchEvent(escape);
    fixture.detectChanges();

    expect(escape.defaultPrevented).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('[role="menu"]')).toHaveLength(0);
  });

  it('keeps horizontal step labels in a dedicated copy row below their markers', async () => {
    const fixture = await create(KrnStepper, {
      steps: [
        { id: 'details', label: 'Details' },
        { id: 'permissions', label: 'Permissions' },
        { id: 'review', label: 'Review' },
      ],
    });
    const buttons = fixture.nativeElement.querySelectorAll(
      '.stepper:not(.vertical) button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.firstElementChild?.classList.contains('marker')).toBe(true);
      expect(button.lastElementChild?.classList.contains('copy')).toBe(true);
    }
  });

  it('normalizes stepper state and exposes one accessible tab stop', async () => {
    const fixture = await create(KrnStepper, {
      steps: [
        { id: 'disabled', label: 'Disabled', disabled: true },
        { id: 'details', label: 'Details', optional: true, error: 'Details are invalid' },
        { id: 'review', label: 'Review' },
      ],
      activeStep: Number.NaN,
      completedSteps: [Number.POSITIVE_INFINITY, -1, 99],
      ariaLabel: '   ',
      optionalLabel: '   ',
    });
    fixture.componentRef.setInput('orientation', 'diagonal');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = element.querySelectorAll<HTMLButtonElement>('.stepper button');
    expect(fixture.componentInstance.activeStep()).toBe(1);
    expect(element.querySelector('.stepper')?.classList.contains('vertical')).toBe(false);
    expect(element.querySelector('.stepper')?.getAttribute('aria-label')).toBeTruthy();
    expect(element.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    expect(buttons[1]?.getAttribute('aria-current')).toBe('step');
    expect(buttons[1]?.getAttribute('aria-invalid')).toBe('true');
    expect(buttons[1]?.hasAttribute('aria-describedby')).toBe(false);
    expect(buttons[1]?.querySelector('.optional')?.textContent?.trim()).toBeTruthy();
  });

  it('uses orientation-aware stepper navigation and skips disabled endpoints', async () => {
    const fixture = await create(KrnStepper, {
      steps: [
        { id: 'details', label: 'Details' },
        { id: 'disabled', label: 'Disabled', disabled: true },
        { id: 'review', label: 'Review' },
        { id: 'disabled-tail', label: 'Disabled tail', disabled: true },
      ],
      orientation: 'vertical',
      activeStep: 0,
    });
    const buttons = fixture.nativeElement.querySelectorAll(
      '.stepper button',
    ) as NodeListOf<HTMLButtonElement>;
    const horizontal = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    buttons[0]?.dispatchEvent(horizontal);
    fixture.detectChanges();
    expect(horizontal.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.activeStep()).toBe(0);

    buttons[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeStep()).toBe(2);
    expect(document.activeElement).toBe(buttons[2]);

    buttons[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeStep()).toBe(2);
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('does not let invalid completion indexes unlock a linear stepper', async () => {
    const fixture = await create(KrnStepper, {
      steps: [
        { id: 'details', label: 'Details' },
        { id: 'permissions', label: 'Permissions' },
        { id: 'review', label: 'Review' },
      ],
      linear: true,
      activeStep: 0,
      completedSteps: [Number.POSITIVE_INFINITY, 99, -1],
    });
    const buttons = fixture.nativeElement.querySelectorAll(
      '.stepper button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[1]?.disabled).toBe(true);
    expect(buttons[2]?.disabled).toBe(true);
    fixture.componentRef.setInput('completedSteps', [0]);
    fixture.detectChanges();
    expect(buttons[1]?.disabled).toBe(false);
    expect(buttons[2]?.disabled).toBe(true);
  });

  it('keeps a controlled active step visible after selection and resize', async () => {
    const originalResizeObserver = window.ResizeObserver;
    let resizeCallback: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    class TestResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {
        disconnect();
      }
    }
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: TestResizeObserver,
    });

    let fixture: ComponentFixture<KrnStepper> | undefined;
    try {
      fixture = await create(KrnStepper, {
        steps: [
          { id: 'details', label: 'Details' },
          { id: 'permissions', label: 'Permissions' },
          { id: 'review', label: 'Review' },
        ],
        activeStep: 0,
      });
      const element = fixture.nativeElement as HTMLElement;
      const list = element.querySelector<HTMLOListElement>('.stepper')!;
      const buttons = element.querySelectorAll<HTMLButtonElement>('.stepper button');
      const scrollBy = vi.fn();
      Object.defineProperty(list, 'scrollBy', { configurable: true, value: scrollBy });
      Object.defineProperty(list, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 0, right: 100, top: 0, bottom: 50 }) as DOMRect,
      });
      Object.defineProperty(buttons[2]!, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 140, right: 180, top: 0, bottom: 40 }) as DOMRect,
      });

      fixture.componentRef.setInput('activeStep', 2);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(scrollBy).toHaveBeenCalledWith({ left: 80, top: 0 });

      scrollBy.mockClear();
      resizeCallback?.([], {} as ResizeObserver);
      expect(scrollBy).toHaveBeenCalledWith({ left: 80, top: 0 });
      fixture.destroy();
      fixture = undefined;
      expect(disconnect).toHaveBeenCalled();
    } finally {
      fixture?.destroy();
      Object.defineProperty(window, 'ResizeObserver', {
        configurable: true,
        value: originalResizeObserver,
      });
    }
  });

  it('filters commands and closes on Escape', async () => {
    const fixture = await create(KrnCommandPalette, {
      open: true,
      items: [
        { id: 'create', label: 'Create project', keywords: ['new'] },
        { id: 'settings', label: 'Open settings' },
      ],
    });
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement | null;
    if (!input) throw new Error('Expected command search input');
    input.value = 'settings';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(1);
    const palette = fixture.nativeElement.querySelector('.palette') as HTMLElement;
    const alreadyHandled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    alreadyHandled.preventDefault();
    palette.dispatchEvent(alreadyHandled);
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    palette.dispatchEvent(escape);
    fixture.detectChanges();
    expect(escape.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('localizes command search, empty state, and dialog description', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: KRN_LOCALE, useValue: 'tr-TR' }],
    });
    const labels = {
      search: 'Komut ara',
      noResults: '“{query}” için sonuç yok',
      navigate: 'Gezin',
      select: 'Seçin',
    } satisfies Partial<KrnCommandPaletteLabels>;
    const fixture = await create(KrnCommandPalette, {
      open: true,
      description: 'Komutları arayın',
      labels,
      items: [{ id: 'light', label: 'Işık ayarları' }],
    });
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input');
    if (!input) throw new Error('Expected command search input');

    expect(element.querySelector('.palette')?.getAttribute('aria-describedby')).toBeTruthy();
    expect(element.querySelector('.search .visually-hidden')?.textContent).toContain('Komut ara');

    input.value = 'ışık';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelectorAll('[role="option"]')).toHaveLength(1);

    input.value = 'yok';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelector('.empty')?.textContent).toContain('“yok” için sonuç yok');
    expect(element.querySelector('footer')?.textContent).toContain('Gezin');
    expect(element.querySelector('footer')?.textContent).toContain('Seçin');
  });

  it('expands a tree branch and selects a child', async () => {
    const fixture = await create(KrnTreeNavigation, {
      items: [
        {
          id: 'products',
          label: 'Products',
          children: [{ id: 'catalog', label: 'Catalog' }],
        },
      ],
      selectedId: 'products',
    });
    (fixture.nativeElement.querySelector('.toggle') as HTMLButtonElement | null)?.click();
    fixture.detectChanges();
    const nodes = fixture.nativeElement.querySelectorAll('.node') as NodeListOf<HTMLElement>;
    expect(nodes).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.node-row')?.getAttribute('role')).toBe('none');
    nodes[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBe('catalog');
    expect(fixture.nativeElement.querySelector('ul.branch.with-guides')).not.toBeNull();
  });

  it('rejects blank ids in the navigation tree', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTreeNavigation] }).compileComponents();
    const blank = TestBed.createComponent(KrnTreeNavigation);
    blank.componentRef.setInput('items', [{ id: '   ', label: 'Blank' }]);
    expect(() => blank.detectChanges()).toThrowError(
      'KrnTreeNavigation requires non-empty unique item ids; received "   ".',
    );
  });

  it('requests lazy navigation children and exposes loading and retry states', async () => {
    const fixture = await create(KrnTreeNavigation, {
      items: [{ id: 'billing', label: 'Billing', childrenState: 'idle' }],
    });
    const requested: string[] = [];
    fixture.componentInstance.loadChildren.subscribe((item) => requested.push(item.id));
    const toggle = (): HTMLElement => fixture.nativeElement.querySelector('.toggle') as HTMLElement;
    const item = (): HTMLElement =>
      fixture.nativeElement.querySelector('[data-tree-item="billing"]') as HTMLElement;

    toggle().click();
    fixture.detectChanges();
    expect(requested).toEqual(['billing']);
    expect(item().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('items', [
      { id: 'billing', label: 'Billing', childrenState: 'loading' },
    ]);
    fixture.detectChanges();
    expect(item().getAttribute('aria-busy')).toBe('true');
    expect(item().getAttribute('aria-label')).toBe('Loading children for Billing');

    toggle().click();
    fixture.detectChanges();
    fixture.componentRef.setInput('items', [
      { id: 'billing', label: 'Billing', childrenState: 'error' },
    ]);
    fixture.detectChanges();
    toggle().click();
    fixture.detectChanges();
    expect(requested).toEqual(['billing', 'billing']);
    expect(item().getAttribute('aria-invalid')).toBe('true');
    expect(item().getAttribute('aria-label')).toBe('Could not load children for Billing');
  });

  it('rejects duplicate ids across separate navigation-tree branches', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTreeNavigation] }).compileComponents();
    const duplicate = TestBed.createComponent(KrnTreeNavigation);
    duplicate.componentRef.setInput('items', [
      { id: 'shared', label: 'First' },
      {
        id: 'group',
        label: 'Group',
        children: [{ id: 'shared', label: 'Nested duplicate' }],
      },
    ]);
    expect(() => duplicate.detectChanges()).toThrowError(
      'KrnTreeNavigation requires non-empty unique item ids; received "shared".',
    );
  });

  it('keeps tree-navigation tab stops and arrow movement on enabled items', async () => {
    const fixture = await create(KrnTreeNavigation, {
      items: [
        { id: 'disabled-root', label: 'Disabled root', disabled: true },
        {
          id: 'products',
          label: 'Products',
          children: [
            {
              id: 'disabled-group',
              label: 'Disabled group',
              disabled: true,
              children: [{ id: 'nested', label: 'Nested' }],
            },
            { id: 'catalog', label: 'Catalog' },
          ],
        },
        { id: 'archive', label: 'Archive' },
      ],
      expandedIds: ['products', 'disabled-group'],
    });
    const element = fixture.nativeElement as HTMLElement;
    const node = (id: string): HTMLElement => {
      const target = element.querySelector<HTMLElement>(`[data-tree-item="${id}"]`);
      if (!target) throw new Error(`Expected navigation tree item ${id}`);
      return target;
    };
    const press = (key: string): void => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
    };

    expect(node('disabled-root').tabIndex).toBe(-1);
    expect(node('products').tabIndex).toBe(0);
    expect(node('disabled-group').getAttribute('aria-disabled')).toBe('true');
    node('products').focus();

    press('ArrowRight');
    expect(document.activeElement).toBe(node('nested'));
    expect(fixture.componentInstance.selectedId()).toBe('nested');
    press('ArrowLeft');
    expect(document.activeElement).toBe(node('products'));

    press('ArrowDown');
    expect(document.activeElement).toBe(node('nested'));
    press('ArrowDown');
    expect(document.activeElement).toBe(node('catalog'));
    press('ArrowDown');
    expect(document.activeElement).toBe(node('archive'));
    press('ArrowUp');
    expect(document.activeElement).toBe(node('catalog'));
    press('Home');
    expect(document.activeElement).toBe(node('products'));
    press('End');
    expect(document.activeElement).toBe(node('archive'));
    expect(fixture.componentInstance.selectedId()).toBe('archive');

    press('p');
    expect(document.activeElement).toBe(node('products'));
    expect(node('products').getAttribute('role')).toBe('treeitem');
    expect(node('products').getAttribute('aria-level')).toBe('1');
    expect(node('products').getAttribute('aria-expanded')).toBe('true');
    expect(node('products').closest('li')?.getAttribute('role')).toBe('none');
  });
});

async function create<T>(
  component: Type<T>,
  inputs: Record<string, unknown>,
): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
  const fixture = TestBed.createComponent(component);
  Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}
