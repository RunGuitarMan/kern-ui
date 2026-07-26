import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  KRN_TOKEN_NAMES,
  KrnBadge,
  KrnCodeBlock,
  KrnPageHeader,
  generateKrnBrandPalette,
} from '@kern-ui/angular';

import { DocsPreferences, type DocsDensity, type DocsTheme } from '../preferences';

interface TokenRow {
  readonly group: string;
  readonly name: string;
  readonly css: string;
}

function flattenTokens(value: object): readonly TokenRow[] {
  const rows: TokenRow[] = [];
  for (const [group, tokens] of Object.entries(value)) {
    if (!tokens || typeof tokens !== 'object') continue;
    for (const [name, css] of Object.entries(tokens as Record<string, unknown>)) {
      if (typeof css === 'string') rows.push({ group, name, css });
    }
  }
  return rows;
}

@Component({
  selector: 'kdocs-foundations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KrnBadge, KrnCodeBlock, KrnPageHeader],
  template: `
    <article class="page">
      <krn-page-header
        index="01"
        eyebrow="Foundations"
        heading="A semantic system, not a paint box."
        description="Kern separates primitives from product meaning. Components consume semantic roles, while applications can safely change theme, density, direction, and brand at runtime."
      >
        <krn-badge status tone="success">CSS + TypeScript parity</krn-badge>
      </krn-page-header>

      <section class="theme-studio">
        <header>
          <p>01.1 / THEME STUDIO</p>
          <h2>Calibrate the system live.</h2>
        </header>
        <div class="studio-controls">
          <fieldset>
            <legend>Theme</legend>
            @for (theme of themes; track theme) {
              <button
                type="button"
                [attr.aria-pressed]="prefs.theme() === theme"
                (click)="prefs.theme.set(theme)"
              >
                {{ theme }}
              </button>
            }
          </fieldset>
          <fieldset>
            <legend>Density</legend>
            @for (density of densities; track density) {
              <button
                type="button"
                [attr.aria-pressed]="prefs.density() === density"
                (click)="prefs.density.set(density)"
              >
                {{ density }}
              </button>
            }
          </fieldset>
          <label>
            <span>Brand source</span>
            <div>
              <input type="color" [value]="prefs.brand()" (input)="setBrand($event)" />
              <code>{{ prefs.brand() }}</code>
            </div>
          </label>
          <button class="direction" type="button" (click)="prefs.direction.update(toggleDirection)">
            Direction: {{ prefs.direction().toUpperCase() }}
          </button>
        </div>
        <div class="palette">
          @for (swatch of brandPalette(); track swatch.name) {
            <div [style.background]="swatch.value" [style.color]="swatch.onColor">
              <span>{{ swatch.name }}</span>
              <code>{{ swatch.value }}</code>
            </div>
          }
        </div>
      </section>

      <section class="foundation-section">
        <header>
          <p>01.2 / COLOR</p>
          <h2>Meaning survives the theme.</h2>
          <p>
            Each intent owns surface, border, text, solid, and on-solid roles. Color is reinforced
            by shape and copy.
          </p>
        </header>
        <div class="semantic-colors">
          @for (color of semanticColors; track color.name) {
            <article [style.--sample]="color.value">
              <span></span>
              <strong>{{ color.name }}</strong>
              <code>{{ color.value }}</code>
            </article>
          }
        </div>
      </section>

      <section class="foundation-section type-section">
        <header>
          <p>01.3 / TYPE</p>
          <h2>Geist, tuned for interface clarity.</h2>
          <p>
            One variable family covers Latin and Cyrillic; monospaced figures carry coordinates,
            tokens, and operational data.
          </p>
        </header>
        <div class="type-specimens">
          <div class="display-type"><span>64 / 68</span>Precision without sterility.</div>
          <div class="heading-type"><span>28 / 34</span>Плотная и ясная иерархия.</div>
          <div class="body-type">
            <span>16 / 24</span>
            Product interfaces need room for nuance: labels that remain visible, numbers that align,
            and instructions that still work at 200% zoom.
          </div>
          <div class="label-type"><span>12 / 16</span>07 / CONTROL LABEL</div>
        </div>
      </section>

      <section class="foundation-section">
        <header>
          <p>01.4 / SPACING + DENSITY</p>
          <h2>A 4px baseline with optical exceptions.</h2>
          <p>
            Density changes control rhythm, not text size. Coarse pointers retain a 44px minimum
            interaction target.
          </p>
        </header>
        <div class="spacing-scale">
          @for (space of spaces; track space.token) {
            <div>
              <span [style.inline-size]="space.value"></span>
              <code>{{ space.token }}</code>
              <small>{{ space.value }}</small>
            </div>
          }
        </div>
      </section>

      <section class="foundation-section">
        <header>
          <p>01.5 / MOTION</p>
          <h2>Motion confirms geometry and cause.</h2>
          <p>
            Durations are short, displacement stays between two and six pixels, and reduced motion
            removes transforms.
          </p>
        </header>
        <div class="motion-grid">
          @for (motion of motions; track motion.duration) {
            <button type="button" [style.--duration]="motion.duration">
              <i></i>
              <strong>{{ motion.duration }}</strong>
              <span>{{ motion.label }}</span>
            </button>
          }
        </div>
      </section>

      <section class="foundation-section token-explorer">
        <header>
          <p>01.6 / TOKEN EXPLORER</p>
          <h2>{{ tokenRows.length }} typed public token names.</h2>
          <p>
            The same contract is available through CSS custom properties and the
            <code>krnTokens</code> TypeScript record.
          </p>
        </header>
        <div class="token-table" tabindex="0" aria-label="Scrollable token table">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Name</th>
                <th>CSS custom property</th>
              </tr>
            </thead>
            <tbody>
              @for (token of tokenRows; track token.css) {
                <tr>
                  <td>{{ token.group }}</td>
                  <th scope="row">{{ token.name }}</th>
                  <td>
                    <code>{{ token.css }}</code>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <krn-code-block
          language="typescript"
          [code]="'import { krnTokens } from \\'@kern-ui/angular\\';\\n\\nconst focusColor = krnTokens.color.focus;\\n// var(--krn-color-focus)'"
        />
      </section>
    </article>
  `,
  styleUrl: './foundations.css',
})
export class FoundationsPage {
  protected readonly prefs = inject(DocsPreferences);
  protected readonly themes: readonly DocsTheme[] = ['system', 'light', 'dark', 'contrast'];
  protected readonly densities: readonly DocsDensity[] = ['compact', 'comfortable', 'spacious'];
  protected readonly tokenRows = flattenTokens(KRN_TOKEN_NAMES);
  protected readonly toggleDirection = (value: 'ltr' | 'rtl'): 'ltr' | 'rtl' =>
    value === 'ltr' ? 'rtl' : 'ltr';
  protected readonly semanticColors = [
    { name: 'Canvas', value: 'var(--krn-color-canvas)' },
    { name: 'Surface', value: 'var(--krn-color-surface)' },
    { name: 'Raised', value: 'var(--krn-color-surface-raised)' },
    { name: 'Text', value: 'var(--krn-color-text)' },
    { name: 'Primary', value: 'var(--krn-color-primary)' },
    { name: 'Success', value: 'var(--krn-color-success)' },
    { name: 'Warning', value: 'var(--krn-color-warning)' },
    { name: 'Danger', value: 'var(--krn-color-danger)' },
    { name: 'Info', value: 'var(--krn-color-info)' },
  ] as const;
  protected readonly spaces = [
    { token: 'space-1', value: '0.25rem' },
    { token: 'space-2', value: '0.5rem' },
    { token: 'space-3', value: '0.75rem' },
    { token: 'space-4', value: '1rem' },
    { token: 'space-6', value: '1.5rem' },
    { token: 'space-8', value: '2rem' },
    { token: 'space-12', value: '3rem' },
    { token: 'space-16', value: '4rem' },
  ] as const;
  protected readonly motions = [
    { duration: '90ms', label: 'hover / press' },
    { duration: '160ms', label: 'selection / disclosure' },
    { duration: '240ms', label: 'overlay / dialog' },
    { duration: '360ms', label: 'page entrance' },
  ] as const;

  protected brandPalette() {
    const palette = generateKrnBrandPalette(this.prefs.brand());
    if (!palette) return [];
    return Object.entries(palette).map(([name, value]) => ({
      name,
      value,
      onColor: Number(name) >= 600 ? 'white' : '#000',
    }));
  }

  protected setBrand(event: Event): void {
    this.prefs.brand.set((event.currentTarget as HTMLInputElement).value);
  }
}
