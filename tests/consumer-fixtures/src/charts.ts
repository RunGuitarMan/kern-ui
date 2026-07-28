import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBarChart, type KrnChartDatum } from '@kern-ui/angular';

@Component({
  selector: 'klab-consumer-root',
  imports: [KrnBarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<krn-bar-chart title="Usage" [data]="data" />`,
})
class ChartsConsumer {
  protected readonly data: readonly KrnChartDatum[] = [
    { label: 'Compute', value: 64 },
    { label: 'Storage', value: 36 },
  ];
}

void bootstrapApplication(ChartsConsumer);
