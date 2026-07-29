import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import type { KrnLayoutAxis } from './layout.types';

interface ResizeSession {
  readonly handleIndex: number;
  readonly pointerId: number;
  readonly startCoordinate: number;
  readonly trackSize: number;
  readonly beforeSize: number;
  readonly afterSize: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const nullableNumberAttribute = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : numberAttribute(value);

function normalizeSizes(sizes: readonly number[], panelCount: number): readonly number[] {
  if (panelCount <= 0) {
    return [];
  }

  if (sizes.length !== panelCount || sizes.some((size) => !Number.isFinite(size) || size <= 0)) {
    return Array.from({ length: panelCount }, () => 100 / panelCount);
  }

  const total = sizes.reduce((sum, size) => sum + size, 0);
  return sizes.map((size) => (size / total) * 100);
}

@Component({
  selector: 'krn-resizable-panels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-resizing]': 'resizing() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
  styles: `
    :host {
      display: flex;
      min-inline-size: 0;
      min-block-size: 0;
      isolation: isolate;
    }

    :host([data-orientation='horizontal']) {
      flex-direction: row;
      inline-size: 100%;
    }

    :host([data-orientation='vertical']) {
      flex-direction: column;
      block-size: 100%;
    }

    :host([data-resizing]) {
      cursor: col-resize;
      user-select: none;
    }

    :host([data-orientation='vertical'][data-resizing]) {
      cursor: row-resize;
    }

    :host([data-disabled]) {
      cursor: default;
    }
  `,
})
export class KrnResizablePanels {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly panelChildren = contentChildren<KrnResizablePanel>(
    forwardRef(() => KrnResizablePanel),
  );
  private readonly handleChildren = contentChildren<KrnResizeHandle>(
    forwardRef(() => KrnResizeHandle),
  );
  private session: ResizeSession | null = null;

