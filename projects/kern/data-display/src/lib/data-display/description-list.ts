import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'krn-description-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './description-list.html',
  styleUrl: './description-list.css',
})
export class KrnDescriptionList {}

@Component({
  selector: 'krn-description-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './description-item.html',
  styleUrl: './description-item.css',
})
export class KrnDescriptionItem {
  readonly term = input.required<string>();
}
