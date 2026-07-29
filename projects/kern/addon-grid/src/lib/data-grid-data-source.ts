import { signal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import type { KrnDataGridQuery } from './data-grid';

export interface KrnDataGridPage<T> {
  readonly data: readonly T[];
  readonly totalRows: number;
}

export interface KrnDataGridLoadContext {
  /** Aborted whenever a newer query starts or the source is disconnected. */
  readonly signal: AbortSignal;
}

export type KrnDataGridLoader<T> = (
  query: Readonly<KrnDataGridQuery>,
  context: KrnDataGridLoadContext,
) => Promise<KrnDataGridPage<T>>;

export interface KrnDataGridDataSourceOptions<T> {
  readonly initialPage?: KrnDataGridPage<T>;
  readonly errorMessage?: (error: unknown) => string;
}

/**
 * Latest-query-wins adapter for the Data Grid controlled mode.
 *
 * The adapter deliberately owns request state, not transport policy: consumers can use fetch,
 * GraphQL, RPC, or a repository in the loader. Aborted requests never overwrite newer data.
 */
export class KrnDataGridDataSource<T> {
  private readonly dataState: WritableSignal<readonly T[]>;
  private readonly totalRowsState: WritableSignal<number>;
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly queryState = signal<Readonly<KrnDataGridQuery> | null>(null);
  private readonly errorMessage: (error: unknown) => string;
  private activeController: AbortController | null = null;
  private requestSequence = 0;

  readonly data: Signal<readonly T[]>;
  readonly totalRows: Signal<number>;
  readonly loading: Signal<boolean> = this.loadingState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();
  readonly query: Signal<Readonly<KrnDataGridQuery> | null> = this.queryState.asReadonly();

  constructor(
    private readonly loader: KrnDataGridLoader<T>,
    options: KrnDataGridDataSourceOptions<T> = {},
  ) {
    const initial = options.initialPage ?? { data: [], totalRows: 0 };
    this.assertPage(initial);
    this.dataState = signal(initial.data);
    this.totalRowsState = signal(initial.totalRows);
    this.data = this.dataState.asReadonly();
    this.totalRows = this.totalRowsState.asReadonly();
    this.errorMessage =
      options.errorMessage ??
      ((error) => (error instanceof Error ? error.message : 'The data request failed.'));
  }

  async load(query: Readonly<KrnDataGridQuery>): Promise<KrnDataGridPage<T> | null> {
    this.activeController?.abort();
    const controller = new AbortController();
    const sequence = ++this.requestSequence;
    this.activeController = controller;
    this.queryState.set({ ...query });
    this.errorState.set(null);
    this.loadingState.set(true);

    try {
      const page = await this.loader(query, { signal: controller.signal });
      if (controller.signal.aborted || sequence !== this.requestSequence) return null;
      this.assertPage(page);
      this.dataState.set(page.data);
      this.totalRowsState.set(page.totalRows);
      return page;
    } catch (error) {
      if (controller.signal.aborted || sequence !== this.requestSequence) return null;
      this.errorState.set(this.errorMessage(error));
      return null;
    } finally {
      if (sequence === this.requestSequence) {
        this.activeController = null;
        this.loadingState.set(false);
      }
    }
  }

  async reload(): Promise<KrnDataGridPage<T> | null> {
    const query = this.queryState();
    return query ? this.load(query) : null;
  }

  reset(page: KrnDataGridPage<T> = { data: [], totalRows: 0 }): void {
    this.assertPage(page);
    this.disconnect();
    this.queryState.set(null);
    this.errorState.set(null);
    this.dataState.set(page.data);
    this.totalRowsState.set(page.totalRows);
  }

  disconnect(): void {
    this.requestSequence += 1;
    this.activeController?.abort();
    this.activeController = null;
    this.loadingState.set(false);
  }

  private assertPage(page: KrnDataGridPage<T>): void {
    if (!Array.isArray(page.data)) {
      throw new TypeError('KrnDataGridDataSource loader must resolve to an array in `data`.');
    }
    if (!Number.isSafeInteger(page.totalRows) || page.totalRows < 0) {
      throw new RangeError(
        'KrnDataGridDataSource `totalRows` must be a non-negative safe integer.',
      );
    }
  }
}
