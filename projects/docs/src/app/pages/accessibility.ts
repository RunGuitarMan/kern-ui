import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KERN_COVERAGE } from '@kern-ui/showcase';
import { KrnAlert, KrnBadge, KrnCodeBlock, KrnPageHeader } from '@kern-ui/angular';

@Component({
  selector: 'kdocs-accessibility-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnAlert, KrnBadge, KrnCodeBlock, KrnPageHeader, RouterLink],
  template: `
    <article class="page">
      <krn-page-header
        index="09"
        eyebrow="Accessibility"
        heading="WCAG 2.2 AA is the floor."
        description="Kern treats semantics, keyboard mechanics, focus, contrast, zoom, motion, RTL, and resilient content as one product-quality contract."
      >
        <krn-badge status tone="success">Keyboard first</krn-badge>
        <krn-badge status tone="success">Forced colors</krn-badge>
      </krn-page-header>

      <section class="lead">
        <div>
          <p>09.1 / PRINCIPLE</p>
          <h2>Accessible by structure, verified by behavior.</h2>
        </div>
        <krn-alert tone="info" title="Automation is not certification">
          axe catches a valuable subset of issues. Kern also tests focus order, announcements,
          keyboard workflows, content reflow, pointer targets, and real browser rendering.
        </krn-alert>
      </section>

      <section class="pillars">
        @for (pillar of pillars; track pillar.index) {
          <article>
            <span>{{ pillar.index }}</span>
            <h3>{{ pillar.title }}</h3>
            <p>{{ pillar.copy }}</p>
            <ul>
              @for (item of pillar.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </article>
        }
      </section>

      <section class="matrix-section">
        <header>
          <p>09.2 / VERIFICATION MATRIX</p>
          <h2>One acceptance matrix for every stable component.</h2>
          <p>
            All {{ coverage.components }} catalog entries declare expected visual and interaction
            states. The matrix is a release requirement, not proof that every state has a dedicated
            screenshot or manual assistive-technology certificate.
          </p>
        </header>
        <div class="matrix" role="table" aria-label="Accessibility verification matrix">
          <div role="row" class="matrix-head">
            <span role="columnheader">Dimension</span>
            <span role="columnheader">Repository evidence</span>
            <span role="columnheader">Human review</span>
          </div>
          @for (row of matrix; track row.dimension) {
            <div role="row">
              <strong role="rowheader">{{ row.dimension }}</strong>
              <span role="cell">{{ row.automation }}</span>
              <span role="cell">{{ row.human }}</span>
            </div>
          }
        </div>
      </section>

      <section class="keyboard-section">
        <header>
          <p>09.3 / KEYBOARD</p>
          <h2>Composite widgets have explicit contracts.</h2>
        </header>
        <div class="keyboard-grid">
          @for (widget of keyboardContracts; track widget.name) {
            <article>
              <h3>{{ widget.name }}</h3>
              @for (binding of widget.bindings; track binding.keys) {
                <div>
                  <kbd>{{ binding.keys }}</kbd
                  ><span>{{ binding.action }}</span>
                </div>
              }
            </article>
          }
        </div>
      </section>

      <section class="zoom-section">
        <header>
          <p>09.4 / REFLOW + CONTRAST</p>
          <h2>Design for meaningful reflow at 200%.</h2>
          <p>
            Logical properties and container queries are the implementation tools; representative
            responsive suites verify narrow and enlarged-text surfaces. High contrast is a
            structural theme, while forced-color behavior still requires Windows review.
          </p>
        </header>
        <div class="contrast-demo">
          <div>
            <span>Light</span>
            <strong>Text remains calm and legible.</strong>
            <a [routerLink]="[]" fragment="forced-colors">Visible link affordance</a>
          </div>
          <div class="dark">
            <span>Dark</span>
            <strong>Carbon surfaces keep their hierarchy.</strong>
            <a [routerLink]="[]" fragment="forced-colors">Visible link affordance</a>
          </div>
          <div class="contrast" id="forced-colors">
            <span>High contrast</span>
            <strong>Structure does not depend on shadow.</strong>
            <a [routerLink]="[]" fragment="forced-colors">Underlined link affordance</a>
          </div>
        </div>
      </section>

      <section class="code-section">
        <header>
          <p>09.5 / CONSUMER RULE</p>
          <h2>Keep names visible and errors specific.</h2>
        </header>
        <krn-code-block
          language="html"
          [code]="'<krn-form-field\\n  label=&quot;Workspace name&quot;\\n  hint=&quot;Visible to every member.&quot;\\n  error=&quot;Use 3–48 characters.&quot;\\n  required\\n>\\n  <krn-text-input autocomplete=&quot;organization&quot; />\\n</krn-form-field>'"
        />
      </section>
    </article>
  `,
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
