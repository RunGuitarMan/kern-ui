import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideKrn } from '@kern-ui/angular/core';
import { KrnButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-install-recipe',
  standalone: true,
  imports: [KrnButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button krnButton>Configured KERN application</button>`,
})
export class KernInstallRecipe {}

void bootstrapApplication(KernInstallRecipe, {
  providers: [
    provideKrn({
      theme: 'system',
      density: 'comfortable',
      locale: 'en-US',
      direction: 'ltr',
    }),
  ],
});
