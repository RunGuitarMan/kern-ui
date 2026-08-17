import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-mobile-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  templateUrl: './mobile-navigation.html',
  styleUrl: './mobile-navigation.css',
})
export class KrnMobileNavigation {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input<typeof this.translations.patterns.mobileNavigation | undefined>();
  protected readonly resolvedAriaLabel = computed(() => {
    const label = this.normalizeText(this.ariaLabel());
    const fallback = this.normalizeText(this.translations.patterns.mobileNavigation);
    return label || fallback || 'Mobile navigation';
  });

  private normalizeText(value: string | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
