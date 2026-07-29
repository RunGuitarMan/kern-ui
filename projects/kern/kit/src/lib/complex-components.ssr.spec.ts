import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnTree } from './data-display/display';
import { KrnCombobox } from './forms/select-controls';
import { KrnTreeNavigation } from './navigation/tree-navigation';

@Component({
  selector: 'krn-ssr-async-controls-host',
  imports: [KrnCombobox, KrnTree, KrnTreeNavigation],
  template: `
    <krn-combobox [open]="true" [options]="[]" optionsState="loading" ariaLabel="Workspace" />
    <krn-tree [nodes]="[{ id: 'accounts', label: 'Accounts', childrenState: 'loading' }]" />
    <krn-tree-navigation [items]="[{ id: 'billing', label: 'Billing', childrenState: 'error' }]" />
  `,
})
class SsrAsyncControlsHost {}

describe('KERN complex controls SSR', () => {
  it('serializes option and lazy-tree states without browser-only fallbacks', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(SsrAsyncControlsHost, { providers: [] }, context),
      {
        document:
          '<!doctype html><html><body><krn-ssr-async-controls-host></krn-ssr-async-controls-host></body></html>',
        url: 'https://kern.example/async-controls',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const combobox = document.querySelector('krn-combobox input');
    const optionState = document.querySelector(
      'krn-combobox [data-options-state-announcement="loading"]',
    );
    const treeItem = document.querySelector('krn-tree [role="treeitem"]');
    const navigationItem = document.querySelector('krn-tree-navigation [role="treeitem"]');

    expect(combobox?.getAttribute('aria-busy')).toBe('true');
    expect(combobox?.getAttribute('data-options-state')).toBe('loading');
    expect(optionState?.getAttribute('role')).toBe('status');
    expect(optionState?.textContent).toContain('Loading options');
    expect(treeItem?.getAttribute('aria-busy')).toBe('true');
    expect(treeItem?.getAttribute('aria-label')).toBe('Loading children for Accounts');
    expect(navigationItem?.getAttribute('aria-invalid')).toBe('true');
    expect(navigationItem?.getAttribute('aria-label')).toBe('Could not load children for Billing');
  });
});
