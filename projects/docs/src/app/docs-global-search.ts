import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { KrnGlobalSearch, type KrnSearchResult } from '@kern-ui/angular/patterns';
import { KERN_CATALOG } from '@kern-ui/showcase';
import { filter, map, startWith } from 'rxjs';

import { DocsI18n } from './docs-i18n';

@Component({
  selector: 'kdocs-global-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnGlobalSearch],
  templateUrl: './docs-global-search.html',
  styleUrl: './docs-global-search.css',
})
export class DocsGlobalSearch {
  private readonly router = inject(Router);
  protected readonly i18n = inject(DocsI18n);
  private readonly search = viewChild<KrnGlobalSearch>('search');
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly results = computed<readonly KrnSearchResult[]>(() =>
    KERN_CATALOG.map((source) => {
      const item = this.i18n.catalogItem(source);
      return {
        id: item.id,
        label: item.name,
        description: item.summary,
        group: this.i18n.category(item.category),
        keywords: [item.selector, item.category, this.i18n.category(item.category)],
      };
    }),
  );

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
