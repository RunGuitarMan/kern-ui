import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { KRN_PLATFORM } from '@kern-ui/angular/cdk';
import { KrnAppShell, KrnHeader, KrnSidebar } from './app-shell';
import { KrnCluster, KrnInline, KrnSpacer, KrnStack } from './flex-layout';
import { KrnGrid } from './grid';
import { KrnAspectRatio, KrnDivider, KrnScrollArea, KrnShow } from './media-layout';
import { KrnResizablePanel, KrnResizablePanels, KrnResizeHandle } from './resizable-panels';
import { KrnSplitLayout } from './split-layout';

@Component({
  selector: 'krn-test-resizable-host',
  standalone: true,
  imports: [KrnResizablePanels, KrnResizablePanel, KrnResizeHandle],
  template: `
    <krn-resizable-panels [(sizes)]="sizes" [disabled]="disabled()" [step]="5">
      <krn-resizable-panel ariaLabel="Navigation">A</krn-resizable-panel>
      <krn-resize-handle />
      <krn-resizable-panel ariaLabel="Content">B</krn-resizable-panel>
    </krn-resizable-panels>
  `,
})
class ResizableHost {
  readonly sizes = signal<readonly number[]>([50, 50]);
  readonly disabled = signal(false);
}

@Component({
  selector: 'krn-test-split-layout-host',
  standalone: true,
  imports: [KrnSplitLayout],
  template: `
    <krn-split-layout collapseAt="sm">
      <button krnSplitPrimary type="button">Primary action</button>
      <button krnSplitSecondary type="button">Secondary action</button>
    </krn-split-layout>
  `,
})
class SplitLayoutHost {}

@Component({
  selector: 'krn-test-aspect-ratio-host',
  standalone: true,
  imports: [KrnAspectRatio],
  template: `
    <krn-aspect-ratio [ratio]="ratio()" [fit]="fit()">
      <img alt="" />
      <iframe title="Preview"></iframe>
    </krn-aspect-ratio>
  `,
})
class AspectRatioHost {
  readonly ratio = signal<number | string>('3:2');
  readonly fit = signal<'cover' | 'contain' | 'fill' | 'none'>('contain');
}

function pointerEvent(type: string, clientX: number): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
  });
  Object.defineProperties(event, {
    pointerId: { value: 7 },
    pointerType: { value: 'mouse' },
  });
  return event as PointerEvent;
}

