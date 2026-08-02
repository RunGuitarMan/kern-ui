import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { KRN_LOCALE, KRN_TRANSLATIONS } from '@kern-ui/angular/core';

@Component({
  selector: 'krn-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" (error)="imageFailed.set(true)" [hidden]="imageFailed()" />
    }
    @if (!src() || imageFailed()) {
      <span aria-hidden="true">{{ initials() }}</span>
      <span class="sr-only">{{ alt() || name() }}</span>
    }
    @if (status()) {
      <span class="status" [attr.data-status]="status()" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      flex: 0 0 auto;
      place-items: center;
      overflow: visible;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-radius: 50%;
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface-raised, #f2f3f5);
      font: 650 0.75rem/1 var(--krn-font-family-ui, sans-serif);
    }
    :host([data-size='sm']) {
      inline-size: 2rem;
      block-size: 2rem;
      font-size: 0.6875rem;
    }
    :host([data-size='lg']) {
      inline-size: 3.25rem;
      block-size: 3.25rem;
      font-size: 0.875rem;
    }
    img {
      inline-size: 100%;
      block-size: 100%;
      border-radius: inherit;
      object-fit: cover;
    }
    .status {
      position: absolute;
      inset-inline-end: -1px;
      inset-block-end: -1px;
      inline-size: 0.625rem;
      block-size: 0.625rem;
      border: 2px solid var(--krn-color-surface, #fff);
      border-radius: 50%;
      background: var(--krn-color-text-muted, #626a76);
    }
    .status[data-status='online'] {
      background: var(--krn-color-success-solid, #1c8d62);
    }
    .status[data-status='busy'] {
      background: var(--krn-color-danger-solid, #c73a35);
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class KrnAvatar {
  readonly locale = input(inject(KRN_LOCALE));
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
      .map((word) => word[0]?.toLocaleUpperCase(this.locale()) ?? '')
      .join('');
  });
}

@Component({
  selector: 'krn-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--krn-avatar-overlap]': 'overlap()',
    '[attr.aria-label]': 'ariaLabel()',
    role: 'group',
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }
    :host ::ng-deep krn-avatar + krn-avatar {
      margin-inline-start: calc(var(--krn-avatar-overlap, 0.625rem) * -1);
    }
    :host ::ng-deep krn-avatar {
      box-shadow: 0 0 0 2px var(--krn-color-canvas, #faf9f7);
    }
  `,
})
export class KrnAvatarGroup {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly ariaLabel = input(this.translations.dataDisplay.people);
  readonly overlap = input('0.625rem');
}
