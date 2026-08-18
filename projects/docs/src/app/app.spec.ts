import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KERN_CATALOG } from '@kern-ui/showcase';

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
});
