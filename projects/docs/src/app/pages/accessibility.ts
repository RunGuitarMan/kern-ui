import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KERN_COVERAGE } from '@kern-ui/showcase';
import { KrnAlert, KrnBadge, KrnCodeBlock } from '@kern-ui/angular/kit';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

import { DocsI18n } from '../docs-i18n';

@Component({
  selector: 'kdocs-accessibility-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnAlert, KrnBadge, KrnCodeBlock, KrnPageHeader, RouterLink],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.css',
})
export class AccessibilityPage {
  protected readonly i18n = inject(DocsI18n);
  protected readonly coverage = KERN_COVERAGE;
  protected readonly pillars = computed(
    () =>
      [
        {
          index: '01',
          title: this.i18n.t('accessibility.semanticFoundation', 'Semantic foundation'),
          copy: this.i18n.t(
            'accessibility.semanticCopy',
            'Use the platform first, then add ARIA only where native HTML cannot express the interaction.',
          ),
          items: [
            this.i18n.t('accessibility.nativeControls', 'Native controls'),
            this.i18n.t('accessibility.stableNames', 'Stable accessible names'),
            this.i18n.t('accessibility.liveRegions', 'Live regions for async feedback'),
          ],
        },
        {
          index: '02',
          title: this.i18n.t('accessibility.keyboardContinuity', 'Keyboard continuity'),
          copy: this.i18n.t(
            'accessibility.keyboardCopy',
            'Tab order follows visual order; composite widgets use roving focus and documented arrow-key behavior.',
          ),
          items: [
            'Focus-visible',
            this.i18n.t('accessibility.escapeRestore', 'Escape and restore'),
            this.i18n.t('accessibility.noHoverOnly', 'No hover-only operation'),
          ],
        },
        {
          index: '03',
          title: this.i18n.t('accessibility.perceivableState', 'Perceivable state'),
          copy: this.i18n.t(
            'accessibility.perceivableCopy',
            'Color is never the only signal. Text, iconography, borders, and announcements reinforce change.',
          ),
          items: [
            this.i18n.t('accessibility.aaTargets', 'AA contrast targets'),
            this.i18n.t('accessibility.statusIcon', 'Status icon + label'),
            this.i18n.t('accessibility.forcedRoles', 'Forced-color system roles'),
          ],
        },
        {
          index: '04',
          title: this.i18n.t('accessibility.resilientContent', 'Resilient content'),
          copy: this.i18n.t(
            'accessibility.resilientCopy',
            'Long translations, narrow containers, 200% text zoom, RTL, and reduced motion are normal inputs.',
          ),
          items: [
            this.i18n.t('accessibility.logicalProperties', 'Logical properties'),
            'Container queries',
            this.i18n.t('accessibility.noOverflowFixes', 'No hidden overflow fixes'),
          ],
        },
      ] as const,
  );
  protected readonly matrix = computed(
    () =>
      [
        {
          dimension: this.i18n.t('accessibility.dimensionKeyboard', 'Keyboard'),
          automation: this.i18n.t(
            'accessibility.keyboardAutomation',
            'Unit contracts + representative Playwright sequences',
          ),
          human: this.i18n.t('accessibility.keyboardHuman', 'Order and discoverability'),
        },
        {
          dimension: this.i18n.t('accessibility.accessibleName', 'Accessible name'),
          automation: 'axe + role queries',
          human: this.i18n.t('accessibility.clarityContext', 'Clarity in context'),
        },
        {
          dimension: this.i18n.t('accessibility.focus', 'Focus'),
          automation: this.i18n.t('accessibility.focusAssertions', 'Focus assertions'),
          human: this.i18n.t('accessibility.visibilityRestoration', 'Visibility and restoration'),
        },
        {
          dimension: this.i18n.t('accessibility.contrastDimension', 'Contrast'),
          automation: this.i18n.t(
            'accessibility.contrastAutomation',
            'axe + theme/token assertions',
          ),
          human: this.i18n.t('accessibility.allThemes', 'All product themes'),
        },
        {
          dimension: this.i18n.t('accessibility.zoomReflow', 'Zoom / reflow'),
          automation: this.i18n.t('accessibility.viewportSuite', '200% viewport suite'),
          human: this.i18n.t('accessibility.readingClipping', 'Reading order and clipping'),
        },
        {
          dimension: this.i18n.t('accessibility.motionDimension', 'Motion'),
          automation: this.i18n.t(
            'accessibility.motionAutomation',
            'Representative reduced-motion emulation',
          ),
          human: this.i18n.t('accessibility.causalityComfort', 'Causality and comfort'),
        },
        {
          dimension: 'RTL',
          automation: this.i18n.t(
            'accessibility.directionMatrix',
            'Representative direction matrix',
          ),
          human: this.i18n.t('accessibility.iconMirroring', 'Meaningful icon mirroring'),
        },
        {
          dimension: this.i18n.t('accessibility.forcedColors', 'Forced colors'),
          automation: this.i18n.t(
            'accessibility.forcedAutomation',
            'CSS rules + high-contrast scenarios',
          ),
          human: this.i18n.t('accessibility.windowsPass', 'Windows HC pass'),
        },
      ] as const,
  );
  protected readonly keyboardContracts = computed(
    () =>
      [
        {
          name: 'Tabs',
          bindings: [
            {
              keys: '← / →',
              action: this.i18n.t('accessibility.moveTabs', 'Move through horizontal tabs'),
            },
            {
              keys: 'Home / End',
              action: this.i18n.t('accessibility.jumpTabs', 'Jump to first or last enabled tab'),
            },
          ],
        },
        {
          name: 'Combobox',
          bindings: [
            {
              keys: '↓ / ↑',
              action: this.i18n.t('accessibility.moveOption', 'Move active option'),
            },
            {
              keys: 'Enter',
              action: this.i18n.t('accessibility.commitSelection', 'Commit selection'),
            },
            {
              keys: 'Escape',
              action: this.i18n.t('accessibility.closeFocus', 'Close without stealing focus'),
            },
          ],
        },
        {
          name: this.i18n.t('accessibility.dataGrid', 'Data grid'),
          bindings: [
            {
              keys: this.i18n.t('accessibility.arrowKeys', 'Arrow keys'),
              action: this.i18n.t('accessibility.moveCell', 'Move the active cell'),
            },
            {
              keys: 'Home / End',
              action: this.i18n.t('accessibility.rowBoundary', 'Move to row boundary'),
            },
          ],
        },
        {
          name: 'Dialog',
          bindings: [
            {
              keys: 'Tab',
              action: this.i18n.t('accessibility.modalTrap', 'Stay inside the modal focus trap'),
            },
            {
              keys: 'Escape',
              action: this.i18n.t('accessibility.closeRestore', 'Close and restore trigger focus'),
            },
          ],
        },
      ] as const,
  );
}
