import { TestBed } from '@angular/core/testing';

import { KrnDataGrid, type KrnDataColumn } from './data-grid';

interface DemoRow extends Record<string, unknown> {
  readonly id: number;
  readonly name: string;
  readonly amount: number;
}

const rows: readonly DemoRow[] = [
  { id: 1, name: 'Gamma', amount: 18 },
  { id: 2, name: 'Alpha', amount: 42 },
  { id: 3, name: 'Beta', amount: 7 },
];

const columns: readonly KrnDataColumn<DemoRow>[] = [
  { key: 'name', label: 'Name', sortable: true, priority: 'primary' },
  { key: 'amount', label: 'Amount', sortable: true, align: 'end' },
];

describe('KrnDataGrid', () => {
  it('sorts, filters, selects, and paginates immutable rows', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    await fixture.whenStable();

    fixture.componentInstance.sort(columns[0]!);
    expect(fixture.componentInstance.processed().map((row) => row.name)).toEqual(['Alpha', 'Beta', 'Gamma']);

    fixture.componentInstance.filter.set('beta');
    expect(fixture.componentInstance.processed()).toHaveLength(1);

    fixture.componentInstance.toggleRow(rows[2]!, 0);
    expect(fixture.componentInstance.selected().has(3)).toBe(true);
  });

  it('exposes table semantics and loading state', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeTruthy();
  });

  it('exposes the current width and range on operable column separators', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', [
      { ...columns[0]!, width: 180, minWidth: 120, maxWidth: 360 },
    ]);
    fixture.componentRef.setInput('resizable', true);
    await fixture.whenStable();

    const separator = (fixture.nativeElement as HTMLElement).querySelector('[role="separator"]');
    expect(separator?.getAttribute('aria-valuemin')).toBe('120');
    expect(separator?.getAttribute('aria-valuemax')).toBe('360');
    expect(separator?.getAttribute('aria-valuenow')).toBe('180');
    expect(separator?.getAttribute('aria-valuetext')).toBe('180 pixels');
  });
});
