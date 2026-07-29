import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  KrnDialog,
  KrnPopover,
  KrnSelect,
  KrnTooltip,
  type KrnSelectOption,
} from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-nested-overlays-recipe',
  standalone: true,
  imports: [KrnDialog, KrnPopover, KrnSelect, KrnTooltip, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" krnTooltip="Edit customer ownership" (click)="dialogOpen = true">
      Edit customer
    </button>

    <krn-dialog
      title="Edit customer"
      description="Update ownership without losing keyboard context."
      [(open)]="dialogOpen"
    >
      <p>The dialog remains the modal owner while its child overlays are open.</p>

      <krn-popover ariaLabel="Ownership guidance" [(open)]="popoverOpen">
        <span krnPopoverTrigger>Ownership guidance</span>
        <p id="ownership-help">Choose the team responsible for escalations.</p>
        <krn-select
          ariaLabel="Escalation owner"
          [options]="owners"
          [formControl]="owner"
          [(open)]="selectOpen"
        />
      </krn-popover>

      <button krnDialogAction type="button" (click)="dialogOpen = false">Save</button>
    </krn-dialog>
  `,
})
export class KernNestedOverlaysRecipe {
  readonly owner = new FormControl<string | null>('platform');
  readonly owners: readonly KrnSelectOption<string>[] = [
    { value: 'platform', label: 'Platform team' },
    { value: 'security', label: 'Security team' },
  ];

  dialogOpen = false;
  popoverOpen = false;
  selectOpen = false;
}

void bootstrapApplication(KernNestedOverlaysRecipe);
