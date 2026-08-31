import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KERN_CATALOG } from '@kern-ui/showcase';
import {
  KERN_CATALOG_ALIASES,
  KERN_COMPONENT_CATALOG_INDEX,
  KERN_RECIPE_CATALOG_INDEX,
} from '@kern-ui/showcase/catalog-index';

import { App } from './app';
import { DocsI18n } from './docs-i18n';
import { KERN_DOCS_RELEASE_STATE_LABEL, KERN_DOCS_VERSION_LABEL } from './release-identity';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the documentation shell', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('KERN');
    expect(compiled.querySelector('.docs-version')?.textContent).toContain(KERN_DOCS_VERSION_LABEL);
    expect(compiled.querySelector('.docs-version')?.textContent).toContain(
      KERN_DOCS_RELEASE_STATE_LABEL,
    );
    expect(compiled.querySelector('.brand-mark')?.getAttribute('src')).toBe('favicon.svg');
    expect(compiled.querySelector('#docs-main')).toBeTruthy();
  });

  it('keeps component names unchanged in every locale', async () => {
    const i18n = TestBed.inject(DocsI18n);
    await i18n.prepare('ru-RU');

    for (const source of KERN_CATALOG) {
      expect(i18n.componentNameFor('ru-RU', source)).toBe(source.name);
      expect(i18n.catalogItemFor('ru-RU', source).name).toBe(source.name);
    }
  });

  it('uses complete Russian documentation for every component surface', async () => {
    const i18n = TestBed.inject(DocsI18n);
    await i18n.prepare('ru-RU');
    const cyrillic = /\p{Script=Cyrillic}/u;

    for (const source of KERN_CATALOG) {
      const localized = i18n.catalogItemFor('ru-RU', source);
      expect(localized.summary, `${source.id}: summary`).toMatch(cyrillic);
      expect(localized.summary, `${source.id}: summary fallback`).not.toBe(source.summary);
      for (const line of localized.keyboard) expect(line).toMatch(cyrillic);
      for (const line of localized.accessibility) expect(line).toMatch(cyrillic);
      expect(localized.do, `${source.id}: do`).toMatch(cyrillic);
      expect(localized.dont, `${source.id}: dont`).toMatch(cyrillic);
      for (const row of localized.api) {
        expect(row.description, `${source.id}.${row.name}: API description`).toMatch(cyrillic);
      }
    }
  });

  it('keeps component-specific Russian copy for the header API', async () => {
    const i18n = TestBed.inject(DocsI18n);
    await i18n.prepare('ru-RU');
    const header = KERN_CATALOG.find(({ id }) => id === 'header');

    expect(header).toBeDefined();
    if (!header) return;

    const localized = i18n.catalogItemFor('ru-RU', header);
    expect(localized.summary).toContain('Создаёт фиксированную или обычную шапку');
    const stickyOffset = header.api.find(({ name }) => name === 'stickyOffset');
    expect(stickyOffset).toBeDefined();
    if (!stickyOffset) return;
    const translatedDescription = i18n.apiDescriptionFor('ru-RU', {
      name: stickyOffset.name,
      kind: stickyOffset.kind,
      description: stickyOffset.description,
    });
    expect(translatedDescription).toMatch(/\p{Script=Cyrillic}/u);
    expect(translatedDescription).not.toBe(stickyOffset.description);
    expect(stickyOffset.description).not.toMatch(/^Configures the component /);
  });

  it('renders canonical components and recipes in separate navigation sections', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const hrefs = (selector: string): string[] =>
      [...compiled.querySelectorAll<HTMLAnchorElement>(selector)].map(
        (link) => link.getAttribute('href') ?? '',
      );
    const componentHrefs = hrefs('.component-category a');
    const recipeHrefs = hrefs('.recipe-section a');

    expect(componentHrefs).toHaveLength(KERN_COMPONENT_CATALOG_INDEX.length);
    expect(recipeHrefs).toHaveLength(KERN_RECIPE_CATALOG_INDEX.length);
    expect(componentHrefs).not.toContain('/components/login-form');
    expect(recipeHrefs).toContain('/components/login-form');
    for (const alias of Object.keys(KERN_CATALOG_ALIASES)) {
      expect(componentHrefs).not.toContain(`/components/${alias}`);
      expect(recipeHrefs).not.toContain(`/components/${alias}`);
    }
    expect(
      [...compiled.querySelectorAll<HTMLElement>('.family-label')].map((label) =>
        label.textContent?.trim(),
      ),
    ).toContain('Layout flow');
  });
});
