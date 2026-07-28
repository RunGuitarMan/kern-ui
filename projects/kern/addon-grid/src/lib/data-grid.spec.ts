import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { bootstrapApplication, By } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';

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

@Component({
  standalone: true,
  imports: [KrnDataGrid],
  template: `
    <ng-template #cell let-value let-row="row">
      <strong class="custom-cell">{{ row.name }}:{{ value }}</strong>
    </ng-template>
    <krn-data-grid
      [data]="rows"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [defaultCellTemplate]="cell"
      [pagination]="false"
    />
  `,
})
class TemplateGridHost {
  readonly rows = rows;
  readonly columns = columns;
  readonly rowIdentity = (row: DemoRow): number => row.id;
}

@Component({
  standalone: true,
  imports: [KrnDataGrid],
  template: `
    <ng-template #cell let-value let-row="row" let-column="column">
      @if (column.key === 'name') {
        <button type="button" class="row-action">Open {{ row.name }}</button>
        <input class="row-editor" [value]="value" [attr.aria-label]="'Edit ' + row.name" />
      } @else {
        {{ value }}
      }
    </ng-template>
    <krn-data-grid
      [data]="rows"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [defaultCellTemplate]="cell"
      [pagination]="false"
    />
    <button type="button" class="after-grid">After grid</button>
  `,
})
class InteractiveGridHost {
  readonly rows = rows;
  readonly columns = columns;
  readonly rowIdentity = (row: DemoRow): number => row.id;
}

@Component({
  standalone: true,
  imports: [KrnDataGrid],
  template: `
    <ng-template #cell let-row="row">
      <svg
        class="svg-row-action"
        role="button"
        tabindex="0"
        [attr.aria-label]="'Open ' + row.name"
      ></svg>
    </ng-template>
    <ng-template #detail let-row="row">
      <button type="button" class="expanded-action">Expanded {{ row.name }}</button>
    </ng-template>
    <krn-data-grid
      [data]="rows"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [defaultCellTemplate]="cell"
      [expandedTemplate]="detail"
      [expanded]="expanded"
      [pagination]="false"
      expandable
    />
  `,
})
class ExpandedInteractiveGridHost {
  readonly rows = rows.slice(0, 1);
  readonly columns = columns.slice(0, 1);
  readonly rowIdentity = (row: DemoRow): number => row.id;
  readonly expanded = new Set([1]);
}

@Component({
  selector: 'krn-data-grid-ssr-host',
  imports: [KrnDataGrid],
  template: `
    <ng-template #cell let-row="row">
      <button type="button" class="ssr-row-action">Open {{ row.name }}</button>
    </ng-template>
    <krn-data-grid
      [data]="rows"
      [columns]="columns"
      [rowIdentity]="rowIdentity"
      [defaultCellTemplate]="cell"
      [mode]="mode"
      [filterable]="false"
      selectable
      expandable
    />
  `,
})
class DataGridSsrHost {
  readonly rows = rows.slice(0, 1);
  readonly columns = columns.slice(0, 1);
  readonly rowIdentity = (row: DemoRow): number => row.id;
  readonly mode = { kind: 'client', pagination: false } as const;
}

