import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
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
      class="stepper"
      [class.vertical]="orientation() === 'vertical'"
      [attr.aria-label]="ariaLabel()"
    >
      @for (step of steps(); track step.id; let index = $index) {
        <li
          [class.active]="index === activeStep()"
          [class.complete]="isComplete(index)"
          [class.invalid]="!!step.error"
        >
          <button
            #stepButton
            type="button"
            [disabled]="!canSelect(index)"
            [attr.aria-current]="index === activeStep() ? 'step' : null"
            [attr.aria-describedby]="
              step.description || step.error ? step.id + '-description' : null
            "
            (click)="select(index)"
            (keydown)="onKeydown($event, index)"
          >
            <span class="marker" aria-hidden="true">{{ isComplete(index) ? '✓' : index + 1 }}</span>
            <span class="copy">
              <span class="label">{{ step.label }}</span>
              @if (step.optional) {
                <span class="optional">{{ optionalLabel() }}</span>
              }
              @if (step.description || step.error) {
                <span class="description" [id]="step.id + '-description'">{{
                  step.error || step.description
                }}</span>
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
    .stepper {
      display: flex;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: step;
    }
    .stepper li {
      position: relative;
      min-inline-size: 0;
      flex: 1;
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
  `,
})
export class KrnStepper {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('stepButton');
  readonly steps = input<readonly KrnStepItem[]>([]);
  readonly activeStep = model(0);
  readonly completedSteps = input<readonly number[]>([]);
  readonly linear = input(false, { transform: booleanAttribute });
  readonly orientation = input<KrnNavigationOrientation>('horizontal');
  readonly ariaLabel = input(this.translations.navigation.progress);
  readonly optionalLabel = input(this.translations.navigation.optional);

  protected isComplete(index: number): boolean {
    return this.completedSteps().includes(index) || index < this.activeStep();
  }

  protected canSelect(index: number): boolean {
    const step = this.steps()[index];
    if (!step || step.disabled) return false;
    if (!this.linear()) return true;
    const furthestComplete = this.completedSteps().reduce(
      (maximum, value) => Math.max(maximum, value),
      -1,
    );
    return index <= Math.max(this.activeStep(), furthestComplete + 1);
  }

  protected select(index: number): void {
    if (!this.canSelect(index)) return;
    this.activeStep.set(index);
  }

  protected onKeydown(event: KeyboardEvent, current: number): void {
    const rightToLeft =
      this.orientation() === 'horizontal' &&
      this.platform.window?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const forward = rightToLeft ? -1 : 1;
    const delta =
      event.key === 'ArrowRight'
        ? forward
        : event.key === 'ArrowLeft'
          ? -forward
          : event.key === 'ArrowDown'
            ? 1
            : event.key === 'ArrowUp'
              ? -1
              : 0;
    if (delta === 0 && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const steps = this.steps();
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : current + delta;
    while (next >= 0 && next < steps.length && !this.canSelect(next)) next += delta || 1;
    if (next >= 0 && next < steps.length) {
      this.select(next);
      this.buttons()[next]?.nativeElement.focus();
    }
  }
}
