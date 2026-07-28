import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBarChart, type KrnChartDatum } from '@kern-ui/angular/addon-charts';

@Component({
  selector: 'klab-consumer-root',
  imports: [KrnBarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<krn-bar-chart title="Usage" [data]="data" />`,
})
class ChartsAddonConsumer {
  protected readonly data: readonly KrnChartDatum[] = [
    { label: 'Compute', value: 64 },
    { label: 'Storage', value: 36 },
  ];
}

void bootstrapApplication(ChartsAddonConsumer);
