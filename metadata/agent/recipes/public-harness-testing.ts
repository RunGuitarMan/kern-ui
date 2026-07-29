import type { HarnessLoader } from '@angular/cdk/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSelect, type KrnSelectOption } from '@kern-ui/angular/kit';
import { KrnSelectHarness } from '@kern-ui/angular/testing';

@Component({
  selector: 'app-kern-public-harness-recipe',
  standalone: true,
  imports: [KrnSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-select ariaLabel="Plan" [options]="plans" [formControl]="plan" [(open)]="open" />
  `,
})
export class KernPublicHarnessRecipe {
  readonly plans: readonly KrnSelectOption<string>[] = [
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' },
  ];
  readonly plan = new FormControl<string | null>(null);
  open = false;
}

export async function chooseEnterprisePlan(loader: HarnessLoader): Promise<void> {
  const plan = await loader.getHarness(KrnSelectHarness.with({ ariaLabel: 'Plan' }));
  await plan.selectOption({ text: 'Enterprise' });
  if ((await plan.getValueText()) !== 'Enterprise') {
    throw new Error('The plan selection did not commit through the public component contract.');
  }
}

void bootstrapApplication(KernPublicHarnessRecipe);