  readonly orientation = input<KrnLayoutAxis>('horizontal');
  readonly sizes = model<readonly number[]>([]);
  readonly step = input(2, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly resizeEnd = output<readonly number[]>();

  private readonly resizingState = signal(false);
  readonly resizing = this.resizingState.asReadonly();
  private readonly normalizedSizes = computed(() =>
    normalizeSizes(this.requestedSizes(), this.panelChildren().length),
  );

  private readonly requestedSizes = computed<readonly number[]>(() => {
    const controlled = this.sizes();
    if (controlled.length > 0) {
      return controlled;
    }

    const initial = this.panelChildren().map((panel) => panel.size());
    return initial.every((size): size is number => size !== null) ? initial : [];
  });

  constructor() {
    effect(() => {
      const panels = this.panelChildren();
      const sizes = this.normalizedSizes();
      const orientation = this.orientation();

      panels.forEach((panel, index) => {
        panel.setManagedLayout(sizes[index] ?? 0, orientation);
      });

      const handles = this.handleChildren();
      handles.forEach((handle, index) => {
        const position = sizes.slice(0, index + 1).reduce((sum, size) => sum + size, 0);
        handle.setManagedState(orientation, clamp(position, 0, 100), this.disabled());
      });
    });
  }

  startPointerResize(event: PointerEvent, handle: KrnResizeHandle): void {
    if (this.disabled() || (event.button !== 0 && event.pointerType !== 'touch')) {
      return;
    }

    const handleIndex = this.handleChildren().indexOf(handle);
    const sizes = this.normalizedSizes();
    if (handleIndex < 0 || handleIndex >= this.panelChildren().length - 1) {
      return;
    }

    const rect = this.host.nativeElement.getBoundingClientRect();
    const trackSize = this.orientation() === 'horizontal' ? rect.width : rect.height;
    if (trackSize <= 0) {
      return;
    }

    this.session = {
      handleIndex,
      pointerId: event.pointerId,
      startCoordinate: this.coordinate(event),
      trackSize,
      beforeSize: sizes[handleIndex] ?? 0,
      afterSize: sizes[handleIndex + 1] ?? 0,
    };
    this.resizingState.set(true);
    event.preventDefault();
  }

  movePointerResize(event: PointerEvent): void {
    if (!this.session || event.pointerId !== this.session.pointerId) {
      return;
    }

    const direction = this.inlineDirection();
    const delta =
      ((this.coordinate(event) - this.session.startCoordinate) / this.session.trackSize) *
      100 *
      direction;
    this.resizePair(
      this.session.handleIndex,
      this.session.beforeSize + delta,
      this.session.beforeSize + this.session.afterSize,
    );
    event.preventDefault();
  }

  endPointerResize(event: PointerEvent): void {
    if (!this.session || event.pointerId !== this.session.pointerId) {
      return;
    }
    this.finishResize();
  }

  cancelPointerResize(event: PointerEvent): void {
    if (!this.session || event.pointerId !== this.session.pointerId) {
      return;
    }
    this.session = null;
    this.resizingState.set(false);
  }

  resizeByKeyboard(event: KeyboardEvent, handle: KrnResizeHandle): void {
    if (this.disabled()) {
      return;
    }

    const handleIndex = this.handleChildren().indexOf(handle);
    if (handleIndex < 0 || handleIndex >= this.panelChildren().length - 1) {
      return;
    }

    const horizontal = this.orientation() === 'horizontal';
    const decrementKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const incrementKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const sizes = this.normalizedSizes();
    const pairTotal = (sizes[handleIndex] ?? 0) + (sizes[handleIndex + 1] ?? 0);
    let target: number | null = null;

    if (event.key === decrementKey) {
      target =
        (sizes[handleIndex] ?? 0) -
        Math.max(0.25, this.step()) * (horizontal ? this.inlineDirection() : 1);
    } else if (event.key === incrementKey) {
      target =
        (sizes[handleIndex] ?? 0) +
        Math.max(0.25, this.step()) * (horizontal ? this.inlineDirection() : 1);
    } else if (event.key === 'Home') {
      target = this.panelChildren()[handleIndex]?.minSize() ?? 0;
    } else if (event.key === 'End') {
      target = Math.min(
        this.panelChildren()[handleIndex]?.maxSize() ?? 100,
        pairTotal - (this.panelChildren()[handleIndex + 1]?.minSize() ?? 0),
      );
    } else if (event.key === 'Enter' || event.key === ' ') {
      target = pairTotal / 2;
    }

    if (target === null) {
      return;
    }

    this.resizePair(handleIndex, target, pairTotal);
    this.resizeEnd.emit(this.normalizedSizes());
    event.preventDefault();
  }

  resetPair(handle: KrnResizeHandle): void {
    if (this.disabled()) {
      return;
    }
    const index = this.handleChildren().indexOf(handle);
    const sizes = this.normalizedSizes();
    if (index < 0 || index >= sizes.length - 1) {
      return;
    }
    const pairTotal = (sizes[index] ?? 0) + (sizes[index + 1] ?? 0);
    this.resizePair(index, pairTotal / 2, pairTotal);
    this.resizeEnd.emit(this.normalizedSizes());
  }

  private resizePair(handleIndex: number, requestedBefore: number, pairTotal: number): void {
    const panels = this.panelChildren();
    const before = panels[handleIndex];
    const after = panels[handleIndex + 1];
    if (!before || !after) {
      return;
    }

    const lowerBound = Math.max(before.minSize(), pairTotal - after.maxSize());
    const upperBound = Math.min(before.maxSize(), pairTotal - after.minSize());
    const beforeSize = clamp(requestedBefore, lowerBound, upperBound);
    const afterSize = pairTotal - beforeSize;
    const next = [...this.normalizedSizes()];
    next[handleIndex] = beforeSize;
    next[handleIndex + 1] = afterSize;
    this.sizes.set(next);
  }

  private finishResize(): void {
    this.session = null;
    this.resizingState.set(false);
    this.resizeEnd.emit(this.normalizedSizes());
  }

  private coordinate(event: PointerEvent): number {
    return this.orientation() === 'horizontal' ? event.clientX : event.clientY;
  }

  private inlineDirection(): 1 | -1 {
    if (this.orientation() === 'vertical') {
      return 1;
    }
    const elementDirection =
      this.host.nativeElement.closest('[dir]')?.getAttribute('dir') ??
      this.platform.document.documentElement.dir;
    return elementDirection.toLowerCase() === 'rtl' ? -1 : 1;
  }
}

@Component({
  selector: 'krn-resizable-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[id]': 'id()',
    '[style.--krn-panel-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'managedOrientation()',
    '[attr.data-overflow]': 'overflow()',
    '[attr.role]': 'ariaLabel() ? "region" : null',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      min-block-size: 0;
      flex: 0 0 var(--krn-panel-size);
    }

    :host([data-overflow='auto']) {
      overflow: auto;
      overscroll-behavior: contain;
    }
    :host([data-overflow='visible']) {
      overflow: visible;
    }
    :host([data-overflow='clip']) {
      overflow: clip;
    }
  `,
})
export class KrnResizablePanel {
  private readonly managedSize = signal(50);
  protected readonly managedOrientation = signal<KrnLayoutAxis>('horizontal');

  readonly id = input<string | null>(null);
  readonly size = input<number | null, unknown>(null, {
    transform: nullableNumberAttribute,
  });
  readonly minSize = input(10, { transform: numberAttribute });
  readonly maxSize = input(90, { transform: numberAttribute });
  readonly overflow = input<'auto' | 'visible' | 'clip'>('auto');
  readonly ariaLabel = input<string | null>(null);

  protected readonly resolvedSize = computed(() => `${clamp(this.managedSize(), 0, 100)}%`);

  setManagedLayout(size: number, orientation: KrnLayoutAxis): void {
    this.managedSize.set(size);
    this.managedOrientation.set(orientation);
  }
}

@Component({
  selector: 'krn-resize-handle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="krn-resize-handle__line" aria-hidden="true"></span>`,
  host: {
    role: 'separator',
    '[attr.tabindex]': 'managedDisabled() ? -1 : 0',
    '[attr.aria-orientation]': 'managedOrientation()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'managedValue()',
    '[attr.aria-valuetext]': 'ariaValueText() ?? managedValue() + "%"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'managedDisabled() ? "true" : null',
    '[attr.data-orientation]': 'managedOrientation()',
    '[class.krn-resize-handle--disabled]': 'managedDisabled()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerCancel($event)',
    '(lostpointercapture)': 'onPointerCancel($event)',
    '(keydown)': 'onKeydown($event)',
    '(dblclick)': 'onDoubleClick()',
  },
  styles: `
    :host {
      position: relative;
      z-index: 1;
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      color: var(--krn-color-border-strong);
      outline: none;
      touch-action: none;
    }

    :host([data-orientation='horizontal']) {
      inline-size: 1px;
      block-size: 100%;
      cursor: col-resize;
    }

    :host([data-orientation='vertical']) {
      inline-size: 100%;
      block-size: 1px;
      cursor: row-resize;
    }

    :host::before {
      position: absolute;
      content: '';
      background: transparent;
    }

    :host([data-orientation='horizontal'])::before {
      inset-block: 0;
      inline-size: 0.75rem;
    }

    :host([data-orientation='vertical'])::before {
      inset-inline: 0;
      block-size: 0.75rem;
    }

    .krn-resize-handle__line {
      display: block;
      background: var(--krn-color-border);
      transition:
        background-color var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard),
        transform var(--krn-motion-duration-interaction) var(--krn-motion-ease-standard);
    }

    :host([data-orientation='horizontal']) .krn-resize-handle__line {
      inline-size: 1px;
      block-size: 100%;
    }

    :host([data-orientation='vertical']) .krn-resize-handle__line {
      inline-size: 100%;
      block-size: 1px;
    }

    :host(:is(:hover, :focus-visible)) .krn-resize-handle__line {
      background: var(--krn-color-focus);
    }

    :host([data-orientation='horizontal']:focus-visible) .krn-resize-handle__line {
      inline-size: 3px;
    }

    :host([data-orientation='vertical']:focus-visible) .krn-resize-handle__line {
      block-size: 3px;
    }

    :host(:focus-visible) {
      box-shadow: none;
    }

    :host(.krn-resize-handle--disabled) {
      cursor: default;
      opacity: var(--krn-opacity-disabled);
    }

    @media (pointer: coarse) {
      :host([data-orientation='horizontal'])::before {
        inline-size: var(--krn-touch-target-min);
      }

      :host([data-orientation='vertical'])::before {
        block-size: var(--krn-touch-target-min);
      }
    }

    @media (forced-colors: active) {
      .krn-resize-handle__line {
        background: CanvasText;
      }
      :host(:focus-visible) .krn-resize-handle__line {
        background: Highlight;
      }
    }
  `,
})
export class KrnResizeHandle {
  private readonly translations = inject(KRN_TRANSLATIONS);
  private readonly parent = inject(
    forwardRef(() => KrnResizablePanels),
    { optional: true },
  );
  protected readonly managedOrientation = signal<KrnLayoutAxis>('horizontal');
  protected readonly managedValue = signal(50);
  protected readonly managedDisabled = signal(false);

  readonly ariaLabel = input(this.translations.layout.resizeAdjacentPanels);
  readonly ariaValueText = input<string | null>(null);

  setManagedState(orientation: KrnLayoutAxis, value: number, disabled: boolean): void {
    this.managedOrientation.set(orientation);
    this.managedValue.set(Math.round(value * 10) / 10);
    this.managedDisabled.set(disabled);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.parent || this.managedDisabled()) {
      return;
    }
    (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
    this.parent.startPointerResize(event, this);
  }

  protected onPointerMove(event: PointerEvent): void {
    this.parent?.movePointerResize(event);
  }

  protected onPointerUp(event: PointerEvent): void {
    this.parent?.endPointerResize(event);
    const target = event.currentTarget as HTMLElement | null;
    if (target?.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  protected onPointerCancel(event: PointerEvent): void {
    this.parent?.cancelPointerResize(event);
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.parent?.resizeByKeyboard(event, this);
  }

  protected onDoubleClick(): void {
    this.parent?.resetPair(this);
  }
}
