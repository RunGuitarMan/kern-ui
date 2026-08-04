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
  readonly axis: 'x' | 'y';
  readonly direction: 1 | -1;
  readonly handleIndex: number;
  readonly orientation: KrnLayoutAxis;
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
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-resize-axis]': 'physicalAxis()',
    '[attr.data-resizing]': 'resizing() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(focusin)': 'refreshAxisMetadata()',
  },
  styles: `
    :host {
      display: flex;
      box-sizing: border-box;
      max-inline-size: 100%;
      min-inline-size: 0;
      min-block-size: 0;
      isolation: isolate;
    }

    :host([hidden]) {
      display: none;
    }

    :host([data-orientation='horizontal']) {
      flex-direction: row;
      inline-size: 100%;
    }

    :host([data-orientation='vertical']) {
      flex-direction: column;
      block-size: 100%;
    }

    :host([data-resize-axis='x'][data-resizing]) {
      cursor: col-resize;
      user-select: none;
    }

    :host([data-resize-axis='y'][data-resizing]) {
      cursor: row-resize;
      user-select: none;
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

  /** Sets the panel flow axis: horizontal follows inline, vertical follows block. */
  readonly orientation = input<KrnLayoutAxis>('horizontal');
  readonly sizes = model<readonly number[]>([]);

  /** Sets the keyboard resize increment in percentage points, with a 0.25 minimum. */
  readonly step = input(2, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly resizeEnd = output<readonly number[]>();

  private readonly resizingState = signal(false);
  readonly resizing = this.resizingState.asReadonly();
  protected readonly physicalAxis = signal<'x' | 'y'>('x');
  protected readonly resolvedOrientation = computed<KrnLayoutAxis>(() =>
    this.orientation() === 'vertical' ? 'vertical' : 'horizontal',
  );
  private readonly resolvedStep = computed(() => {
    const step = this.step();
    return Number.isFinite(step) ? Math.max(0.25, step) : 2;
  });
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
      this.refreshAxisMetadata(this.resolvedOrientation());
    });

    effect(() => {
      const panels = this.panelChildren();
      const sizes = this.normalizedSizes();
      const orientation = this.resolvedOrientation();
      const disabled = this.disabled();

      if (this.session && (disabled || this.session.orientation !== orientation)) {
        this.cancelActiveResize();
      }

      panels.forEach((panel, index) => {
        panel.setManagedLayout(sizes[index] ?? 0, orientation);
      });

      const handles = this.handleChildren();
      const separatorOrientation = this.physicalAxis() === 'x' ? 'vertical' : 'horizontal';
      handles.forEach((handle, index) => {
        const position = sizes.slice(0, index + 1).reduce((sum, size) => sum + size, 0);
        const before = panels[index];
        const after = panels[index + 1];
        const prefix = sizes.slice(0, index).reduce((sum, size) => sum + size, 0);
        const pairTotal = (sizes[index] ?? 0) + (sizes[index + 1] ?? 0);
        const bounds = this.pairBounds(index, pairTotal, sizes[index] ?? 0);
        handle.setManagedState(
          orientation,
          separatorOrientation,
          clamp(position, 0, 100),
          clamp(prefix + bounds.min, 0, 100),
          clamp(prefix + bounds.max, 0, 100),
          disabled || !before || !after,
        );
      });
    });
  }

  startPointerResize(event: PointerEvent, handle: KrnResizeHandle): boolean {
    if (
      this.session ||
      this.disabled() ||
      !event.isPrimary ||
      (event.button !== 0 && event.pointerType !== 'touch')
    ) {
      return false;
    }

    const handleIndex = this.handleChildren().indexOf(handle);
    const sizes = this.normalizedSizes();
    if (handleIndex < 0 || handleIndex >= this.panelChildren().length - 1) {
      return false;
    }

    const orientation = this.resolvedOrientation();
    const { axis, direction } = this.axisMetrics(orientation);
    this.physicalAxis.set(axis);
    const rect = this.host.nativeElement.getBoundingClientRect();
    const trackSize = axis === 'x' ? rect.width : rect.height;
    if (trackSize <= 0) {
      return false;
    }

    this.session = {
      axis,
      direction,
      handleIndex,
      orientation,
      pointerId: event.pointerId,
      startCoordinate: this.coordinate(event, axis),
      trackSize,
      beforeSize: sizes[handleIndex] ?? 0,
      afterSize: sizes[handleIndex + 1] ?? 0,
    };
    this.resizingState.set(true);
    event.preventDefault();
    return true;
  }

  movePointerResize(event: PointerEvent): void {
    if (!this.session || event.pointerId !== this.session.pointerId) {
      return;
    }

    if (this.disabled() || this.session.orientation !== this.resolvedOrientation()) {
      this.cancelActiveResize();
      return;
    }

    const delta =
      ((this.coordinate(event, this.session.axis) - this.session.startCoordinate) /
        this.session.trackSize) *
      100 *
      this.session.direction;
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
    this.cancelActiveResize();
  }

  resizeByKeyboard(event: KeyboardEvent, handle: KrnResizeHandle): void {
    if (this.disabled()) {
      return;
    }

    const handleIndex = this.handleChildren().indexOf(handle);
    if (handleIndex < 0 || handleIndex >= this.panelChildren().length - 1) {
      return;
    }

    const { axis, direction } = this.axisMetrics(this.resolvedOrientation());
    this.physicalAxis.set(axis);
    const decrementKey = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const incrementKey = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
    const sizes = this.normalizedSizes();
    const pairTotal = (sizes[handleIndex] ?? 0) + (sizes[handleIndex + 1] ?? 0);
    const bounds = this.pairBounds(handleIndex, pairTotal, sizes[handleIndex] ?? 0);
    let target: number | null = null;

    if (event.key === decrementKey) {
      target = (sizes[handleIndex] ?? 0) - this.resolvedStep() * direction;
    } else if (event.key === incrementKey) {
      target = (sizes[handleIndex] ?? 0) + this.resolvedStep() * direction;
    } else if (event.key === 'Home') {
      target = bounds.min;
    } else if (event.key === 'End') {
      target = bounds.max;
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

    const bounds = this.pairBounds(
      handleIndex,
      pairTotal,
      this.normalizedSizes()[handleIndex] ?? pairTotal / 2,
    );
    const beforeSize = clamp(requestedBefore, bounds.min, bounds.max);
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

  private pairBounds(
    handleIndex: number,
    pairTotal: number,
    currentBefore: number,
  ): { readonly max: number; readonly min: number } {
    const before = this.panelChildren()[handleIndex];
    const after = this.panelChildren()[handleIndex + 1];
    if (!before || !after) {
      return { min: 0, max: pairTotal };
    }

    const min = Math.max(before.effectiveMinSize(), pairTotal - after.effectiveMaxSize());
    const max = Math.min(before.effectiveMaxSize(), pairTotal - after.effectiveMinSize());
    if (min > max) {
      const fixed = clamp(currentBefore, 0, pairTotal);
      return { min: fixed, max: fixed };
    }
    return {
      min: Math.min(min, currentBefore),
      max: Math.max(max, currentBefore),
    };
  }

  private cancelActiveResize(): void {
    const session = this.session;
    if (!session) {
      return;
    }

    this.session = null;
    this.resizingState.set(false);
    const restored = [...this.normalizedSizes()];
    restored[session.handleIndex] = session.beforeSize;
    restored[session.handleIndex + 1] = session.afterSize;
    this.sizes.set(restored);
  }

  private coordinate(event: PointerEvent, axis: 'x' | 'y'): number {
    return axis === 'x' ? event.clientX : event.clientY;
  }

  private axisMetrics(orientation: KrnLayoutAxis): {
    readonly axis: 'x' | 'y';
    readonly direction: 1 | -1;
  } {
    const element = this.host.nativeElement;
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    const writingMode = style?.writingMode || 'horizontal-tb';
    const verticalWriting =
      writingMode.startsWith('vertical') || writingMode.startsWith('sideways');

    if (orientation === 'horizontal') {
      const elementDirection =
        style?.direction ||
        element.closest('[dir]')?.getAttribute('dir') ||
        this.platform.document.documentElement.dir;
      return {
        axis: verticalWriting ? 'y' : 'x',
        direction: elementDirection.toLowerCase() === 'rtl' ? -1 : 1,
      };
    }

    return {
      axis: verticalWriting ? 'x' : 'y',
      direction: verticalWriting && writingMode.endsWith('-rl') ? -1 : 1,
    };
  }

  protected refreshAxisMetadata(orientation = this.resolvedOrientation()): void {
    this.physicalAxis.set(this.axisMetrics(orientation).axis);
  }
}

@Component({
  selector: 'krn-resizable-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[attr.id]': 'resolvedId()',
    '[style.--krn-panel-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'managedOrientation()',
    '[attr.data-overflow]': 'resolvedOverflow()',
    '[attr.role]': 'resolvedAriaLabel() ? "region" : null',
    '[attr.aria-label]': 'resolvedAriaLabel()',
  },
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      max-inline-size: 100%;
      min-inline-size: 0;
      min-block-size: 0;
      flex: 0 0 var(--krn-panel-size);
    }

    :host([hidden]) {
      display: none;
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

  /** Sets the initial percentage weight when every sibling panel provides a size. */
  readonly size = input<number | null, unknown>(null, {
    transform: nullableNumberAttribute,
  });

  /** Sets the minimum percentage size used while resizing. */
  readonly minSize = input(10, { transform: numberAttribute });

  /** Sets the maximum percentage size used while resizing. */
  readonly maxSize = input(90, { transform: numberAttribute });
  readonly overflow = input<'auto' | 'visible' | 'clip'>('auto');
  readonly ariaLabel = input<string | null>(null);

  private readonly resolvedBounds = computed(() => {
    const rawMin = this.minSize();
    const rawMax = this.maxSize();
    const min = Number.isFinite(rawMin) ? clamp(rawMin, 0, 100) : 10;
    const max = Number.isFinite(rawMax) ? clamp(rawMax, 0, 100) : 90;
    return min <= max ? { min, max } : { min: 10, max: 90 };
  });
  protected readonly resolvedId = computed(() => this.id()?.trim() || null);
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel()?.trim() || null);
  protected readonly resolvedOverflow = computed<'auto' | 'visible' | 'clip'>(() => {
    const overflow = this.overflow();
    return overflow === 'visible' || overflow === 'clip' ? overflow : 'auto';
  });
  protected readonly resolvedSize = computed(() => `${clamp(this.managedSize(), 0, 100)}%`);

  readonly effectiveMinSize = computed(() => this.resolvedBounds().min);
  readonly effectiveMaxSize = computed(() => this.resolvedBounds().max);

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
    '[attr.aria-orientation]': 'managedAriaOrientation()',
    '[attr.aria-valuemin]': 'managedMin()',
    '[attr.aria-valuemax]': 'managedMax()',
    '[attr.aria-valuenow]': 'managedValue()',
    '[attr.aria-valuetext]': 'resolvedAriaValueText()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-disabled]': 'managedDisabled() ? "true" : null',
    '[attr.data-orientation]': 'managedOrientation()',
    '[attr.data-resize-axis]': 'managedPhysicalAxis()',
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
      box-sizing: border-box;
      flex: 0 0 auto;
      place-items: center;
      color: var(--krn-color-border-strong);
      outline: none;
      touch-action: none;
    }

    :host([hidden]) {
      display: none;
    }

    :host([data-orientation='horizontal']) {
      inline-size: 1px;
      block-size: 100%;
    }

    :host([data-orientation='vertical']) {
      inline-size: 100%;
      block-size: 1px;
    }

    :host([data-resize-axis='x']) {
      cursor: col-resize;
    }

    :host([data-resize-axis='y']) {
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
      touch-action: auto;
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
  protected readonly managedAriaOrientation = signal<'horizontal' | 'vertical'>('vertical');
  protected readonly managedPhysicalAxis = signal<'x' | 'y'>('x');
  protected readonly managedMin = signal(0);
  protected readonly managedMax = signal(100);
  protected readonly managedValue = signal(50);
  protected readonly managedDisabled = signal(!this.parent);

  readonly ariaLabel = input<string | undefined>();
  readonly ariaValueText = input<string | null>(null);
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || this.translations.layout.resizeAdjacentPanels.trim() || null,
  );
  protected readonly resolvedAriaValueText = computed(
    () => this.ariaValueText()?.trim() || `${this.managedValue()}%`,
  );

  setManagedState(
    orientation: KrnLayoutAxis,
    ariaOrientation: 'horizontal' | 'vertical',
    value: number,
    min: number,
    max: number,
    disabled: boolean,
  ): void {
    this.managedOrientation.set(orientation);
    this.managedAriaOrientation.set(ariaOrientation);
    this.managedPhysicalAxis.set(ariaOrientation === 'vertical' ? 'x' : 'y');
    this.managedMin.set(Math.round(min * 10) / 10);
    this.managedMax.set(Math.round(max * 10) / 10);
    this.managedValue.set(Math.round(value * 10) / 10);
    this.managedDisabled.set(disabled);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.parent || this.managedDisabled()) {
      return;
    }
    if (!this.parent.startPointerResize(event, this)) {
      return;
    }
    const target = event.currentTarget as HTMLElement | null;
    try {
      target?.setPointerCapture(event.pointerId);
    } catch {
      this.parent.cancelPointerResize(event);
    }
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
