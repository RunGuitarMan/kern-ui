import {
  KrnButtonHarness as KrnRootButtonHarness,
  KrnCommandPaletteHarness as KrnRootCommandPaletteHarness,
  KrnDataGridHarness as KrnRootDataGridHarness,
  KrnDialogHarness as KrnRootDialogHarness,
  KrnResizablePanelsHarness as KrnRootResizablePanelsHarness,
  KrnSelectHarness as KrnRootSelectHarness,
  KrnTreeHarness as KrnRootTreeHarness,
} from '@kern-ui/angular/testing';
import { KrnButtonHarness } from '@kern-ui/angular/testing/actions';
import { KrnDataGridHarness, KrnTreeHarness } from '@kern-ui/angular/testing/data-display';
import { KrnDialogHarness } from '@kern-ui/angular/testing/feedback';
import { KrnSelectHarness } from '@kern-ui/angular/testing/forms';
import { KrnResizablePanelsHarness } from '@kern-ui/angular/testing/layout';
import { KrnCommandPaletteHarness } from '@kern-ui/angular/testing/navigation';
import type { KrnHarnessText } from '@kern-ui/angular/testing/shared';

export const testingHarnesses = [
  KrnButtonHarness,
  KrnCommandPaletteHarness,
  KrnDataGridHarness,
  KrnDialogHarness,
  KrnResizablePanelsHarness,
  KrnSelectHarness,
  KrnTreeHarness,
] as const;

export const testingCompatibilityIdentities = [
  [KrnRootButtonHarness, KrnButtonHarness],
  [KrnRootCommandPaletteHarness, KrnCommandPaletteHarness],
  [KrnRootDataGridHarness, KrnDataGridHarness],
  [KrnRootDialogHarness, KrnDialogHarness],
  [KrnRootResizablePanelsHarness, KrnResizablePanelsHarness],
  [KrnRootSelectHarness, KrnSelectHarness],
  [KrnRootTreeHarness, KrnTreeHarness],
] as const;

export const testingHarnessText: KrnHarnessText = /accessible name/i;
