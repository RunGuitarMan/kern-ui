import { TestBed } from '@angular/core/testing';

import { DataGridExamples } from './data-grid-examples';

describe('DataGridExamples', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DataGridExamples] }).compileComponents();
  });

  it('renders three independent Data Grid compositions', async () => {
    const fixture = TestBed.createComponent(DataGridExamples);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('krn-data-grid')).toHaveLength(3);
    expect(element.querySelectorAll('[data-testid^="data-grid-example-"]')).toHaveLength(3);
    expect(
      element.querySelectorAll('[data-testid="data-grid-example-orders"] [role="row"]'),
    ).toHaveLength(6);
  });

  it('updates an edited quantity and the derived total', async () => {
    const fixture = TestBed.createComponent(DataGridExamples);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('[aria-label="Quantity for Item Alpha"]');
    expect(input).not.toBeNull();
    if (!input) return;

    input.value = '3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="quantity-total"]')?.textContent?.trim()).toBe(
      '$100.00',
    );
  });

  it('provides a copy-ready implementation for each composition', () => {
    const fixture = TestBed.createComponent(DataGridExamples);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const codeBlocks = [...element.querySelectorAll('krn-code-block')];
    expect(codeBlocks).toHaveLength(3);
    expect(codeBlocks[0]?.textContent).toContain('export class OrdersGrid');
    expect(codeBlocks[1]?.textContent).toContain('export class OrderEditorGrid');
    expect(codeBlocks[2]?.textContent).toContain('export class TaskStatusGrid');
  });

  it('uses one subtle recipe for every semantic status badge', async () => {
    const fixture = TestBed.createComponent(DataGridExamples);
    fixture.detectChanges();
    await fixture.whenStable();

    const badges = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'krn-badge[data-status]',
      ),
    ];
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.every((badge) => badge.dataset['variant'] === 'subtle')).toBe(true);
    expect(new Set(badges.map((badge) => badge.dataset['tone']))).toEqual(
      new Set(['success', 'warning', 'danger', 'neutral']),
    );
  });
});
