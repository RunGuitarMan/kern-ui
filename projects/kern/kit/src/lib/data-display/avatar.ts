import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';
import { krnResolvedLocale } from '../reactive-locale';

@Component({
  selector: 'krn-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class KrnAvatar {
  readonly locale = input<string | undefined>();
  private readonly resolvedLocale = krnResolvedLocale(this.locale);
  readonly src = input<string | undefined>();
  readonly alt = input('');
  readonly name = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly status = input<'online' | 'away' | 'busy' | undefined>();
  readonly imageFailed = model(false);
  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toLocaleUpperCase(this.resolvedLocale()) ?? '')
      .join('');
  });
}

@Component({
  selector: 'krn-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'krn-avatar-group',
    '[style.--krn-avatar-overlap]': 'overlap()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    role: 'group',
  },
  templateUrl: './avatar-group.html',
  styleUrl: './avatar-group.css',
})
export class KrnAvatarGroup {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.dataDisplay.people,
  );
  readonly overlap = input('0.625rem');
}
