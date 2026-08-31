import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KERN_CATALOG, type KernCatalogItem } from '@kern-ui/showcase';
import { findKernPlaygroundDefinition } from '@kern-ui/showcase/specimen';

import {
  ComponentPlayground,
  PreviewFixtureEn,
  PreviewFixtureRu,
  describeKernPlaygroundStory,
} from './component-playground';
import { DocsPreferences } from '../preferences';

function catalogItem(id: string): KernCatalogItem {
  const item = KERN_CATALOG.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing catalog item "${id}".`);
  return item;
}

const FORM_CONTRACT_IDS = [
  'label',
  'text-input',
  'textarea',
  'password-input',
  'search-input',
  'number-input',
  'checkbox',
  'checkbox-group',
  'radio',
  'radio-group',
  'switch',
  'select',
  'native-select',
  'multi-select',
  'combobox',
  'autocomplete',
  'date-picker',
  'date-range-picker',
  'time-picker',
  'color-picker',
  'file-upload',
  'drag-drop-upload',
] as const;

const CYRILLIC_PROSE = /[А-Яа-яЁё]/u;
const ENGLISH_PROSE_MARKERS =
  /\b(?:and|are|changes?|could|did|example|explicit|load|not|overview|reports?|respond|safe|service|slots?|sticky|structure|the|workspaces?|your)\b/giu;

function englishProseMarkers(value: string): readonly string[] {
  return value.match(ENGLISH_PROSE_MARKERS) ?? [];
}

function expectRussianProse(value: string | null | undefined, context: string): void {
  const copy = value?.replace(/\s+/g, ' ').trim() ?? '';
  expect(copy, `${context}: visible copy`).not.toBe('');
  expect(copy, `${context}: Cyrillic prose`).toMatch(CYRILLIC_PROSE);
  expect(englishProseMarkers(copy), `${context}: residual English prose`).toEqual([]);
}

describe('component playground teaching states', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentPlayground, PreviewFixtureEn, PreviewFixtureRu],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the Text Input filled story as a real input value', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureEn);
    fixture.componentRef.setInput('item', catalogItem('text-input'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'filled');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('krn-text-input[data-specimen-target]')).not.toBeNull();
    expect(element.querySelector<HTMLInputElement>('krn-text-input input')?.value).toBe(
      'Acme Europe',
    );
    expect(element.querySelector('[data-applied-control="value"]')?.textContent).toContain(
      'Acme Europe',
    );
  });

  it('marks the actual Text Input control as the focus-visible target', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureEn);
    fixture.componentRef.setInput('item', catalogItem('text-input'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'focus-visible');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('krn-text-input[data-specimen-target]')).not.toBeNull();
    expect(
      element.querySelector('krn-text-input input[data-specimen-focus-target]'),
    ).not.toBeNull();
    expect(element.querySelector('.form-surface[data-specimen-focus-target]')).toBeNull();
  });

  it('labels a noninteractive target as a static example', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureEn);
    fixture.componentRef.setInput('item', catalogItem('header'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'default');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const indicator = (fixture.nativeElement as HTMLElement).querySelector(
      '.live-indicator[data-interactive="false"]',
    );
    expect(indicator?.textContent).toContain('Static example');
  });

  it('renders Russian descriptive surfaces with Cyrillic copy', async () => {
    const fixture = TestBed.createComponent(PreviewFixtureRu);
    fixture.componentRef.setInput('item', catalogItem('text-input'));
    fixture.componentRef.setInput('scenario', 'default');
    fixture.componentRef.setInput('state', 'filled');
    fixture.componentRef.setInput('args', {});
    fixture.componentRef.setInput('resetRevision', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cyrillic = /[А-Яа-яЁё]/;
    const descriptionSurfaces = [
      element.querySelector('.control-contract strong')?.textContent,
      element.querySelector('.control-contract span')?.textContent,
      element.querySelector('.fixture-effect-probe strong')?.textContent,
      element.querySelector('.fixture-effect-probe span')?.textContent,
      element.querySelector('.component-map')?.getAttribute('aria-label'),
    ];

    for (const copy of descriptionSurfaces) {
      expect(copy).toBeTruthy();
      expect(copy ?? '').toMatch(cyrillic);
    }
  });

  it('keeps visible Text Input, Select, and Error State sample copy in Russian', async () => {
    const cases = [
      {
        id: 'text-input',
        state: 'filled',
        expected: ['Название рабочего пространства', 'Постоянный идентификатор для участников'],
        forbidden: ['Workspace name', 'Stable identifier for members'],
      },
      {
        id: 'select',
        state: 'open',
        expected: [
          'Тариф рабочего пространства',
          'Выберите один доступный тариф.',
          'Для командной работы над продуктом',
        ],
        forbidden: [
          'Workspace plan',
          'Choose exactly one available plan.',
          'For collaborative product teams',
          'Advanced controls and governance',
        ],
      },
      {
        id: 'error-state',
        state: 'default',
        expected: [
          'Не удалось загрузить рабочие пространства',
          'Сервис не ответил. Ваши изменения сохранены.',
          'Повторить',
        ],
        forbidden: [
          'Could not load workspaces',
          'The service did not respond. Your changes are safe.',
          'Try again',
        ],
      },
    ] as const;

    for (const specimen of cases) {
      const fixture = TestBed.createComponent(PreviewFixtureRu);
      fixture.componentRef.setInput('item', catalogItem(specimen.id));
      fixture.componentRef.setInput('scenario', 'default');
      fixture.componentRef.setInput('state', specimen.state);
      fixture.componentRef.setInput('args', {});
      fixture.componentRef.setInput('resetRevision', 0);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const attributeCopy = [...element.querySelectorAll<HTMLElement>('*')]
        .flatMap((node) =>
          ['aria-label', 'placeholder', 'title'].map((attribute) => node.getAttribute(attribute)),
        )
        .filter((value): value is string => value !== null)
        .join(' ');
      const visibleCopy = `${element.textContent ?? ''} ${attributeCopy}`;

      for (const phrase of specimen.expected) {
        expect(visibleCopy, `${specimen.id}: ${phrase}`).toContain(phrase);
      }
      for (const phrase of specimen.forbidden) {
        expect(visibleCopy, `${specimen.id}: ${phrase}`).not.toContain(phrase);
      }
      fixture.destroy();
    }
  });

  it('does not leave English prose in the Error State preset or Header static preview', async () => {
    const errorFixture = TestBed.createComponent(PreviewFixtureRu);
    errorFixture.componentRef.setInput('item', catalogItem('error-state'));
    errorFixture.componentRef.setInput('scenario', 'default');
    errorFixture.componentRef.setInput('state', 'default');
    errorFixture.componentRef.setInput('args', {});
    errorFixture.componentRef.setInput('resetRevision', 0);
    errorFixture.detectChanges();
    await errorFixture.whenStable();
    errorFixture.detectChanges();

    const errorElement = errorFixture.nativeElement as HTMLElement;
    const errorTitle = errorElement.querySelector('krn-error-state h2')?.textContent;
    const errorDescription = errorElement.querySelector('krn-error-state .state > p')?.textContent;
    expect(errorTitle).toContain('Не удалось загрузить рабочие пространства');
    expect(errorDescription).toContain('Сервис не ответил. Ваши изменения сохранены.');
    expectRussianProse(errorTitle, 'error-state preset title');
    expectRussianProse(errorDescription, 'error-state preset description');
    errorFixture.destroy();

    const headerFixture = TestBed.createComponent(PreviewFixtureRu);
    headerFixture.componentRef.setInput('item', catalogItem('header'));
    headerFixture.componentRef.setInput('scenario', 'default');
    headerFixture.componentRef.setInput('state', 'default');
    headerFixture.componentRef.setInput('args', {});
    headerFixture.componentRef.setInput('resetRevision', 0);
    headerFixture.detectChanges();
    await headerFixture.whenStable();
    headerFixture.detectChanges();

    const headerElement = headerFixture.nativeElement as HTMLElement;
    const headerProse = [
      ['status', headerElement.querySelector('.live-indicator')?.textContent],
      ['navigation', headerElement.querySelector('.header-links')?.textContent],
      ['explanation', headerElement.querySelector('.bounded-surface > .surface-copy')?.textContent],
    ] as const;
    expect(headerProse[0][1]).toContain('Статический пример');
    expect(headerProse[1][1]).toContain('Обзор');
    expect(headerProse[1][1]).toContain('Отчёты');
    expect(headerProse[2][1]).toContain(
      'Закреплённая структура с явными начальным, центральным и конечным слотами.',
    );
    for (const [surface, copy] of headerProse) {
      expectRussianProse(copy, `header ${surface}`);
    }
    headerFixture.destroy();

    expect(
      englishProseMarkers(
        'Error State · Header · KernApiRow · input · string | null · start | static · danger · Avery Cole · KERN / OPS · 3:2',
      ),
      'component names, API types, enum values, and sample values are not prose failures',
    ).toEqual([]);
  });

  it('renders Russian prose values in the property editor without translating code values', async () => {
    TestBed.inject(DocsPreferences).locale.set('ru-RU');
    const cases = [
      {
        id: 'error-state',
        values: {
          title: 'Не удалось загрузить рабочие пространства',
          description: 'Сервис не ответил. Ваши изменения сохранены.',
        },
        selectValues: { tone: 'danger' },
      },
      {
        id: 'page-header',
        values: {
          description: 'Отслеживайте запуски, ошибки и пропускную способность во всех средах.',
        },
      },
      {
        id: 'checkbox',
        values: { value: 'Example value' },
      },
    ] as const;

    for (const specimen of cases) {
      const fixture = TestBed.createComponent(ComponentPlayground);
      fixture.componentRef.setInput('item', catalogItem(specimen.id));
      fixture.componentRef.setInput('code', '');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      for (const [key, expected] of Object.entries(specimen.values)) {
        const editor = element.querySelector<HTMLInputElement>(
          `[data-control-key="${key}"] input[type="text"]`,
        );
        expect(editor, `${specimen.id}.${key}: editor`).not.toBeNull();
        expect(editor?.value, `${specimen.id}.${key}: localized value`).toBe(expected);
      }
      if ('selectValues' in specimen) {
        for (const [key, expected] of Object.entries(specimen.selectValues)) {
          const editor = element.querySelector<HTMLSelectElement>(
            `[data-control-key="${key}"] select`,
          );
          expect(editor, `${specimen.id}.${key}: select editor`).not.toBeNull();
          expect(editor?.value, `${specimen.id}.${key}: raw select value`).toBe(expected);
        }
      }
      fixture.destroy();
    }
  });

  it('renders every form-contract title and description in Russian', async () => {
    const cyrillic = /[А-Яа-яЁё]/;

    for (const id of FORM_CONTRACT_IDS) {
      const fixture = TestBed.createComponent(PreviewFixtureRu);
      fixture.componentRef.setInput('item', catalogItem(id));
      fixture.componentRef.setInput('scenario', 'default');
      fixture.componentRef.setInput('state', 'default');
      fixture.componentRef.setInput('args', {});
      fixture.componentRef.setInput('resetRevision', 0);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const contract = (fixture.nativeElement as HTMLElement).querySelector('.control-contract');
      expect(contract, id).not.toBeNull();
      expect(contract?.querySelector('strong')?.textContent ?? '', `${id}.title`).toMatch(cyrillic);
      expect(contract?.querySelector('span')?.textContent ?? '', `${id}.description`).toMatch(
        cyrillic,
      );
      fixture.destroy();
    }
  });

  it('describes every featured Text Input story in Russian', () => {
    const definition = findKernPlaygroundDefinition('text-input');
    expect(definition).toBeDefined();
    if (!definition) return;
    const cyrillic = /[А-Яа-яЁё]/;

    for (const id of definition.featuredPresetIds) {
      const preset = definition.presets.find((candidate) => candidate.id === id);
      expect(preset, id).toBeDefined();
      if (!preset) continue;
      expect(describeKernPlaygroundStory('ru-RU', 'Text Input', preset, ['Value']), id).toMatch(
        cyrillic,
      );
    }
  });
});
