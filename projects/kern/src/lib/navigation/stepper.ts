import type {
  ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import type { KrnNavigationOrientation, KrnStepItem } from './navigation.types';

@Component({
  selector: 'krn-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="stepper" [class.vertical]="orientation() === 'vertical'" [attr.aria-label]="ariaLabel()">
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
            [attr.aria-describedby]="step.description || step.error ? step.id + '-description' : null"
            (click)="select(index)"
            (keydown)="onKeydown($event, index)"
          >
            <span class="marker" aria-hidden="true">{{ isComplete(index) ? '✓' : index + 1 }}</span>
            <span class="copy">
              <span class="label">{{ step.label }}</span>
              @if (step.optional) {
                <span class="optional">Optional</span>
              }
              @if (step.description || step.error) {
                <span class="description" [id]="step.id + '-description'">{{ step.error || step.description }}</span>
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
    :host{display:block}.stepper{display:flex;margin:0;padding:0;list-style:none;counter-reset:step}.stepper li{position:relative;flex:1;min-inline-size:0}.stepper li:not(:last-child)::after{position:absolute;inset-block-start:calc(var(--krn-control-height-sm) / 2);inset-inline-start:calc(50% + var(--krn-space-4));inline-size:calc(100% - var(--krn-space-8));block-size:var(--krn-border-width-1);background:var(--krn-color-border);content:""}.stepper li.complete::after{background:var(--krn-color-primary)}button{position:relative;z-index:1;display:flex;align-items:flex-start;gap:var(--krn-space-2);inline-size:100%;padding:0 var(--krn-space-2);border:0;background:transparent;color:var(--krn-color-text-muted);font:inherit;text-align:start;cursor:pointer}.marker{display:grid;flex:0 0 var(--krn-control-height-sm);block-size:var(--krn-control-height-sm);border:var(--krn-border-width-1) solid var(--krn-color-border-interactive);border-radius:var(--krn-radius-full);place-items:center;background:var(--krn-color-surface);font-size:var(--krn-font-size-sm);font-variant-numeric:tabular-nums}.copy{display:grid;gap:var(--krn-space-0-5);min-inline-size:0;padding-block-start:var(--krn-space-1)}.label{color:var(--krn-color-text);font-weight:var(--krn-font-weight-semibold)}.optional,.description{color:var(--krn-color-text-subtle);font-size:var(--krn-font-size-xs)}.active .marker{border-color:var(--krn-color-primary);box-shadow:inset 0 0 0 var(--krn-border-width-1) var(--krn-color-primary)}.complete .marker{border-color:var(--krn-color-primary);background:var(--krn-color-primary);color:var(--krn-color-on-primary)}.invalid .marker{border-color:var(--krn-color-danger);color:var(--krn-color-danger)}button:focus-visible{outline:var(--krn-focus-ring-width) solid var(--krn-color-focus);outline-offset:var(--krn-focus-ring-offset);border-radius:var(--krn-radius-sm)}button:disabled{cursor:not-allowed;opacity:var(--krn-opacity-disabled)}.content{padding-block-start:var(--krn-space-6)}.vertical{flex-direction:column;gap:var(--krn-space-3)}.vertical li::after{inset-block-start:calc(var(--krn-control-height-sm) + var(--krn-space-1));inset-block-end:calc(var(--krn-space-1) * -1);inset-inline-start:calc(var(--krn-control-height-sm) / 2);inline-size:var(--krn-border-width-1);block-size:auto}.vertical button{padding-inline:0}
  `,
})
export class KrnStepper {
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('stepButton');
  readonly steps = input<readonly KrnStepItem[]>([]);
  readonly activeStep = model(0);
  readonly completedSteps = input<readonly number[]>([]);
  readonly linear = input(false);
  readonly orientation = input<KrnNavigationOrientation>('horizontal');
  readonly ariaLabel = input('Progress');
  readonly stepChanged = output<number>();

  protected isComplete(index: number): boolean {
    return this.completedSteps().includes(index) || index < this.activeStep();
  }

  protected canSelect(index: number): boolean {
    const step = this.steps()[index];
    if (!step || step.disabled) return false;
    if (!this.linear()) return true;
    const furthestComplete = this.completedSteps().reduce((maximum, value) => Math.max(maximum, value), -1);
    return index <= Math.max(this.activeStep(), furthestComplete + 1);
  }

  protected select(index: number): void {
    if (!this.canSelect(index)) return;
    this.activeStep.set(index);
    this.stepChanged.emit(index);
  }

  protected onKeydown(event: KeyboardEvent, current: number): void {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
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
