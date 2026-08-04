import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnNavigationOrientation, KrnStepItem } from './navigation.types';

@Component({
  selector: 'krn-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol
      #stepList
      class="stepper"
      [class.vertical]="resolvedOrientation() === 'vertical'"
      [attr.aria-label]="resolvedAriaLabel()"
    >
      @for (step of steps(); track $index; let index = $index) {
        <li
          [class.active]="index === currentStep()"
          [class.complete]="isComplete(index)"
          [class.invalid]="!!step.error"
        >
          <button
            #stepButton
            type="button"
            [disabled]="!canSelect(index)"
            [attr.tabindex]="index === currentStep() ? 0 : -1"
            [attr.aria-current]="index === currentStep() ? 'step' : null"
            [attr.aria-invalid]="step.error ? 'true' : null"
            (click)="select(index)"
            (keydown)="onKeydown($event, index)"
          >
            <span class="marker" aria-hidden="true">{{ isComplete(index) ? '✓' : index + 1 }}</span>
            <span class="copy">
              <span class="label">{{ step.label }}</span>
              @if (step.optional) {
                <span class="optional">{{ resolvedOptionalLabel() }}</span>
              }
              @if (step.description || step.error) {
                <span class="description">{{ step.error || step.description }}</span>
              }
            </span>
          </button>
        </li>
      }
    </ol>
    <section class="content" [attr.aria-live]="'polite'">
      <ng-content />
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    :host([hidden]) {
      display: none;
    }
    .stepper {
      display: flex;
      margin: 0;
      padding: 0;
      overflow-x: auto;
      scrollbar-width: none;
      list-style: none;
      counter-reset: step;
      scroll-behavior: smooth;
    }
    .stepper::-webkit-scrollbar {
      display: none;
    }
    .stepper li {
      position: relative;
      min-inline-size: 8rem;
      flex: 1 0 8rem;
    }
    .stepper:not(.vertical) li:not(:last-child)::after {
      position: absolute;
      z-index: 0;
      inset-block-start: calc(var(--krn-control-height-sm) / 2);
      inset-inline-start: calc(50% + var(--krn-control-height-sm) / 2 + var(--krn-space-2));
      inline-size: calc(100% - var(--krn-control-height-sm) - var(--krn-space-4));
      block-size: var(--krn-border-width-1);
      background: var(--krn-color-border);
      content: '';
    }
    .stepper li.complete::after {
      background: var(--krn-color-primary);
    }
    button {
      position: relative;
      z-index: 1;
      display: grid;
      inline-size: 100%;
      justify-items: center;
      gap: var(--krn-space-2);
      padding: 0 var(--krn-space-2);
      border: 0;
      color: var(--krn-color-text-muted);
      background: transparent;
      font: inherit;
      text-align: center;
      cursor: pointer;
    }
    .marker {
      display: grid;
      inline-size: var(--krn-control-height-sm);
      block-size: var(--krn-control-height-sm);
      border: var(--krn-border-width-1) solid var(--krn-color-border-interactive);
      border-radius: var(--krn-radius-full);
      place-items: center;
      background: var(--krn-color-surface);
      font-size: var(--krn-font-size-sm);
      font-variant-numeric: tabular-nums;
    }
    .copy {
      display: grid;
      min-inline-size: 0;
      justify-items: center;
      gap: var(--krn-space-0-5);
    }
    .label {
      color: var(--krn-color-text);
      font-weight: var(--krn-font-weight-semibold);
      text-wrap: balance;
    }
    .optional,
    .description {
      color: var(--krn-color-text-subtle);
      font-size: var(--krn-font-size-xs);
      text-wrap: pretty;
    }
    .active .marker {
      border-color: var(--krn-color-primary);
      box-shadow: inset 0 0 0 var(--krn-border-width-1) var(--krn-color-primary);
    }
    .complete .marker {
      border-color: var(--krn-color-primary);
      color: var(--krn-color-on-primary);
      background: var(--krn-color-primary);
    }
    .invalid .marker {
      border-color: var(--krn-color-danger);
      color: var(--krn-color-danger);
    }
    button:focus-visible {
      border-radius: var(--krn-radius-sm);
      outline: var(--krn-focus-ring-width) solid var(--krn-color-focus);
      outline-offset: var(--krn-focus-ring-offset);
    }
    button:disabled {
      opacity: var(--krn-opacity-disabled);
      cursor: not-allowed;
    }
    .content {
      padding-block-start: var(--krn-space-6);
    }
    .vertical {
      flex-direction: column;
      gap: var(--krn-space-3);
      overflow: auto;
    }
    .vertical li {
      min-inline-size: 0;
      flex-basis: auto;
    }
    .vertical li:not(:last-child)::after {
      position: absolute;
      inset-block-start: calc(var(--krn-control-height-sm) + var(--krn-space-1));
      inset-block-end: calc(var(--krn-space-1) * -1);
      inset-inline-start: calc(var(--krn-control-height-sm) / 2);
      inline-size: var(--krn-border-width-1);
      background: var(--krn-color-border);
      content: '';
    }
    .vertical li.complete::after {
      background: var(--krn-color-primary);
    }
    .vertical button {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      justify-items: start;
      text-align: start;
      padding-inline: 0;
    }
    .vertical .copy {
      justify-items: start;
      padding-block-start: var(--krn-space-1);
    }
    @media (prefers-reduced-motion: reduce) {
      .stepper {
        scroll-behavior: auto;
      }
    }
    @media (forced-colors: active) {
      .active .marker,
      .complete .marker,
      .invalid .marker {
        border-color: Highlight;
      }
      button:focus-visible {
        outline-color: Highlight;
      }
    }
  `,
})
export class KrnStepper {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly stepList = viewChild<ElementRef<HTMLOListElement>>('stepList');
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('stepButton');
  readonly steps = input<readonly KrnStepItem[]>([]);
  readonly activeStep = model(0);
  readonly completedSteps = input<readonly number[]>([]);
  readonly linear = input(false, { transform: booleanAttribute });
  readonly orientation = input<KrnNavigationOrientation>('horizontal');
  readonly ariaLabel = input<string | undefined>();
  readonly optionalLabel = input<string | undefined>();
  protected readonly resolvedOrientation = computed<KrnNavigationOrientation>(() =>
    this.orientation() === 'vertical' ? 'vertical' : 'horizontal',
  );
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.navigation.progress.trim() || null,
  );
  protected readonly resolvedOptionalLabel = computed(
    () => this.optionalLabel()?.trim() || this.translations.navigation.optional.trim(),
  );
  protected readonly currentStep = computed(() => {
    const steps = this.steps();
    if (steps.length === 0) return -1;
    const requested = this.activeStep();
    const normalized = Number.isFinite(requested) ? Math.trunc(requested) : 0;
    const clamped = Math.min(Math.max(0, normalized), steps.length - 1);
    if (!steps[clamped]?.disabled) return clamped;
    const next = steps.findIndex((step, index) => index > clamped && !step.disabled);
    if (next >= 0) return next;
    for (let index = clamped - 1; index >= 0; index -= 1) {
      if (!steps[index]?.disabled) return index;
    }
    return -1;
  });
  private readonly completed = computed<ReadonlySet<number>>(() => {
    const count = this.steps().length;
    return new Set(
      this.completedSteps()
        .filter(Number.isFinite)
        .map(Math.trunc)
        .filter((index) => index >= 0 && index < count),
    );
  });

  constructor() {
    effect(() => {
      const current = Math.max(0, this.currentStep());
      if (!Object.is(current, this.activeStep())) this.activeStep.set(current);
    });

    afterRenderEffect((onCleanup) => {
      this.scrollActiveStepIntoView();
      const list = this.stepList()?.nativeElement;
      const ResizeObserver = this.platform.window?.ResizeObserver;
      if (!list || !ResizeObserver) return;
      const observer = new ResizeObserver(() => this.scrollActiveStepIntoView());
      observer.observe(list);
      onCleanup(() => observer.disconnect());
    });
  }

  protected isComplete(index: number): boolean {
    return this.completed().has(index) || index < this.currentStep();
  }

  protected canSelect(index: number): boolean {
    const step = this.steps()[index];
    if (!step || step.disabled) return false;
    if (!this.linear()) return true;
    const furthestComplete = Math.max(-1, ...this.completed());
    const firstEnabled = this.steps().findIndex((candidate) => !candidate.disabled);
    return index <= Math.max(this.currentStep(), furthestComplete + 1, firstEnabled);
  }

  protected select(index: number): void {
    if (!this.canSelect(index) || index === this.currentStep()) return;
    this.activeStep.set(index);
  }

  protected onKeydown(event: KeyboardEvent, current: number): void {
    const rightToLeft =
      this.resolvedOrientation() === 'horizontal' &&
      this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const forward = rightToLeft ? -1 : 1;
    const delta =
      this.resolvedOrientation() === 'horizontal' && event.key === 'ArrowRight'
        ? forward
        : this.resolvedOrientation() === 'horizontal' && event.key === 'ArrowLeft'
          ? -forward
          : this.resolvedOrientation() === 'vertical' && event.key === 'ArrowDown'
            ? 1
            : this.resolvedOrientation() === 'vertical' && event.key === 'ArrowUp'
              ? -1
              : 0;
    if (delta === 0 && event.key !== 'Home' && event.key !== 'End') return;
    const selectable = this.steps()
      .map((_, index) => index)
      .filter((index) => this.canSelect(index));
    if (selectable.length === 0) return;
    event.preventDefault();
    const currentPosition = selectable.indexOf(current);
    const next =
      event.key === 'Home'
        ? selectable[0]
        : event.key === 'End'
          ? selectable.at(-1)
          : currentPosition < 0
            ? selectable[delta > 0 ? 0 : selectable.length - 1]
            : selectable[(currentPosition + delta + selectable.length) % selectable.length];
    if (next === undefined) return;
    this.select(next);
    this.buttons()[next]?.nativeElement.focus();
  }

  private scrollActiveStepIntoView(): void {
    const list = this.stepList()?.nativeElement;
    const button = this.buttons()[this.currentStep()]?.nativeElement;
    if (!list || !button) return;
    const listRect = list.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const left = buttonRect.left < listRect.left ? buttonRect.left - listRect.left : 0;
    const right = buttonRect.right > listRect.right ? buttonRect.right - listRect.right : 0;
    const top = buttonRect.top < listRect.top ? buttonRect.top - listRect.top : 0;
    const bottom = buttonRect.bottom > listRect.bottom ? buttonRect.bottom - listRect.bottom : 0;
    if (left || right || top || bottom) {
      list.scrollBy({ left: left || right, top: top || bottom });
    }
  }
}