describe('KrnDataGrid', () => {
  it('sorts, filters, selects, and paginates immutable rows', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('filterable', true);
    fixture.componentRef.setInput('selectable', true);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('th button') as HTMLButtonElement).click();
    await fixture.whenStable();
    const renderedRows = (): HTMLElement[] => [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'tbody tr:not(.detail-row)',
      ),
    ];
    expect(renderedRows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('Alpha'),
      expect.stringContaining('Beta'),
      expect.stringContaining('Gamma'),
    ]);

    fixture.componentInstance.filter.set('beta');
    fixture.detectChanges();
    expect(renderedRows()).toHaveLength(1);

    (renderedRows()[0]!.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    expect(fixture.componentInstance.selected().has(3)).toBe(true);
  });

  it('exposes table semantics and loading state', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeTruthy();
  });

  it('supports complete local copy overrides without replacing the global dictionary', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('labels', {
      ariaLabel: 'Datentabelle',
      empty: 'Keine Daten',
      rowCount: (count: number) => `${count} Zeilen`,
    });
    await fixture.whenStable();

    const shell = (fixture.nativeElement as HTMLElement).querySelector('.grid-shell');
    expect(shell?.getAttribute('aria-label')).toBe('Datentabelle');
    expect(shell?.textContent).toContain('0 Zeilen');
    expect(shell?.textContent).toContain('Keine Daten');
  });

  it('exposes the current width and range on operable column separators', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', [
      { ...columns[0]!, width: 180, minWidth: 120, maxWidth: 360 },
    ]);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('resizable', true);
    await fixture.whenStable();

    const separator = (fixture.nativeElement as HTMLElement).querySelector('[role="separator"]');
    expect(separator?.getAttribute('aria-valuemin')).toBe('120');
    expect(separator?.getAttribute('aria-valuemax')).toBe('360');
    expect(separator?.getAttribute('aria-valuenow')).toBe('180');
    expect(separator?.getAttribute('aria-valuetext')).toBe('180 pixels');
  });

  it('provides resize parity and managed header actions in virtual mode', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', [
      { ...columns[0]!, width: 180, minWidth: 120, maxWidth: 360 },
    ]);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('mode', { kind: 'virtual' });
    fixture.componentRef.setInput('resizable', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const headerCell = root.querySelector<HTMLElement>('[data-cell="-1-0"]')!;
    const sortButton = headerCell.querySelector<HTMLButtonElement>('button')!;
    const separator = headerCell.querySelector<HTMLElement>('[role="separator"]')!;
    expect(separator.getAttribute('aria-valuenow')).toBe('180');
    expect(sortButton.tabIndex).toBe(-1);
    expect(separator.tabIndex).toBe(-1);

    headerCell.focus();
    headerCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(sortButton).toBe(document.activeElement);
    expect(separator.tabIndex).toBe(0);

    sortButton.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(separator).toBe(document.activeElement);
    separator.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(separator.getAttribute('aria-valuenow')).toBe('190');
  });

  it('rejects row expansion in fixed-height virtual mode instead of ignoring it', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('mode', { kind: 'virtual' });
    fixture.componentRef.setInput('expandable', true);

    expect(() => fixture.detectChanges()).toThrowError(
      /virtual mode uses fixed-height rows and does not support row expansion/,
    );
  });

  it('keeps controlled data untouched and emits an explicit query contract', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('mode', { kind: 'controlled', totalRows: 42 });
    fixture.componentRef.setInput('pageSize', 2);
    await fixture.whenStable();

    const queries: unknown[] = [];
    fixture.componentInstance.queryChange.subscribe((query) => queries.push(query));
    fixture.componentInstance.filter.set('does not filter locally');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(rows.length);
    expect(fixture.nativeElement.querySelector('.pagination')?.textContent).toContain('42');

    (fixture.nativeElement.querySelector('th button') as HTMLButtonElement).click();
    const nextPage = fixture.nativeElement.querySelector(
      '.pagination button:last-child',
    ) as HTMLButtonElement;
    nextPage.click();
    nextPage.click();
    expect(queries).toEqual([
      {
        filter: 'does not filter locally',
        page: 1,
        pageSize: 2,
        sortKey: 'name',
        sortDirection: 'asc',
      },
      {
        filter: 'does not filter locally',
        page: 2,
        pageSize: 2,
        sortKey: 'name',
        sortDirection: 'asc',
      },
      {
        filter: 'does not filter locally',
        page: 3,
        pageSize: 2,
        sortKey: 'name',
        sortDirection: 'asc',
      },
    ]);
  });

  it('rejects duplicate row identities instead of coupling state to row position', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', () => 'duplicate');

    expect(() => fixture.detectChanges()).toThrowError(
      /unique row identities.*duplicate.*source indexes 0 and 1/,
    );
  });

  it('keeps selection and expansion attached to a concrete repeated object occurrence', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    const repeated = rows[0]!;
    fixture.componentRef.setInput('data', [repeated, repeated]);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput(
      'rowIdentity',
      (_row: DemoRow, index: number) => `occurrence-${index}`,
    );
    fixture.componentRef.setInput('mode', { kind: 'client', pagination: false });
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('expandable', true);
    fixture.componentRef.setInput('expandedContent', (_row: DemoRow) => 'Occurrence details');
    fixture.detectChanges();
    await fixture.whenStable();

    const mainRows = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>(
        'tbody > tr[role="row"]',
      ),
    ];
    expect(mainRows).toHaveLength(2);

    mainRows[0]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    expect([...fixture.componentInstance.selected()]).toEqual(['occurrence-0']);
    expect(mainRows[1]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(
      false,
    );

    mainRows[1]!.querySelector<HTMLButtonElement>('.expand-cell button')!.click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.expanded()]).toEqual(['occurrence-1']);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.detail-row')).toHaveLength(1);
  });

  it('supports repeated primitive row values through occurrence identities', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<string>);
    const primitiveColumns: readonly KrnDataColumn<string>[] = [
      {
        key: 'value',
        label: 'Value',
        accessor: (value) => value,
      },
    ];
    fixture.componentRef.setInput('data', ['same', 'same']);
    fixture.componentRef.setInput('columns', primitiveColumns);
    fixture.componentRef.setInput(
      'rowIdentity',
      (_row: string, index: number) => `primitive-${index}`,
    );
    fixture.componentRef.setInput('mode', { kind: 'client', pagination: false });
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const mainRows = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>(
        'tbody > tr[role="row"]',
      ),
    ];
    expect(mainRows).toHaveLength(2);
    expect(mainRows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('same'),
      expect.stringContaining('same'),
    ]);

    mainRows[1]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    expect([...fixture.componentInstance.selected()]).toEqual(['primitive-1']);
    expect(mainRows[0]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(
      false,
    );
  });

  it('supports accessors and explicit column visibility without responsive data loss', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    const accessorColumns: readonly KrnDataColumn<DemoRow>[] = [
      {
        key: 'display-name',
        label: 'Display name',
        sortable: true,
        accessor: (row) => row.name.toUpperCase(),
        filterValue: (row) => `${row.name} ${row.id}`,
      },
      columns[1]!,
    ];
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', accessorColumns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('columnChooser', true);
    await fixture.whenStable();

    fixture.componentInstance.filter.set('alpha 2');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('tbody')?.textContent).toContain('ALPHA');
    fixture.componentInstance.filter.set('');
    fixture.detectChanges();
    const chooserInputs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      '.column-chooser input[type="checkbox"]',
    );
    chooserInputs[1]!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('thead th')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('thead')?.textContent).not.toContain('Amount');
  });

  it('renders typed default cell templates', async () => {
    await TestBed.configureTestingModule({ imports: [TemplateGridHost] }).compileComponents();
    const fixture = TestBed.createComponent(TemplateGridHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.custom-cell')?.textContent,
    ).toContain('Gamma:Gamma');
  });

  it('scrolls a virtual viewport before moving focus outside the rendered range', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    const manyRows = Array.from({ length: 50 }, (_, index) => ({
      id: index + 1,
      name: `Row ${index + 1}`,
      amount: index,
    }));
    fixture.componentRef.setInput('data', manyRows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('mode', { kind: 'virtual' });
    fixture.detectChanges();
    await fixture.whenStable();

    const viewport = fixture.debugElement
      .query(By.directive(CdkVirtualScrollViewport))
      .injector.get(CdkVirtualScrollViewport);
    const scroll = vi.spyOn(viewport, 'scrollToIndex').mockImplementation(() => undefined);
    const keydown = new KeyboardEvent('keydown', {
      key: 'PageDown',
      bubbles: true,
      cancelable: true,
    });
    const internals = fixture.componentInstance as unknown as {
      readonly activeCell: () => { readonly row: number; readonly column: number };
      onCellKeydown(event: KeyboardEvent, row: number, column: number, rowCount: number): void;
    };
    internals.onCellKeydown(keydown, 0, 0, manyRows.length);

    expect(scroll).toHaveBeenCalledWith(8, 'auto');
    expect(keydown.defaultPrevented).toBe(true);
    expect(internals.activeCell()).toEqual({ row: 8, column: 0 });
  });

  it('uses one roving grid sequence for header, selection, expansion, and data cells', async () => {
    await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
    const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
    fixture.componentRef.setInput('mode', { kind: 'client', pagination: false });
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('expandable', true);
    fixture.componentRef.setInput('resizable', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const grid = root.querySelector<HTMLTableElement>('table[role="grid"]')!;
    const cells = [...grid.querySelectorAll<HTMLElement>('[data-cell]')];
    const actions = [...grid.querySelectorAll<HTMLElement>('button, input, [role="separator"]')];
    expect(grid.getAttribute('aria-rowcount')).toBe('4');
    expect(grid.getAttribute('aria-colcount')).toBe('4');
    expect(cells.filter((cell) => cell.tabIndex === 0).map((cell) => cell.dataset['cell'])).toEqual(
      ['0-0'],
    );
    expect(actions.every((action) => action.tabIndex === -1)).toBe(true);

    const selectionCell = grid.querySelector<HTMLElement>('[data-cell="0-0"]')!;
    const rowCheckbox = selectionCell.querySelector<HTMLInputElement>('input')!;
    selectionCell.focus();
    selectionCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(rowCheckbox).toBe(document.activeElement);
    expect(rowCheckbox.tabIndex).toBe(0);

    rowCheckbox.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(selectionCell).toBe(document.activeElement);
    expect(rowCheckbox.tabIndex).toBe(-1);

    selectionCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    const expansionCell = grid.querySelector<HTMLElement>('[data-cell="0-1"]')!;
    const expandButton = expansionCell.querySelector<HTMLButtonElement>('button')!;
    expect(expansionCell).toBe(document.activeElement);
    expansionCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(expandButton).toBe(document.activeElement);
    expandButton.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(expansionCell).toBe(document.activeElement);

    expansionCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(selectionCell).toBe(document.activeElement);
    selectionCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(grid.querySelector<HTMLElement>('[data-cell="-1-0"]')).toBe(document.activeElement);
  });

  it('keeps nested controls out of the grid tab sequence until action mode', async () => {
    await TestBed.configureTestingModule({ imports: [InteractiveGridHost] }).compileComponents();
    const fixture = TestBed.createComponent(InteractiveGridHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const firstCell = root.querySelector<HTMLElement>('[data-cell="0-0"]')!;
    const secondCell = root.querySelector<HTMLElement>('[data-cell="0-1"]')!;
    const action = firstCell.querySelector<HTMLButtonElement>('.row-action')!;
    const editor = firstCell.querySelector<HTMLInputElement>('.row-editor')!;
    const afterGrid = root.querySelector<HTMLButtonElement>('.after-grid')!;

    expect(firstCell.tabIndex).toBe(0);
    expect(secondCell.tabIndex).toBe(-1);
    expect(action.tabIndex).toBe(-1);
    expect(editor.tabIndex).toBe(-1);

    firstCell.focus();
    const navigationTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    firstCell.dispatchEvent(navigationTab);
    expect(navigationTab.defaultPrevented).toBe(false);
    if (!navigationTab.defaultPrevented) afterGrid.focus();
    expect(afterGrid).toBe(document.activeElement);

    firstCell.focus();
    firstCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();

    expect(action).toBe(document.activeElement);
    expect(firstCell.hasAttribute('data-action-mode')).toBe(true);
    expect(action.tabIndex).toBe(0);
    expect(editor.tabIndex).toBe(0);

    afterGrid.focus();
    fixture.detectChanges();
    expect(afterGrid).toBe(document.activeElement);
    expect(firstCell.hasAttribute('data-action-mode')).toBe(false);
    expect(action.tabIndex).toBe(-1);
    expect(editor.tabIndex).toBe(-1);

    firstCell.focus();
    firstCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(action).toBe(document.activeElement);

    const reverseTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    action.dispatchEvent(reverseTab);
    fixture.detectChanges();
    expect(reverseTab.defaultPrevented).toBe(true);
    expect(firstCell).toBe(document.activeElement);
    expect(firstCell.hasAttribute('data-action-mode')).toBe(false);

    firstCell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    fixture.detectChanges();
    expect(action).toBe(document.activeElement);

    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    action.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);
    expect(action).toBe(document.activeElement);

    const innerTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    action.dispatchEvent(innerTab);
    expect(innerTab.defaultPrevented).toBe(true);
    expect(editor).toBe(document.activeElement);

    const cellTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(cellTab);
    if (!cellTab.defaultPrevented) afterGrid.focus();
    await Promise.resolve();
    fixture.detectChanges();

    expect(cellTab.defaultPrevented).toBe(false);
    expect(afterGrid).toBe(document.activeElement);
    expect(firstCell.hasAttribute('data-action-mode')).toBe(false);
    expect(action.tabIndex).toBe(-1);
    expect(editor.tabIndex).toBe(-1);
  });

  it('returns action focus to the owning cell and never consumes editing navigation keys', async () => {
    await TestBed.configureTestingModule({ imports: [InteractiveGridHost] }).compileComponents();
    const fixture = TestBed.createComponent(InteractiveGridHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const firstCell = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-cell="0-0"]',
    )!;
    const editor = firstCell.querySelector<HTMLInputElement>('.row-editor')!;

    editor.focus();
    fixture.detectChanges();
    expect(firstCell.hasAttribute('data-action-mode')).toBe(true);

    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      editor.dispatchEvent(event);
      expect(event.defaultPrevented, key).toBe(false);
      expect(editor, key).toBe(document.activeElement);
    }

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(escape);
    fixture.detectChanges();

    expect(escape.defaultPrevented).toBe(true);
    expect(firstCell).toBe(document.activeElement);
    expect(firstCell.hasAttribute('data-action-mode')).toBe(false);
    expect(editor.tabIndex).toBe(-1);
  });

  it('manages SVG actions and exits action mode when focus moves into expanded content', async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandedInteractiveGridHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExpandedInteractiveGridHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const action = root.querySelector<SVGElement>('.svg-row-action')!;
    const cell = action.closest<HTMLElement>('[data-cell]')!;
    const expandedAction = root.querySelector<HTMLButtonElement>('.expanded-action')!;

    expect(action.getAttribute('tabindex')).toBe('-1');
    action.focus();
    fixture.detectChanges();
    expect(document.activeElement).toBe(action);
    expect(cell.hasAttribute('data-action-mode')).toBe(true);
    expect(action.getAttribute('tabindex')).toBe('0');

    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    action.dispatchEvent(tab);
    await Promise.resolve();
    fixture.detectChanges();
    expect(tab.defaultPrevented).toBe(false);
    expect(cell.hasAttribute('data-action-mode')).toBe(false);
    expect(action.getAttribute('tabindex')).toBe('-1');

    cell.focus();
    action.focus();
    fixture.detectChanges();
    expect(cell.hasAttribute('data-action-mode')).toBe(true);
    expandedAction.focus();
    fixture.detectChanges();
    expect(document.activeElement).toBe(expandedAction);
    expect(cell.hasAttribute('data-action-mode')).toBe(false);
    expect(action.getAttribute('tabindex')).toBe('-1');
  });

  it('measures the CSS row size for virtual density and text zoom without losing focus', async () => {
    const originalResizeObserver = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
    let resizeCallback: ResizeObserverCallback | undefined;
    class GridResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: GridResizeObserver,
    });

    try {
      await TestBed.configureTestingModule({ imports: [KrnDataGrid] }).compileComponents();
      const fixture = TestBed.createComponent(KrnDataGrid<DemoRow>);
      const manyRows = Array.from({ length: 50 }, (_, index) => ({
        id: index + 1,
        name: `Row ${index + 1}`,
        amount: index,
      }));
      fixture.componentRef.setInput('data', manyRows);
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('rowIdentity', (row: DemoRow) => row.id);
      fixture.componentRef.setInput('mode', { kind: 'virtual' });
      fixture.detectChanges();
      await fixture.whenStable();

      const viewport = fixture.debugElement
        .query(By.directive(CdkVirtualScrollViewport))
        .injector.get(CdkVirtualScrollViewport);
      Object.defineProperty(viewport.elementRef.nativeElement, 'clientHeight', {
        configurable: true,
        value: 360,
      });
      viewport.checkViewportSize();
      await Promise.resolve();
      fixture.detectChanges();
      await Promise.resolve();
      fixture.detectChanges();
      await fixture.whenStable();

      const viewportElement = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
        'cdk-virtual-scroll-viewport',
      )!;
      const row = viewportElement.querySelector<HTMLElement>('.virtual-row')!;
      const firstCell = row.querySelector<HTMLElement>('[data-cell="0-0"]')!;
      const checkViewport = vi.spyOn(viewport, 'checkViewportSize');
      const rowRect = vi.spyOn(row, 'getBoundingClientRect');

      rowRect.mockReturnValue({ height: 52 } as DOMRect);
      resizeCallback?.([], {} as ResizeObserver);
      fixture.detectChanges();
      await Promise.resolve();

      expect(viewportElement.dataset['itemSize']).toBe('52');
      expect(checkViewport).toHaveBeenCalled();

      firstCell.focus();
      rowRect.mockReturnValue({ height: 104 } as DOMRect);
      resizeCallback?.([], {} as ResizeObserver);
      fixture.detectChanges();
      await Promise.resolve();

      expect(viewportElement.dataset['itemSize']).toBe('104');
      expect(firstCell).toBe(document.activeElement);

      const pageDown = new KeyboardEvent('keydown', {
        key: 'PageDown',
        bubbles: true,
        cancelable: true,
      });
      const scroll = vi.spyOn(viewport, 'scrollToIndex').mockImplementation(() => undefined);
      firstCell.dispatchEvent(pageDown);
      expect(scroll).toHaveBeenCalledWith(3, 'auto');
      expect(pageDown.defaultPrevented).toBe(true);
    } finally {
      if (originalResizeObserver) {
        Object.defineProperty(window, 'ResizeObserver', originalResizeObserver);
      } else {
        Reflect.deleteProperty(window, 'ResizeObserver');
      }
    }
  });

  it('serializes the same single-tab-stop grid contract before hydration', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(DataGridSsrHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-data-grid-ssr-host></krn-data-grid-ssr-host></body></html>',
        url: 'https://kern.example/data-grid',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
    const cells = [...grid.querySelectorAll<HTMLElement>('[data-cell]')];
    const nestedActions = [
      ...grid.querySelectorAll<HTMLElement>('button, input, [role="separator"]'),
    ];

    expect(cells.filter((cell) => cell.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(nestedActions.length).toBeGreaterThan(0);
    expect(nestedActions.every((action) => action.getAttribute('tabindex') === '-1')).toBe(true);
    expect(grid.querySelector('.ssr-row-action')?.getAttribute('tabindex')).toBe('-1');
    expect(grid.closest('.table-scroll')?.hasAttribute('tabindex')).toBe(false);
  });
});
