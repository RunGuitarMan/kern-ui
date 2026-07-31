import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KRN_LOADING_LABEL } from '@kern-ui/angular/i18n';
import { KrnButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'krn-consumer-root',
  imports: [KrnButton],
  providers: [{ provide: KRN_LOADING_LABEL, useValue: 'Saving workspace…' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button krnButton loading>Save</button>`,
})
class ButtonI18nConsumer {}

void bootstrapApplication(ButtonI18nConsumer);
