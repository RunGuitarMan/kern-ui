import { ChangeDetectionStrategy, Component, effect, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { KrnGlobalSearch, type KrnSearchResult } from '@kern-ui/angular/patterns';
import { KERN_CATALOG } from '@kern-ui/showcase';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'kdocs-global-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnGlobalSearch],
  template: `
    <krn-global-search
      #search
      ariaLabel="Search Kern components"
      placeholder="Jump to a component…"
      [results]="results"
      (resultSelected)="openResult($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }

    krn-global-search {
      inline-size: 100%;
    }
  `,
})
export class DocsGlobalSearch {
  private readonly router = inject(Router);
  private readonly search = viewChild<KrnGlobalSearch>('search');
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly results: readonly KrnSearchResult[] = KERN_CATALOG.map((item) => ({
    id: item.id,
    label: item.name,
    description: item.summary,
    group: item.category,
    keywords: [item.selector, item.category],
  }));

  constructor() {
    effect(() => {
      this.currentUrl();
      this.search()?.query.set('');
    });
  }

  protected openResult(result: KrnSearchResult): void {
    this.search()?.query.set('');
    void this.router.navigate(['/components', result.id]);
  }
}
