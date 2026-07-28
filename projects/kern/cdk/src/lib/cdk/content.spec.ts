import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { isKrnComponentContent, isKrnTemplateContent } from './content';

@Component({
  template: '<ng-template #content let-item>{{ item }}</ng-template>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ContentSpecHost {
  readonly content = viewChild.required<TemplateRef<{ $implicit: string }>>('content');
}

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ContentSpecComponent {}

describe('KrnContent guards', () => {
  it('distinguishes strings, templates, and component types', () => {
    const fixture = TestBed.createComponent(ContentSpecHost);
    fixture.detectChanges();
    const template = fixture.componentInstance.content();

    expect(isKrnTemplateContent('Text')).toBe(false);
    expect(isKrnTemplateContent(template)).toBe(true);
    expect(isKrnComponentContent(ContentSpecComponent)).toBe(true);
    expect(isKrnComponentContent('Text')).toBe(false);
  });
});