describe('Kern layout primitives', () => {
  it('normalizes spacing and remains shrinkable inside nested layouts', () => {
    const fixture = TestBed.createComponent(KrnStack);
    fixture.componentRef.setInput('gap', 12);
    fixture.componentRef.setInput('align', 'center');
    fixture.componentRef.setInput('justify', 'space-between');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-stack-gap')).toBe('12px');
    expect(host.getAttribute('data-align')).toBe('center');
    expect(host.getAttribute('data-justify')).toBe('space-between');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flexDirection).toBe('column');
    expect(style.getPropertyValue('--krn-stack-align')).toBe('center');
    expect(style.getPropertyValue('--krn-stack-justify')).toBe('space-between');
  });

  it('falls back to the default gap and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnStack);
    fixture.componentRef.setInput('gap', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-stack-gap')).toBe('var(--krn-space-4)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('maps inline wrapping and alignment without escaping nested layouts', () => {
    const fixture = TestBed.createComponent(KrnInline);
    fixture.componentRef.setInput('gap', '2');
    fixture.componentRef.setInput('align', 'baseline');
    fixture.componentRef.setInput('justify', 'end');
    fixture.componentRef.setInput('wrap', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-inline-gap')).toBe('var(--krn-space-2)');
    expect(host.getAttribute('data-align')).toBe('baseline');
    expect(host.getAttribute('data-justify')).toBe('end');
    expect(host.hasAttribute('data-wrap')).toBe(true);
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flexDirection).toBe('row');
    expect(style.flexWrap).toBe('wrap');
    expect(style.getPropertyValue('--krn-inline-align')).toBe('baseline');
    expect(style.getPropertyValue('--krn-inline-justify')).toBe('flex-end');
  });

  it('keeps inline content unwrapped by default and honors native hidden', () => {
    const fixture = TestBed.createComponent(KrnInline);
    fixture.componentRef.setInput('gap', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-inline-gap')).toBe('var(--krn-space-3)');
    expect(host.hasAttribute('data-wrap')).toBe(false);
    expect(style.flexWrap).toBe('nowrap');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('inherits or overrides cluster gaps without escaping nested layouts', () => {
    const fixture = TestBed.createComponent(KrnCluster);
    fixture.componentRef.setInput('gap', '4');
    fixture.componentRef.setInput('rowGap', '');
    fixture.componentRef.setInput('columnGap', 12);
    fixture.componentRef.setInput('align', 'stretch');
    fixture.componentRef.setInput('justify', 'space-evenly');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.style.getPropertyValue('--krn-cluster-row-gap')).toBe('var(--krn-space-4)');
    expect(host.style.getPropertyValue('--krn-cluster-column-gap')).toBe('12px');
    expect(host.getAttribute('data-align')).toBe('stretch');
    expect(host.getAttribute('data-justify')).toBe('space-evenly');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flexWrap).toBe('wrap');
    expect(style.getPropertyValue('--krn-cluster-align')).toBe('stretch');
    expect(style.getPropertyValue('--krn-cluster-justify')).toBe('space-evenly');
  });

  it('falls back both cluster axes and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnCluster);
    fixture.componentRef.setInput('gap', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-cluster-row-gap')).toBe('var(--krn-space-2)');
    expect(host.style.getPropertyValue('--krn-cluster-column-gap')).toBe('var(--krn-space-2)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('reserves horizontal space without a cross-axis artifact', () => {
    const fixture = TestBed.createComponent(KrnSpacer);
    fixture.componentRef.setInput('axis', 'horizontal');
    fixture.componentRef.setInput('size', 24);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('data-axis')).toBe('horizontal');
    expect(host.style.getPropertyValue('--krn-spacer-size')).toBe('24px');
    expect(style.boxSizing).toBe('border-box');
    expect(style.inlineSize).toBe('var(--krn-spacer-size)');
    expect(style.blockSize).toBe('0px');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.flex).toBe('0 0 auto');
    expect(style.pointerEvents).toBe('none');
  });

  it('reserves vertical token space and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnSpacer);
    fixture.componentRef.setInput('size', '');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const style = getComputedStyle(host);

    expect(host.getAttribute('data-axis')).toBe('vertical');
    expect(host.style.getPropertyValue('--krn-spacer-size')).toBe('var(--krn-space-4)');
    expect(style.inlineSize).toBe('0px');
    expect(style.blockSize).toBe('var(--krn-spacer-size)');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('clamps fixed columns and contains grid content at its responsive boundary', () => {
    const fixture = TestBed.createComponent(KrnGrid);
    fixture.componentRef.setInput('columns', 99);
    fixture.componentRef.setInput('minColumnWidth', 240);
    fixture.componentRef.setInput('gap', 12);
    fixture.componentRef.setInput('align', 'center');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const layout = host.querySelector<HTMLElement>('.krn-grid__layout')!;
    const style = getComputedStyle(host);
    const layoutStyle = getComputedStyle(layout);

    expect(host.style.getPropertyValue('--krn-grid-columns')).toBe('12');
    expect(host.style.getPropertyValue('--krn-grid-min')).toBe('240px');
    expect(host.style.getPropertyValue('--krn-grid-gap')).toBe('12px');
    expect(host.getAttribute('data-mode')).toBe('fixed');
    expect(host.getAttribute('data-align')).toBe('center');
    expect(host.getAttribute('data-responsive')).toBe('');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(layoutStyle.display).toBe('grid');
    expect(layoutStyle.maxInlineSize).toBe('100%');
    expect(layoutStyle.minInlineSize).toBe('0px');
    expect(layoutStyle.minBlockSize).toBe('0px');
    expect(layoutStyle.getPropertyValue('--krn-grid-align')).toBe('center');

    const compiledStyles = Array.from(document.head.querySelectorAll('style'))
      .map((element) => element.textContent ?? '')
      .join('\n');
    expect(compiledStyles).toContain('container: krn-grid / inline-size');
    expect(compiledStyles).toContain('@container krn-grid (max-inline-size: 36rem)');
    expect(compiledStyles).toContain('[data-mode="fixed"][data-responsive]');
  });

  it('falls back to fluid columns and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnGrid);
    fixture.componentRef.setInput('columns', 'invalid');
    fixture.componentRef.setInput('minColumnWidth', '');
    fixture.componentRef.setInput('gap', '');
    fixture.componentRef.setInput('responsive', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-grid-columns')).toBe('1');
    expect(host.style.getPropertyValue('--krn-grid-min')).toBe('16rem');
    expect(host.style.getPropertyValue('--krn-grid-gap')).toBe('var(--krn-space-4)');
    expect(host.getAttribute('data-mode')).toBe('fluid');
    expect(host.hasAttribute('data-responsive')).toBe(false);

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('normalizes split ratios and contains both panels at responsive boundaries', () => {
    const fixture = TestBed.createComponent(KrnSplitLayout);
    fixture.componentRef.setInput('ratio', '2fr 1fr');
    fixture.componentRef.setInput('gap', 12);
    fixture.componentRef.setInput('align', 'stretch');
    fixture.componentRef.setInput('collapseAt', 'lg');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const layout = host.querySelector<HTMLElement>('.krn-split')!;
    const panels = Array.from(
      host.querySelectorAll<HTMLElement>('.krn-split__primary, .krn-split__secondary'),
    );
    const style = getComputedStyle(host);
    const layoutStyle = getComputedStyle(layout);

    expect(host.style.getPropertyValue('--krn-split-columns')).toBe(
      'minmax(0, 2fr) minmax(0, 1fr)',
    );
    expect(host.style.getPropertyValue('--krn-split-gap')).toBe('12px');
    expect(host.style.getPropertyValue('--krn-split-align')).toBe('stretch');
    expect(host.getAttribute('data-collapse-at')).toBe('lg');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(layoutStyle.display).toBe('grid');
    expect(layoutStyle.boxSizing).toBe('border-box');
    expect(layoutStyle.maxInlineSize).toBe('100%');
    expect(layoutStyle.minInlineSize).toBe('0px');
    expect(layoutStyle.minBlockSize).toBe('0px');
    for (const panel of panels) {
      const panelStyle = getComputedStyle(panel);
      expect(panelStyle.boxSizing).toBe('border-box');
      expect(panelStyle.maxInlineSize).toBe('100%');
      expect(panelStyle.minInlineSize).toBe('0px');
      expect(panelStyle.minBlockSize).toBe('0px');
    }

    const compiledStyles = Array.from(document.head.querySelectorAll('style'))
      .map((element) => element.textContent ?? '')
      .join('\n');
    expect(compiledStyles).toContain('container: krn-split / inline-size');
    expect(compiledStyles).toContain('@container krn-split (max-inline-size: 36rem)');
    expect(compiledStyles).toContain('@container krn-split (max-inline-size: 48rem)');
    expect(compiledStyles).toContain('@container krn-split (max-inline-size: 64rem)');
  });

  it('falls back to equal split tracks and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnSplitLayout);
    fixture.componentRef.setInput('ratio', 'invalid');
    fixture.componentRef.setInput('gap', '');
    fixture.componentRef.setInput('collapseAt', 'none');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.style.getPropertyValue('--krn-split-columns')).toBe(
      'minmax(0, 1fr) minmax(0, 1fr)',
    );
    expect(host.style.getPropertyValue('--krn-split-gap')).toBe('var(--krn-space-6)');
    expect(host.getAttribute('data-collapse-at')).toBe('none');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('keeps projected reading and focus order aligned when panels collapse', () => {
    const fixture = TestBed.createComponent(SplitLayoutHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const panels = Array.from(
      host.querySelectorAll<HTMLElement>('.krn-split__primary, .krn-split__secondary'),
    );
    const actions = Array.from(host.querySelectorAll<HTMLButtonElement>('button'));

    expect(panels[0].classList.contains('krn-split__primary')).toBe(true);
    expect(panels[1].classList.contains('krn-split__secondary')).toBe(true);
    expect(actions.map((action) => action.textContent?.trim())).toEqual([
      'Primary action',
      'Secondary action',
    ]);
    expect(actions.every((action) => action.tabIndex === 0)).toBe(true);
    expect(
      Boolean(actions[0].compareDocumentPosition(actions[1]) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
  });

  it('names and contains a labelled vertical divider', () => {
    const fixture = TestBed.createComponent(KrnDivider);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('inset', 12);
    fixture.componentRef.setInput('label', '  Section boundary  ');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const separator = host.querySelector<HTMLElement>('[role="separator"]')!;
    const label = host.querySelector<HTMLElement>('.krn-divider__label')!;
    const line = host.querySelector<HTMLElement>('.krn-divider__line')!;
    const style = getComputedStyle(host);
    const separatorStyle = getComputedStyle(separator);
    const lineStyle = getComputedStyle(line);

    expect(host.style.getPropertyValue('--krn-divider-inset')).toBe('12px');
    expect(host.getAttribute('data-orientation')).toBe('vertical');
    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    expect(separator.getAttribute('aria-label')).toBe('Section boundary');
    expect(label.textContent).toBe('Section boundary');
    expect(label.getAttribute('aria-hidden')).toBe('true');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.writingMode).toBe('horizontal-tb');
    expect(separatorStyle.boxSizing).toBe('border-box');
    expect(separatorStyle.maxInlineSize).toBe('100%');
    expect(separatorStyle.minInlineSize).toBe('0px');
    expect(separatorStyle.minBlockSize).toBe('var(--krn-space-4)');
    expect(lineStyle.inlineSize).toBe('1px');
    expect(lineStyle.minInlineSize).toBe('0px');
    expect(lineStyle.minBlockSize).toBe('0px');
  });

  it('falls back to an unlabelled horizontal divider and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnDivider);
    fixture.componentRef.setInput('orientation', 'diagonal');
    fixture.componentRef.setInput('inset', '');
    fixture.componentRef.setInput('label', '   ');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const separator = host.querySelector<HTMLElement>('[role="separator"]')!;

    expect(host.style.getPropertyValue('--krn-divider-inset')).toBe('0');
    expect(host.getAttribute('data-orientation')).toBe('horizontal');
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal');
    expect(separator.hasAttribute('aria-label')).toBe(false);
    expect(host.querySelector('.krn-divider__label')).toBeNull();

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('normalizes aspect ratio media sizing without escaping its container', () => {
    const fixture = TestBed.createComponent(AspectRatioHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('krn-aspect-ratio') as HTMLElement;
    const content = host.querySelector<HTMLElement>('.krn-aspect-ratio__content')!;
    const image = host.querySelector<HTMLImageElement>('img')!;
    const frame = host.querySelector<HTMLIFrameElement>('iframe')!;
    const style = getComputedStyle(host);
    const contentStyle = getComputedStyle(content);
    const imageStyle = getComputedStyle(image);
    const frameStyle = getComputedStyle(frame);

    expect(host.style.getPropertyValue('--krn-aspect-ratio')).toBe('3 / 2');
    expect(host.getAttribute('data-fit')).toBe('contain');
    expect(style.boxSizing).toBe('border-box');
    expect(style.maxInlineSize).toBe('100%');
    expect(style.minInlineSize).toBe('0px');
    expect(style.minBlockSize).toBe('0px');
    expect(style.aspectRatio).toBe('var(--krn-aspect-ratio)');
    expect(contentStyle.boxSizing).toBe('border-box');
    expect(contentStyle.maxInlineSize).toBe('100%');
    expect(contentStyle.maxBlockSize).toBe('100%');
    expect(contentStyle.minInlineSize).toBe('0px');
    expect(contentStyle.minBlockSize).toBe('0px');
    expect(imageStyle.display).toBe('block');
    expect(imageStyle.inlineSize).toBe('100%');
    expect(imageStyle.blockSize).toBe('100%');
    expect(imageStyle.maxInlineSize).toBe('100%');
    expect(imageStyle.maxBlockSize).toBe('100%');
    expect(imageStyle.objectFit).toBe('var(--krn-aspect-fit)');
    expect(frameStyle.borderTopWidth).toBe('0px');
  });

  it('rejects degenerate ratios and invalid fit values while preserving native hidden semantics', () => {
    const fixture = TestBed.createComponent(AspectRatioHost);
    fixture.componentInstance.ratio.set('16 / 0');
    fixture.componentInstance.fit.set('crop' as 'cover');
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('krn-aspect-ratio') as HTMLElement;

    expect(host.style.getPropertyValue('--krn-aspect-ratio')).toBe('16 / 9');
    expect(host.getAttribute('data-fit')).toBe('cover');

    fixture.componentInstance.ratio.set(Number.POSITIVE_INFINITY);
    fixture.detectChanges();
    expect(host.style.getPropertyValue('--krn-aspect-ratio')).toBe('16 / 9');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('configures a named keyboard-scrollable area with axis-specific containment', () => {
    const fixture = TestBed.createComponent(KrnScrollArea);
    fixture.componentRef.setInput('axis', 'both');
    fixture.componentRef.setInput('scrollbar', 'stable');
    fixture.componentRef.setInput('maxBlockSize', 320);
    fixture.componentRef.setInput('maxInlineSize', '40rem');
    fixture.componentRef.setInput('ariaLabel', '  Search results  ');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const viewport = host.querySelector<HTMLElement>('.krn-scroll-area__viewport')!;
    const hostStyle = getComputedStyle(host);
    const viewportStyle = getComputedStyle(viewport);

    expect(host.getAttribute('data-axis')).toBe('both');
    expect(host.getAttribute('data-scrollbar')).toBe('stable');
    expect(host.style.getPropertyValue('--krn-scroll-max-block')).toBe('320px');
    expect(host.style.getPropertyValue('--krn-scroll-max-inline')).toBe('40rem');
    expect(hostStyle.boxSizing).toBe('border-box');
    expect(hostStyle.minInlineSize).toBe('0px');
    expect(viewport.tabIndex).toBe(0);
    expect(viewport.getAttribute('role')).toBe('region');
    expect(viewport.getAttribute('aria-label')).toBe('Search results');
    expect(viewportStyle.inlineSize).toBe('100%');
    expect(viewportStyle.overflow).toBe('auto');
    expect(viewportStyle.overscrollBehavior).toBe('contain');
    expect(viewportStyle.scrollbarGutter).toBe('stable both-edges');
  });

  it('falls back to safe scroll settings and omits a blank region name', () => {
    const fixture = TestBed.createComponent(KrnScrollArea);
    fixture.componentRef.setInput('axis', 'diagonal');
    fixture.componentRef.setInput('scrollbar', 'overlay');
    fixture.componentRef.setInput('maxBlockSize', '');
    fixture.componentRef.setInput('maxInlineSize', '');
    fixture.componentRef.setInput('keyboardAccessible', false);
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const viewport = host.querySelector<HTMLElement>('.krn-scroll-area__viewport')!;

    expect(host.getAttribute('data-axis')).toBe('vertical');
    expect(host.getAttribute('data-scrollbar')).toBe('auto');
    expect(host.style.getPropertyValue('--krn-scroll-max-block')).toBe('100%');
    expect(host.style.getPropertyValue('--krn-scroll-max-inline')).toBe('100%');
    expect(viewport.hasAttribute('tabindex')).toBe(false);
    expect(viewport.hasAttribute('role')).toBe(false);
    expect(viewport.hasAttribute('aria-label')).toBe(false);
    expect(getComputedStyle(viewport).overflowY).toBe('auto');
    expect(getComputedStyle(viewport).overscrollBehaviorY).toBe('contain');

    fixture.componentRef.setInput('axis', 'horizontal');
    fixture.detectChanges();
    expect(getComputedStyle(viewport).overflowX).toBe('auto');
    expect(getComputedStyle(viewport).overscrollBehaviorX).toBe('contain');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('exposes a normalized responsive show range and visible display mode', () => {
    const fixture = TestBed.createComponent(KrnShow);
    fixture.componentRef.setInput('from', 'md');
    fixture.componentRef.setInput('until', 'xl');
    fixture.componentRef.setInput('display', 'flex');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('data-from')).toBe('md');
    expect(host.getAttribute('data-until')).toBe('xl');
    expect(host.style.getPropertyValue('--krn-responsive-display')).toBe('flex');
  });

  it('falls back from invalid show inputs and preserves native hidden semantics', () => {
    const fixture = TestBed.createComponent(KrnShow);
    fixture.componentRef.setInput('from', 'tablet');
    fixture.componentRef.setInput('until', 'desktop');
    fixture.componentRef.setInput('display', 'table');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('data-from')).toBe('none');
    expect(host.getAttribute('data-until')).toBe('none');
    expect(host.style.getPropertyValue('--krn-responsive-display')).toBe('block');

    host.hidden = true;
    expect(getComputedStyle(host).display).toBe('none');
  });

  it('provides a controlled modal navigation drawer at the mobile breakpoint', async () => {
    const defaultPlatform = TestBed.inject(KRN_PLATFORM);
    TestBed.resetTestingModule();
    const mediaQuery = {
      matches: true,
      media: '(max-width: 48rem)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    } as MediaQueryList;

    @Component({
      imports: [KrnAppShell, KrnHeader, KrnSidebar],
      template: `
        <krn-app-shell>
          <krn-header>Workspace</krn-header>
          <krn-sidebar><button type="button">Projects</button></krn-sidebar>
          <p>Workspace content</p>
        </krn-app-shell>
      `,
    })
    class MobileShellHost {}

    await TestBed.configureTestingModule({
      imports: [MobileShellHost],
      providers: [
        { provide: KRN_PLATFORM, useValue: { ...defaultPlatform, matchMedia: () => mediaQuery } },
        {
          provide: InteractivityChecker,
          useValue: {
            isFocusable: (element: HTMLElement) =>
              !element.hasAttribute('disabled') && element.tabIndex >= 0,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MobileShellHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.krn-shell__mobile-trigger',
    ) as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const shell = fixture.debugElement.query(By.directive(KrnAppShell))
      .componentInstance as KrnAppShell;
    const dialog = fixture.nativeElement.querySelector('.krn-shell__navigation') as HTMLElement;
    const close = fixture.nativeElement.querySelector(
      '.krn-shell__mobile-close',
    ) as HTMLButtonElement;
    expect(shell.mobileNavigation()).toBe('auto');
    expect(shell.mobileNavigationOpen()).toBe(true);
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(close);

    const alreadyHandled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    alreadyHandled.preventDefault();
    document.dispatchEvent(alreadyHandled);
    fixture.detectChanges();
    expect(shell.mobileNavigationOpen()).toBe(true);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escape);
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(escape.defaultPrevented).toBe(true);
    expect(shell.mobileNavigationOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    fixture.destroy();
    fixture.nativeElement.remove();
  });
});

describe('KrnResizablePanels', () => {
  let fixture: ComponentFixture<ResizableHost>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();
    TestBed.tick();
  });

  it('exposes an operable separator and resizes with the keyboard', () => {
    const handle = fixture.nativeElement.querySelector('krn-resize-handle') as HTMLElement;

    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');

    handle.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.sizes()).toEqual([55, 45]);
    expect(handle.getAttribute('aria-valuenow')).toBe('55');
  });

  it('respects adjacent panel minimum sizes', () => {
    const handle = fixture.nativeElement.querySelector('krn-resize-handle') as HTMLElement;

    for (let index = 0; index < 20; index += 1) {
      handle.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          bubbles: true,
          cancelable: true,
        }),
      );
    }
    fixture.detectChanges();

    expect(fixture.componentInstance.sizes()[0]).toBe(10);
    expect(fixture.componentInstance.sizes()[1]).toBe(90);
  });

  it('removes a disabled resize handle from the tab sequence', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector('krn-resize-handle') as HTMLElement;
    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.getAttribute('tabindex')).toBe('-1');
  });

  it('tracks pointer movement as a percentage of the panel group', () => {
    const groupDebug = fixture.debugElement.query(By.directive(KrnResizablePanels));
    const handleDebug = fixture.debugElement.query(By.directive(KrnResizeHandle));
    const group = groupDebug.componentInstance as KrnResizablePanels;
    const handle = handleDebug.componentInstance as KrnResizeHandle;
    vi.spyOn(groupDebug.nativeElement as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 500,
      top: 0,
      width: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    group.startPointerResize(pointerEvent('pointerdown', 250), handle);
    group.movePointerResize(pointerEvent('pointermove', 300));
    group.endPointerResize(pointerEvent('pointerup', 300));
    fixture.detectChanges();

    expect(fixture.componentInstance.sizes()).toEqual([60, 40]);
    expect(group.resizing()).toBe(false);
  });
});
