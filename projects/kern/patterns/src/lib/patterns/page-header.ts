import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { KrnIdService } from '@kern-ui/angular/cdk';

@Component({
  selector: 'krn-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class KrnPageHeader {
  private readonly ids = inject(KrnIdService);
  protected readonly headingId = this.ids.next('page-heading');
  protected readonly descriptionId = this.ids.fromKey(this.headingId, 'description');
  readonly index = input('01');
  readonly eyebrow = input('');
  readonly heading = input.required<string>();
  readonly description = input('');
  protected readonly resolvedIndex = computed(() => this.optionalText(this.index()));
  protected readonly resolvedEyebrow = computed(() => this.optionalText(this.eyebrow()));
  protected readonly resolvedHeading = computed(() => {
    const heading = this.optionalText(this.heading());
    if (!heading) {
      throw new Error('KrnPageHeader requires a non-empty heading.');
    }
    return heading;
  });
  protected readonly resolvedDescription = computed(() => this.optionalText(this.description()));

  private optionalText(value: string): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
