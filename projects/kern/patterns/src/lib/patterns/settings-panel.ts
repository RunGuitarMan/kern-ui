import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { type KrnOverlayInitialFocus } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { KrnDrawer, type KrnOverlayCloseReason } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-settings-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnDrawer],
  host: {
    '[attr.data-open]': 'open() ? "" : null',
  },
  templateUrl: './settings-panel.html',
})
export class KrnSettingsPanel {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly heading = input<typeof this.translations.patterns.settings | undefined>();
  readonly closeLabel = input<typeof this.translations.patterns.closeSettings | undefined>();
  readonly initialFocus = input<KrnOverlayInitialFocus>('first-tabbable');
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutside = input(true, { transform: booleanAttribute });
  readonly open = model(false);
  readonly closed = output<KrnOverlayCloseReason>();
  protected readonly resolvedHeading = computed(() =>
    this.requiredLabel(this.heading(), this.translations.patterns.settings, 'Settings'),
  );
  protected readonly resolvedCloseLabel = computed(() =>
    this.requiredLabel(
      this.closeLabel(),
      this.translations.patterns.closeSettings,
      'Close settings',
    ),
  );

  private requiredLabel(value: string | undefined, fallback: string, hardFallback: string): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '';
    return normalized || normalizedFallback || hardFallback;
  }
}
