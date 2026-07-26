import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KrnBadge, KrnChip, KrnCodeBlock } from './display';

@Component({
  imports: [KrnChip],
  template: `<krn-chip interactive [selected]="true">Enterprise</krn-chip>`,
})
class ChipHost {}

describe('KrnChip', () => {
  it('keeps projected content inside its interactive native button', async () => {
    await TestBed.configureTestingModule({ imports: [ChipHost] }).compileComponents();
    const fixture = TestBed.createComponent(ChipHost);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.textContent?.trim()).toBe('Enterprise');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('KrnBadge', () => {
  it('exposes its semantic tone and renders a dedicated status marker', async () => {
    await TestBed.configureTestingModule({ imports: [KrnBadge] }).compileComponents();
    const fixture = TestBed.createComponent(KrnBadge);
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('status', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).getAttribute('data-tone')).toBe('success');
    expect((fixture.nativeElement as HTMLElement).querySelector('.marker')).not.toBeNull();
  });
});

describe('KrnCodeBlock', () => {
  it('keeps source text intact while tokenizing Angular and TypeScript syntax', async () => {
    await TestBed.configureTestingModule({ imports: [KrnCodeBlock] }).compileComponents();
    const fixture = TestBed.createComponent(KrnCodeBlock);
    const source = [
      "import { Component } from '@angular/core';",
      '@Component({',
      '  template: `<krn-button [disabled]="false">Publish</krn-button>`,',
      '})',
      'export class Toolbar {}',
    ].join('\n');
    fixture.componentRef.setInput('language', 'typescript');
    fixture.componentRef.setInput('code', source);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('code')?.textContent).toBe(source);
    expect(element.querySelector('.token-keyword')?.textContent).toBe('import');
    expect(element.querySelector('.token-decorator')?.textContent).toBe('@Component');
    expect(element.querySelector('.token-tag')?.textContent).toBe('<krn-button');
    expect(element.querySelector('.token-attribute')?.textContent).toBe('[disabled]');
  });
});
