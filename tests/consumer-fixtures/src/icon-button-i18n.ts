import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KRN_LOADING_LABEL } from '@kern-ui/angular/i18n';
import { KrnIconButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnIconButton],
  providers: [{ provide: KRN_LOADING_LABEL, useValue: 'Saving workspace…' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <button krnIconButton aria-label="Save workspace" loading>↓</button> `,
})
class IconButtonI18nConsumer {}

void bootstrapApplication(IconButtonI18nConsumer);
