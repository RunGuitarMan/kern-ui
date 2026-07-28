import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFormField, KrnLabel, KrnSelect, type KrnSelectOption } from '@kern-ui/angular';

@Component({
  selector: 'klab-consumer-root',
  imports: [KrnFormField, KrnLabel, KrnSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field>
      <krn-label>Region</krn-label>
      <krn-select [options]="options" />
    </krn-form-field>
  `,
})
class SelectConsumer {
  protected readonly options: readonly KrnSelectOption<string>[] = [
    { value: 'eu', label: 'Europe' },
    { value: 'apac', label: 'Asia Pacific' },
  ];
}

void bootstrapApplication(SelectConsumer);
