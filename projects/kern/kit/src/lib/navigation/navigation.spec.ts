import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { KRN_LOCALE } from '@kern-ui/angular/core';
import { KrnBreadcrumbs } from './breadcrumbs';
import { KrnCommandPalette } from './command-palette';
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

  it('keeps the current page inside a stable five-slot mobile pagination window', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: 200,
      pageSize: 20,
      page: 1,
    });

    for (const page of [1, 3, 8]) {
      fixture.componentRef.setInput('page', page);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('ol > li')).toHaveLength(7);
      expect(fixture.nativeElement.querySelectorAll('ol > li[data-mobile-visible]')).toHaveLength(
        5,
      );
      expect(
        fixture.nativeElement.querySelector('ol > li[data-current] button')?.textContent?.trim(),
      ).toBe(`${page}`);
      expect(
        fixture.nativeElement
          .querySelector('ol > li[data-current]')
          ?.hasAttribute('data-mobile-visible'),
      ).toBe(true);
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
    const fixture = await create(KrnCommandPalette, {
      open: true,
      description: 'Komutları arayın',
      labels: {
        search: 'Komut ara',
        noResults: '“{query}” için sonuç yok',
        navigate: 'Gezin',
        select: 'Seçin',
      },
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
