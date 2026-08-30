import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KRN_LOCALE, KrnI18n, provideKrn } from '@kern-ui/angular/core';

import {
  KrnAvatar,
  KrnAvatarGroup,
  KrnAccordion,
  KrnBadge,
  KrnCard,
  KrnChip,
  KrnCodeBlock,
  KrnDescriptionItem,
  KrnDescriptionList,
  KrnDisclosure,
  KrnKeyboardShortcut,
  KrnListItem,
  KrnMeter,
  KrnRating,
  KrnResponsiveMedia,
  KrnStat,
  KrnTimeline,
  KrnTree,
} from './display';

@Component({
  imports: [KrnAvatar],
  template: `
    <krn-avatar data-testid="inherited" name="istanbul" />
    <krn-avatar data-testid="explicit" name="istanbul" locale="en-US" />
  `,
})
class ReactiveLocaleAvatarHost {}

@Component({
  imports: [KrnChip],
  template: `<krn-chip interactive [selected]="true">Enterprise</krn-chip>`,
})
class ChipHost {}

@Component({
  imports: [KrnDescriptionItem, KrnDescriptionList],
  template: `
    <krn-description-list>
      <krn-description-item term="Owner">Avery Cole</krn-description-item>
      <krn-description-item term="Plan">Scale</krn-description-item>
    </krn-description-list>
  `,
})
class DescriptionListHost {}

describe('KrnAvatar locale', () => {
  it('reacts to the injector locale while retaining an explicit component locale', async () => {
    TestBed.configureTestingModule({
      imports: [ReactiveLocaleAvatarHost],
      providers: [provideKrn({ locale: 'en-US' })],
    });
    const fixture = TestBed.createComponent(ReactiveLocaleAvatarHost);
    await fixture.whenStable();

    TestBed.inject(KrnI18n).setLocale('tr-TR');
    fixture.detectChanges();

    const inherited = fixture.nativeElement.querySelector(
      '[data-testid="inherited"] span',
    ) as HTMLElement;
    const explicit = fixture.nativeElement.querySelector(
      '[data-testid="explicit"] span',
    ) as HTMLElement;
    expect(inherited.textContent?.trim()).toBe('İ');
    expect(explicit.textContent?.trim()).toBe('I');

    const laterFixture = TestBed.createComponent(ReactiveLocaleAvatarHost);
    await laterFixture.whenStable();
    expect(
      (laterFixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="inherited"] span')
        ?.textContent?.trim(),
    ).toBe('İ');
  });

  it('keeps an explicit fixed locale even when it equals the initial application locale', async () => {
    TestBed.configureTestingModule({
      imports: [ReactiveLocaleAvatarHost],
      providers: [provideKrn({ locale: 'en-US' }), { provide: KRN_LOCALE, useValue: 'en-US' }],
    });
    const fixture = TestBed.createComponent(ReactiveLocaleAvatarHost);
    await fixture.whenStable();

    TestBed.inject(KrnI18n).setLocale('tr-TR');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="inherited"] span')
        ?.textContent?.trim(),
    ).toBe('I');
  });
});

describe('KrnDescriptionList', () => {
  it('keeps every term and description as direct children of a native description list', async () => {
    await TestBed.configureTestingModule({ imports: [DescriptionListHost] }).compileComponents();
    const fixture = TestBed.createComponent(DescriptionListHost);
    await fixture.whenStable();

    const lists = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLDListElement>(
        'krn-description-item > dl',
      ),
    ];
    expect(lists).toHaveLength(2);
    expect(
      lists.every(
        (list) =>
          list.children.length === 2 &&
          list.children.item(0)?.tagName === 'DT' &&
          list.children.item(1)?.tagName === 'DD',
      ),
    ).toBe(true);
  });
});

