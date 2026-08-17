import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KRN_TOKEN_NAMES, generateKrnBrandPalette } from '@kern-ui/angular/core';
import { KrnBadge, KrnCodeBlock } from '@kern-ui/angular/kit';
import { KrnPageHeader } from '@kern-ui/angular/patterns';

import { DocsPreferences, type DocsDensity, type DocsTheme } from '../preferences';
import { DocsI18n } from '../docs-i18n';

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
  templateUrl: './foundations.html',
  styleUrl: './foundations.css',
})
export class FoundationsPage {
  protected readonly prefs = inject(DocsPreferences);
  protected readonly i18n = inject(DocsI18n);
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

  protected optionLabel(value: string): string {
    return this.i18n.term(value.charAt(0).toUpperCase() + value.slice(1));
  }
}
