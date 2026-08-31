import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KrnJsonView } from './json-view';

@Component({
  imports: [KrnJsonView],
  template: `
    <krn-json-view
      ariaLabel="Deployment payload"
      [data]="payload"
      [defaultExpandDepth]="1"
      highlightPattern="deployment"
    />
  `,
})
class JsonViewHost {
  readonly payload = {
    deployment: { active: true, replicas: 3 },
    region: 'eu-central',
    error: null,
  } as const;
}

describe('KrnJsonView', () => {
  it('does not highlight a key until highlightPattern is explicitly provided', async () => {
    await TestBed.configureTestingModule({ imports: [KrnJsonView] }).compileComponents();
    const fixture = TestBed.createComponent(KrnJsonView);
    fixture.componentRef.setInput('data', { active: true });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('mark')).toBeNull();
  });

  it('renders JSON as a labelled, collapsible tree with typed values', async () => {
    await TestBed.configureTestingModule({ imports: [JsonViewHost] }).compileComponents();
    const fixture = TestBed.createComponent(JsonViewHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const tree = element.querySelector('[role="tree"]');
    const root = element.querySelector<HTMLElement>('[role="treeitem"]');
    expect(tree?.getAttribute('aria-label')).toBe('Deployment payload');
    expect(root?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('[data-kind="string"]')?.textContent).toContain('eu-central');
    expect(element.querySelector('mark')?.textContent).toBe('deployment');

    const keys = [...element.querySelectorAll<HTMLElement>('.key')].map(
      (key) => key.textContent ?? '',
    );
    expect(keys).toContain('deployment');
    expect(keys.every((key) => key === key.trim())).toBe(true);
  });

  it('uses Arrow keys to expand, collapse, and move roving focus', async () => {
    await TestBed.configureTestingModule({ imports: [JsonViewHost] }).compileComponents();
    const fixture = TestBed.createComponent(JsonViewHost);
    await fixture.whenStable();

    const root = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[role="treeitem"]',
    );
    root?.focus();
    root?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();

    const items = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="treeitem"]'),
    ];
    expect(document.activeElement).toBe(items[1]);

    items[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(items[1]?.getAttribute('aria-expanded')).toBe('true');
  });
});