describe('KrnChip', () => {
  it('keeps projected content inside its interactive native button', async () => {
    await TestBed.configureTestingModule({ imports: [ChipHost] }).compileComponents();
    const fixture = TestBed.createComponent(ChipHost);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.textContent?.trim()).toBe('Enterprise');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('KrnBadge', () => {
  it('exposes its semantic tone and renders a dedicated status marker', async () => {
    await TestBed.configureTestingModule({ imports: [KrnBadge] }).compileComponents();
    const fixture = TestBed.createComponent(KrnBadge);
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('status', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).getAttribute('data-tone')).toBe('success');
    expect((fixture.nativeElement as HTMLElement).querySelector('.marker')).not.toBeNull();
  });

  it('normalizes every status badge to the shared subtle appearance', async () => {
    await TestBed.configureTestingModule({ imports: [KrnBadge] }).compileComponents();
    const fixture = TestBed.createComponent(KrnBadge);
    fixture.componentRef.setInput('tone', 'danger');
    fixture.componentRef.setInput('status', true);
    fixture.componentRef.setInput('variant', 'solid');
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.getAttribute('data-tone')).toBe('danger');
    expect(element.getAttribute('data-variant')).toBe('subtle');
  });
});

describe('KrnMeter', () => {
  it('clamps its value, exposes meter semantics, and derives threshold tone', async () => {
    await TestBed.configureTestingModule({ imports: [KrnMeter] }).compileComponents();
    const fixture = TestBed.createComponent(KrnMeter);
    fixture.componentRef.setInput('label', 'Storage used');
    fixture.componentRef.setInput('value', 140);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('low', 40);
    fixture.componentRef.setInput('high', 80);
    fixture.componentRef.setInput('optimum', 20);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.getAttribute('role')).toBe('meter');
    expect(element.getAttribute('aria-valuenow')).toBe('100');
    expect(element.getAttribute('data-tone')).toBe('danger');
    expect(element.querySelector<HTMLElement>('.fill')?.style.inlineSize).toBe('100%');
  });
});

describe('KrnRating', () => {
  it('uses themeable vector stars instead of font glyphs', async () => {
    await TestBed.configureTestingModule({ imports: [KrnRating] }).compileComponents();
    const fixture = TestBed.createComponent(KrnRating);
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();
    await fixture.whenStable();

    const stars = (fixture.nativeElement as HTMLElement).querySelectorAll('svg');
    expect(stars).toHaveLength(5);
    expect(stars[2]?.hasAttribute('data-filled')).toBe(true);
    expect(stars[3]?.hasAttribute('data-filled')).toBe(false);
  });

  it('moves DOM focus with the checked radio when arrow keys change the rating', async () => {
    await TestBed.configureTestingModule({ imports: [KrnRating] }).compileComponents();
    const fixture = TestBed.createComponent(KrnRating);
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();
    await fixture.whenStable();

    const stars = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[role="radio"]',
    ) as NodeListOf<HTMLButtonElement>;
    stars[2]?.focus();
    stars[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(4);
    expect(document.activeElement).toBe(stars[3]);
    expect(stars[3]?.getAttribute('aria-checked')).toBe('true');
    expect(stars[3]?.tabIndex).toBe(0);
    expect(stars[2]?.tabIndex).toBe(-1);
  });
});

describe('KrnCodeBlock', () => {
  it('keeps source text intact while tokenizing Angular and TypeScript syntax', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCodeBlock] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCodeBlock);
    const source = [
      "import { Component } from '@angular/core';",
      '@Component({',
      '  template: `<button krnButton [disabled]="false">Publish</button>`,',
      '})',
      'export class Toolbar {}',
    ].join('\n');
    fixture.componentRef.setInput('language', 'typescript');
    fixture.componentRef.setInput('code', source);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('code')?.textContent).toBe(source);
    expect(element.querySelector('.token-keyword')?.textContent).toBe('import');
    expect(element.querySelector('.token-decorator')?.textContent).toBe('@Component');
    expect(element.querySelector('.token-tag')?.textContent).toBe('<button');
    expect(element.querySelector('.token-attribute')?.textContent).toBe('[disabled]');
  });
});

