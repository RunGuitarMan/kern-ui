import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCombobox, type KrnOptionsState, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-remote-combobox-recipe',
  standalone: true,
  imports: [KrnCombobox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-combobox
      ariaLabel="Escalation owner"
      [formControl]="owner"
      [options]="options()"
      [optionsState]="optionsState()"
      [filterLocally]="false"
      [(open)]="open"
      (queryChange)="search($event)"
    />
    @if (optionsState() === 'error') {
      <button type="button" (click)="retry()">Retry owner search</button>
    }
  `,
})
export class KernRemoteComboboxRecipe implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private activeRequest: AbortController | null = null;
  private lastQuery = '';

  readonly owner = new FormControl('', { nonNullable: true });
  readonly options = signal<readonly KrnSelectOption<string>[]>([]);
  readonly optionsState = signal<KrnOptionsState>('ready');
  open = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.activeRequest?.abort());
  }

  ngOnInit(): void {
    this.search('');
  }

  search(query: string): void {
    this.lastQuery = query;
    this.activeRequest?.abort();
    const controller = new AbortController();
    this.activeRequest = controller;
    this.options.set([]);
    this.optionsState.set('loading');

    void this.requestOptions(query, controller.signal)
      .then((options) => {
        if (controller.signal.aborted) return;
        this.options.set(options);
        this.optionsState.set('ready');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        this.options.set([]);
        this.optionsState.set('error');
      })
      .finally(() => {
        if (this.activeRequest === controller) this.activeRequest = null;
      });
  }

  retry(): void {
    this.search(this.lastQuery);
  }

  private async requestOptions(
    query: string,
    signal: AbortSignal,
  ): Promise<readonly KrnSelectOption<string>[]> {
    const url = `/api/owners?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Owner search failed with ${response.status}.`);
    const payload: unknown = await response.json();
    if (!isOptionArray(payload)) throw new TypeError('Owner search returned invalid options.');
    return payload;
  }
}

function isOptionArray(value: unknown): value is readonly KrnSelectOption<string>[] {
  return (
    Array.isArray(value) &&
    value.every(
      (option: unknown) =>
        Boolean(option) &&
        typeof option === 'object' &&
        typeof (option as { value?: unknown }).value === 'string' &&
        typeof (option as { label?: unknown }).label === 'string',
    )
  );
}

void bootstrapApplication(KernRemoteComboboxRecipe);
