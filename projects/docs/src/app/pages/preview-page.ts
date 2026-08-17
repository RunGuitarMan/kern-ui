import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findKernComponent } from '@kern-ui/showcase';
import { findKernAgentExample } from '@kern-ui/showcase/examples';

import { ComponentPlayground } from '../playground/component-playground';
import { DocsI18n } from '../docs-i18n';

@Component({
  selector: 'kdocs-preview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ComponentPlayground],
  templateUrl: './preview-page.html',
  styleUrl: './preview-page.css',
})
export class PreviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  protected readonly i18n = inject(DocsI18n);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly locale = computed(() =>
    this.query().get('locale') === 'ru-RU' ? 'ru-RU' : 'en-US',
  );

  private readonly sourceItem = computed(() => findKernComponent(this.params().get('id') ?? ''));
  protected readonly item = computed(() => {
    const item = this.sourceItem();
    return item ? this.i18n.catalogItemFor(this.locale(), item) : undefined;
  });
  protected readonly codeExample = computed(() => {
    const current = this.item();
    if (!current) return '';
    const example = findKernAgentExample(current.id);
    if (!example) {
      throw new Error(`Missing compile-verified example for catalog component "${current.id}".`);
    }
    return example.code;
  });

  constructor() {
    effect(() => {
      const current = this.item();
      this.title.setTitle(
        current
          ? `${current.name} · ${this.tr('playground.preview', 'Preview')} · Kern`
          : `${this.tr('preview.notFound', 'Preview not found')} · Kern`,
      );
    });
  }

  protected tr(key: string, fallback: string): string {
    return this.i18n.tFor(this.locale(), key, fallback);
  }
}