describe('component-specific data display contracts', () => {
  it('gives grouped people, disclosures, and timelines native grouping semantics', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnAccordion, KrnAvatarGroup, KrnTimeline],
      providers: [provideKrn()],
    }).compileComponents();

    const avatarGroup = TestBed.createComponent(KrnAvatarGroup);
    const accordion = TestBed.createComponent(KrnAccordion);
    const timeline = TestBed.createComponent(KrnTimeline);
    for (const fixture of [avatarGroup, accordion, timeline]) fixture.detectChanges();

    expect((avatarGroup.nativeElement as HTMLElement).getAttribute('role')).toBe('group');
    expect((avatarGroup.nativeElement as HTMLElement).getAttribute('aria-label')).toBeTruthy();
    expect((accordion.nativeElement as HTMLElement).getAttribute('role')).toBe('group');
    expect((accordion.nativeElement as HTMLElement).getAttribute('aria-label')).toBeTruthy();
    expect((timeline.nativeElement as HTMLElement).getAttribute('role')).toBe('list');
    expect((timeline.nativeElement as HTMLElement).getAttribute('aria-label')).toBeTruthy();
  });

  it('materializes card and stat state on their public host contracts', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCard, KrnStat] }).compileComponents();

    const card = TestBed.createComponent(KrnCard);
    card.componentRef.setInput('heading', 'Quarterly revenue');
    card.componentRef.setInput('interactive', true);
    card.detectChanges();
    expect((card.nativeElement as HTMLElement).tabIndex).toBe(0);
    expect((card.nativeElement as HTMLElement).querySelector('h3')?.textContent).toContain(
      'Quarterly revenue',
    );

    const stat = TestBed.createComponent(KrnStat);
    stat.componentRef.setInput('label', 'Revenue');
    stat.componentRef.setInput('value', '$42k');
    stat.componentRef.setInput('trend', 'up');
    stat.detectChanges();
    expect((stat.nativeElement as HTMLElement).getAttribute('data-trend')).toBe('up');
    expect((stat.nativeElement as HTMLElement).textContent).toContain('$42k');
  });

  it('exposes selected list items and open disclosures through native state', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnDisclosure, KrnListItem],
    }).compileComponents();

    const listItem = TestBed.createComponent(KrnListItem);
    listItem.componentRef.setInput('heading', 'Workspace');
    listItem.componentRef.setInput('selected', true);
    listItem.detectChanges();
    expect((listItem.nativeElement as HTMLElement).getAttribute('role')).toBe('listitem');
    expect((listItem.nativeElement as HTMLElement).hasAttribute('data-selected')).toBe(true);

    const disclosure = TestBed.createComponent(KrnDisclosure);
    disclosure.componentRef.setInput('heading', 'Billing details');
    disclosure.componentRef.setInput('open', true);
    disclosure.detectChanges();
    const details = (disclosure.nativeElement as HTMLElement).querySelector('details');
    expect(details?.open).toBe(true);
    expect(details?.querySelector('summary')?.textContent).toContain('Billing details');
  });

  it('renders keyboard shortcut keys and responsive media sizing as explicit host state', async () => {
    await TestBed.configureTestingModule({
      imports: [KrnKeyboardShortcut, KrnResponsiveMedia],
      providers: [provideKrn()],
    }).compileComponents();

    const shortcut = TestBed.createComponent(KrnKeyboardShortcut);
    shortcut.componentRef.setInput('keys', ['Control', 'K']);
    shortcut.detectChanges();
    expect((shortcut.nativeElement as HTMLElement).querySelectorAll('kbd')).toHaveLength(2);
    expect((shortcut.nativeElement as HTMLElement).getAttribute('aria-label')).toBeTruthy();

    const media = TestBed.createComponent(KrnResponsiveMedia);
    media.componentRef.setInput('aspectRatio', '4 / 3');
    media.detectChanges();
    expect((media.nativeElement as HTMLElement).style.aspectRatio).toBe('4 / 3');
  });
});

