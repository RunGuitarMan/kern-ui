import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findKernComponent } from '@kern-ui/showcase';
import { findKernAgentExample } from '@kern-ui/showcase/examples';

import { ComponentPlayground } from '../playground/component-playground';

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
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly item = computed(() => findKernComponent(this.params().get('id') ?? ''));
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
      this.title.setTitle(current ? `${current.name} preview · Kern` : 'Preview not found · Kern');
    });
  }
}
