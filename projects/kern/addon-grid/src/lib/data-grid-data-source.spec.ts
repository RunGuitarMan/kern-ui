import { KrnDataGridDataSource, type KrnDataGridPage } from './data-grid-data-source';
import type { KrnDataGridQuery } from './data-grid';

const query = (page: number): KrnDataGridQuery => ({
  filter: '',
  page,
  pageSize: 20,
  sortKey: 'name',
  sortDirection: 'asc',
});

describe('KrnDataGridDataSource', () => {
  it('exposes deterministic loading, data, total and query state', async () => {
    const source = new KrnDataGridDataSource<number>(async ({ page }) => ({
      data: [page],
      totalRows: 42,
    }));

    const request = source.load(query(2));
    expect(source.loading()).toBe(true);
    expect(source.query()).toEqual(query(2));

    await expect(request).resolves.toEqual({ data: [2], totalRows: 42 });
    expect(source.loading()).toBe(false);
    expect(source.data()).toEqual([2]);
    expect(source.totalRows()).toBe(42);
    expect(source.error()).toBeNull();
  });

  it('aborts an older request and prevents stale data from winning', async () => {
    const resolvers: Array<(page: KrnDataGridPage<number>) => void> = [];
    const signals: AbortSignal[] = [];
    const source = new KrnDataGridDataSource<number>(
      (_query, context) =>
        new Promise((resolve) => {
          signals.push(context.signal);
          resolvers.push(resolve);
        }),
    );

    const first = source.load(query(1));
    const second = source.load(query(2));
    expect(signals[0]?.aborted).toBe(true);

    resolvers[1]?.({ data: [2], totalRows: 2 });
    await expect(second).resolves.toEqual({ data: [2], totalRows: 2 });
    resolvers[0]?.({ data: [1], totalRows: 1 });
    await expect(first).resolves.toBeNull();
    expect(source.data()).toEqual([2]);
  });

  it('maps current request errors without clearing the previous successful page', async () => {
    const source = new KrnDataGridDataSource<number>(
      async ({ page }) => {
        if (page === 2) throw new Error('Backend unavailable');
        return { data: [page], totalRows: 3 };
      },
      { initialPage: { data: [0], totalRows: 1 } },
    );

    await source.load(query(1));
    await expect(source.load(query(2))).resolves.toBeNull();
    expect(source.data()).toEqual([1]);
    expect(source.totalRows()).toBe(3);
    expect(source.error()).toBe('Backend unavailable');
  });

  it('rejects malformed page contracts before publishing them', async () => {
    const source = new KrnDataGridDataSource<number>(async () => ({
      data: [],
      totalRows: -1,
    }));

    await expect(source.load(query(1))).resolves.toBeNull();
    expect(source.error()).toMatch(/non-negative safe integer/);
  });
});