describe('KrnTree', () => {
  it('exposes a retryable lazy-children contract with explicit accessible states', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTree] }).compileComponents();
    const fixture = TestBed.createComponent(KrnTree);
    const requested: string[] = [];
    fixture.componentInstance.loadChildren.subscribe((node) => requested.push(node.id));
    fixture.componentRef.setInput('nodes', [
      { id: 'accounts', label: 'Accounts', childrenState: 'idle' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const item = (): HTMLButtonElement =>
      fixture.nativeElement.querySelector('[data-tree-item="accounts"]') as HTMLButtonElement;
    item().click();
    fixture.detectChanges();
    expect(requested).toEqual(['accounts']);
    expect(item().getAttribute('aria-expanded')).toBe('true');

    fixture.componentRef.setInput('nodes', [
      { id: 'accounts', label: 'Accounts', childrenState: 'loading' },
    ]);
    fixture.detectChanges();
    expect(item().getAttribute('aria-busy')).toBe('true');
    expect(item().getAttribute('aria-label')).toBe('Loading children for Accounts');

    item().click();
    fixture.detectChanges();
    fixture.componentRef.setInput('nodes', [
      { id: 'accounts', label: 'Accounts', childrenState: 'error' },
    ]);
    fixture.detectChanges();
    item().click();
    fixture.detectChanges();
    expect(requested).toEqual(['accounts', 'accounts']);
    expect(item().getAttribute('aria-invalid')).toBe('true');
    expect(item().getAttribute('aria-label')).toBe('Could not load children for Accounts');

    fixture.componentRef.setInput('nodes', [
      {
        id: 'accounts',
        label: 'Accounts',
        children: [{ id: 'revenue', label: 'Revenue' }],
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-tree-item="revenue"]')).not.toBeNull();
    expect(item().getAttribute('aria-busy')).toBeNull();
    expect(item().getAttribute('aria-invalid')).toBeNull();
  });

  it('renders nested branches at explicit cumulative depths', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTree] }).compileComponents();
    const fixture = TestBed.createComponent(KrnTree);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'projects',
        label: 'projects',
        children: [
          {
            id: 'kern',
            label: 'kern',
            children: [{ id: 'docs', label: 'docs' }],
          },
        ],
      },
    ]);
    fixture.componentRef.setInput('expanded', new Set(['projects', 'kern']));
    fixture.detectChanges();
    await fixture.whenStable();

    const branches = fixture.nativeElement.querySelectorAll('.branch') as NodeListOf<HTMLElement>;
    expect(Array.from(branches, (branch) => branch.dataset['depth'])).toEqual(['0', '1', '2']);
    expect(branches[1].querySelector('button')?.textContent?.trim()).toBe('kern');
    expect(branches[2].querySelector('button')?.textContent?.trim()).toBe('docs');
  });

  it('implements roving tree navigation and skips disabled nodes', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTree] }).compileComponents();
    const fixture = TestBed.createComponent(KrnTree);
    fixture.componentRef.setInput('nodes', [
      { id: 'disabled-root', label: 'Disabled root', disabled: true },
      {
        id: 'projects',
        label: 'Projects',
        children: [
          {
            id: 'disabled-group',
            label: 'Disabled group',
            disabled: true,
            children: [{ id: 'nested', label: 'Nested' }],
          },
          {
            id: 'kern',
            label: 'Kern',
            children: [{ id: 'docs', label: 'Docs' }],
          },
        ],
      },
      { id: 'archive', label: 'Archive' },
    ]);
    fixture.componentRef.setInput('expanded', new Set(['projects', 'disabled-group', 'kern']));
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const button = (id: string): HTMLButtonElement => {
      const target = element.querySelector<HTMLButtonElement>(`[data-tree-item="${id}"]`);
      if (!target) throw new Error(`Expected tree item ${id}`);
      return target;
    };
    const press = (key: string): void => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
    };

    expect(button('disabled-root').tabIndex).toBe(-1);
    expect(button('projects').tabIndex).toBe(0);
    expect(button('projects').getAttribute('role')).toBe('treeitem');
    expect(button('projects').getAttribute('aria-expanded')).toBe('true');
    expect(button('projects').parentElement?.getAttribute('role')).toBe('none');
    button('projects').focus();

    press('ArrowRight');
    expect(document.activeElement).toBe(button('nested'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(button('projects'));

    press('ArrowDown');
    expect(document.activeElement).toBe(button('nested'));
    press('ArrowDown');
    expect(document.activeElement).toBe(button('kern'));
    press('ArrowRight');
    expect(document.activeElement).toBe(button('docs'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(button('kern'));

    press('ArrowLeft');
    expect(fixture.componentInstance.expanded().has('kern')).toBe(false);
    expect(document.activeElement).toBe(button('kern'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(button('projects'));

    press('End');
    expect(document.activeElement).toBe(button('archive'));
    press('ArrowUp');
    expect(document.activeElement).toBe(button('kern'));
    press('Home');
    expect(document.activeElement).toBe(button('projects'));
    expect(fixture.componentInstance.selected()).toBe('projects');
    press('a');
    expect(document.activeElement).toBe(button('archive'));
    expect(fixture.componentInstance.selected()).toBe('archive');
  });

  it('rejects empty node ids before rendering an ambiguous tree', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTree] }).compileComponents();
    const fixture = TestBed.createComponent(KrnTree);
    fixture.componentRef.setInput('nodes', [{ id: '  ', label: 'Invalid' }]);

    expect(() => fixture.detectChanges()).toThrowError(
      'KrnTree requires every node id to be a non-empty string.',
    );
  });

  it('rejects duplicate node ids across separate branches', async () => {
    await TestBed.configureTestingModule({ imports: [KrnTree] }).compileComponents();
    const fixture = TestBed.createComponent(KrnTree);
    fixture.componentRef.setInput('nodes', [
      {
        id: 'projects',
        label: 'Projects',
        children: [{ id: 'shared', label: 'Nested shared' }],
      },
      { id: 'shared', label: 'Root shared' },
    ]);

    expect(() => fixture.detectChanges()).toThrowError(
      'KrnTree requires unique node ids; duplicate id "shared".',
    );
  });
});
