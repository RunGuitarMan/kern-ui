import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import { krnInputFallback } from '../reactive-input';

@Component({
  selector: 'krn-disclosure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './disclosure.html',
  styleUrl: './disclosure.css',
})
export class KrnDisclosure {
  readonly heading = input.required<string>();
  readonly open = model(false);

  protected onToggle(event: Event): void {
    this.open.set((event.currentTarget as HTMLDetailsElement).open);
  }
}

@Component({
  selector: 'krn-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  templateUrl: './accordion.html',
  styleUrl: './accordion.css',
})
export class KrnAccordion {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input<string | undefined>();
  protected readonly resolvedAriaLabel = krnInputFallback(
    this.ariaLabel,
    () => this.translations.dataDisplay.accordion,
  );
}
