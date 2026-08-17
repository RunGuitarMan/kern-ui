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
  templateUrl: './stepper.html',
  styleUrl: './stepper.css',
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
