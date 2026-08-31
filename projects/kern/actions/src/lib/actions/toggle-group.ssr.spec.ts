import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { KrnToggleButton } from './toggle-button';
import { KrnToggleGroup } from './toggle-group';
import { provideKrnToggleGroupOptions } from './toggle-group-options';

@Component({
  selector: 'krn-ssr-toggle-group-host',
  imports: [KrnToggleButton, KrnToggleGroup],
  template: `
    <h2 id="layers-label">Visible layers</h2>
    <div
      krnToggleGroup
      aria-describedby="layers-help"
      aria-labelledby="layers-label"
      [values]="['targets', 'forecast']"
    >
      <button krnToggleButton value="targets">Targets</button>
      <button krnToggleButton value="forecast">Forecast</button>
    </div>
    <p id="layers-help">Choose any visible dashboard layers.</p>
  `,
})
class SsrToggleGroupHost {}

describe('KrnToggleGroup SSR', () => {
  it('serializes canonical toolbar semantics, scoped state, and one roving tab stop', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          SsrToggleGroupHost,
          {
            providers: [
              provideKrnToggleGroupOptions({
                multiple: true,
                orientation: 'vertical',
              }),
            ],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><krn-ssr-toggle-group-host></krn-ssr-toggle-group-host></body></html>',
        url: 'https://kern.example/toggle-group',
        allowedHosts: ['kern.example'],
      },
    );
    const document = new DOMParser().parseFromString(html, 'text/html');
    const group = document.querySelector('div[krnToggleGroup]');
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button[krnToggleButton]')];

    expect(document.querySelector('krn-toggle-group')).toBeNull();
    expect(group?.getAttribute('role')).toBe('toolbar');
    expect(group?.getAttribute('aria-labelledby')).toBe('layers-label');
    expect(group?.getAttribute('aria-describedby')).toBe('layers-help');
    expect(group?.getAttribute('aria-orientation')).toBe('vertical');
    expect(group?.getAttribute('aria-disabled')).toBeNull();
    expect(group?.getAttribute('data-multiple')).toBe('true');
    expect(group?.getAttribute('data-orientation')).toBe('vertical');
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'true']);
    expect(buttons.map((button) => button.getAttribute('tabindex'))).toEqual(['0', '-1']);
  });
});
