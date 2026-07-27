import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
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

  it('keeps a stable pagination slot count at the beginning, middle, and end', async () => {
    const fixture = await create(KrnPagination, {
      totalItems: 200,
      pageSize: 20,
      page: 1,
    });

    for (const page of [1, 3, 8]) {
      fixture.componentRef.setInput('page', page);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('ol > li')).toHaveLength(7);
      expect(
        fixture.nativeElement.querySelector('ol > li[data-current] button')?.textContent?.trim(),
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
    fixture.nativeElement
      .querySelector('.palette')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
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
