import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KERN_COVERAGE } from '@kern-ui/showcase';
import { KrnAlert, KrnBadge, KrnCodeBlock } from '@kern-ui/angular/kit';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

@Component({
  selector: 'kdocs-accessibility-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnAlert, KrnBadge, KrnCodeBlock, KrnPageHeader, RouterLink],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.css',
})
export class AccessibilityPage {
  protected readonly coverage = KERN_COVERAGE;
  protected readonly pillars = [
    {
      index: '01',
      title: 'Semantic foundation',
      copy: 'Use the platform first, then add ARIA only where native HTML cannot express the interaction.',
      items: ['Native controls', 'Stable accessible names', 'Live regions for async feedback'],
    },
    {
      index: '02',
      title: 'Keyboard continuity',
      copy: 'Tab order follows visual order; composite widgets use roving focus and documented arrow-key behavior.',
      items: ['Focus-visible', 'Escape and restore', 'No hover-only operation'],
    },
    {
      index: '03',
      title: 'Perceivable state',
      copy: 'Color is never the only signal. Text, iconography, borders, and announcements reinforce change.',
      items: ['AA contrast targets', 'Status icon + label', 'Forced-color system roles'],
    },
    {
      index: '04',
      title: 'Resilient content',
      copy: 'Long translations, narrow containers, 200% text zoom, RTL, and reduced motion are normal inputs.',
      items: ['Logical properties', 'Container queries', 'No hidden overflow fixes'],
    },
  ] as const;
  protected readonly matrix = [
    {
      dimension: 'Keyboard',
      automation: 'Unit contracts + representative Playwright sequences',
      human: 'Order and discoverability',
    },
    { dimension: 'Accessible name', automation: 'axe + role queries', human: 'Clarity in context' },
    { dimension: 'Focus', automation: 'Focus assertions', human: 'Visibility and restoration' },
    {
      dimension: 'Contrast',
      automation: 'axe + theme/token assertions',
      human: 'All product themes',
    },
    {
      dimension: 'Zoom / reflow',
      automation: '200% viewport suite',
      human: 'Reading order and clipping',
    },
    {
      dimension: 'Motion',
      automation: 'Representative reduced-motion emulation',
      human: 'Causality and comfort',
    },
    {
      dimension: 'RTL',
      automation: 'Representative direction matrix',
      human: 'Meaningful icon mirroring',
    },
    {
      dimension: 'Forced colors',
      automation: 'CSS rules + high-contrast scenarios',
      human: 'Windows HC pass',
    },
  ] as const;
  protected readonly keyboardContracts = [
    {
      name: 'Tabs',
      bindings: [
        { keys: '← / →', action: 'Move through horizontal tabs' },
        { keys: 'Home / End', action: 'Jump to first or last enabled tab' },
      ],
    },
    {
      name: 'Combobox',
      bindings: [
        { keys: '↓ / ↑', action: 'Move active option' },
        { keys: 'Enter', action: 'Commit selection' },
        { keys: 'Escape', action: 'Close without stealing focus' },
      ],
    },
    {
      name: 'Data grid',
      bindings: [
        { keys: 'Arrow keys', action: 'Move the active cell' },
        { keys: 'Home / End', action: 'Move to row boundary' },
      ],
    },
    {
      name: 'Dialog',
      bindings: [
        { keys: 'Tab', action: 'Stay inside the modal focus trap' },
        { keys: 'Escape', action: 'Close and restore trigger focus' },
      ],
    },
  ] as const;
}
