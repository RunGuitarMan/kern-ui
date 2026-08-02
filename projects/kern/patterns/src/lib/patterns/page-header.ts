import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { KrnIdService } from '@kern-ui/angular/cdk';

@Component({
  selector: 'krn-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="frame"
      [attr.data-index]="resolvedIndex() ? '' : null"
      [attr.aria-labelledby]="headingId"
      [attr.aria-describedby]="resolvedDescription() ? descriptionId : null"
    >
      @if (resolvedIndex()) {
        <div class="index" aria-hidden="true">{{ resolvedIndex() }}</div>
      }
      <div class="copy">
        @if (resolvedEyebrow()) {
          <span class="eyebrow">{{ resolvedEyebrow() }}</span>
        }
        <h1 [id]="headingId">{{ resolvedHeading() }}</h1>
        @if (resolvedDescription()) {
          <p [id]="descriptionId">{{ resolvedDescription() }}</p>
        }
        <ng-content select="[krnPageHeaderMeta]" />
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }
    :host([hidden]) {
      display: none;
    }
    .frame {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--krn-space-4, 1rem);
      align-items: center;
      padding-block: var(--krn-space-8, 2rem);
      border-block-end: 1px solid var(--krn-color-border-subtle, #e0e3e7);
      color: var(--krn-color-text, #252932);
    }
    .frame[data-index] {
      grid-template-columns: 2rem minmax(0, 1fr) auto;
    }
    .index {
      align-self: start;
      padding-block-start: 0.375rem;
      color: var(--krn-color-text-subtle, #737373);
      font:
        500 0.6875rem/1 var(--krn-font-family-mono, ui-monospace),
        monospace;
      letter-spacing: 0.02em;
    }
    .copy {
      display: grid;
      min-inline-size: 0;
      max-inline-size: 52rem;
      gap: 0.375rem;
    }
    .eyebrow {
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.75rem;
      font-weight: 550;
      letter-spacing: 0.01em;
    }
    h1,
    p {
      margin: 0;
    }
    h1 {
      font-family: var(--krn-font-family-sans, sans-serif);
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 600;
      letter-spacing: -0.045em;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }
    p {
      max-inline-size: 65ch;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 1rem;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      min-inline-size: 0;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: end;
    }
    @container (max-width: 42rem) {
      .frame,
      .frame[data-index] {
        grid-template-columns: 1fr;
      }
      .index {
        border-inline-end: 0;
      }
      .actions {
        justify-content: start;
      }
    }
    @media (forced-colors: active) {
      .frame {
        border-color: CanvasText;
      }
    }
  `,
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
