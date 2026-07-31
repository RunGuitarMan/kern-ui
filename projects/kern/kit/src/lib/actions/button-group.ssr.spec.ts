import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnButton } from './button';
import { KrnButtonGroup } from './button-group';
import { provideKrnButtonGroupOptions } from './button-group-options';
import { KrnIconButton } from './icon-button';

@Component({
  selector: 'krn-ssr-button-group-host',
  imports: [KrnButton, KrnButtonGroup, KrnIconButton],
  template: `
    <span id="review-label">Review actions</span>
    <div krnButtonGroup aria-labelledby="review-label" aria-describedby="review-help">
      <button krnButton>Comment</button>
      <button krnIconButton aria-label="More review actions">···</button>
    </div>
    <p id="review-help">Independent commands for the current review.</p>
    <krn-button-group ariaLabel="Legacy actions" connected="false">
      <button krnButton>Legacy command</button>
    </krn-button-group>
  `,
})
class SsrButtonGroupHost {}

describe('KrnButtonGroup SSR', () => {
  it('serializes native naming, scoped layout, direct actions, and the legacy bridge', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrButtonGroupHost,
          {
            providers: [
              provideKrnButtonGroupOptions({
                connected: true,
                orientation: 'vertical',
              }),
            ],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-button-group-host></krn-ssr-button-group-host></body></html>',
        url: 'https://kern.example/button-group',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const group = document.querySelector('div[krnButtonGroup]') as HTMLDivElement | null;
    const legacy = document.querySelector('krn-button-group') as HTMLElement | null;

    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-labelledby')).toBe('review-label');
    expect(group?.getAttribute('aria-describedby')).toBe('review-help');
    expect(group?.getAttribute('aria-label')).toBeNull();
    expect(group?.getAttribute('data-orientation')).toBe('vertical');
    expect(group?.getAttribute('data-connected')).toBe('true');
    expect(group?.querySelectorAll(':scope > button')).toHaveLength(2);
    expect(group?.querySelector('button button')).toBeNull();

    expect(legacy?.getAttribute('role')).toBe('group');
    expect(legacy?.getAttribute('aria-label')).toBe('Legacy actions');
    expect(legacy?.getAttribute('data-orientation')).toBe('vertical');
    expect(legacy?.hasAttribute('data-connected')).toBe(false);
    expect(legacy?.querySelectorAll(':scope > button')).toHaveLength(1);
  });
});
