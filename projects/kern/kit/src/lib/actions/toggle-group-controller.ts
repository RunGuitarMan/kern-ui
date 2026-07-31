import { InjectionToken } from '@angular/core';

export interface KrnToggleGroupItem {
  readonly element: HTMLButtonElement;
  readonly value: () => string;
  readonly disabled: () => boolean;
}

export interface KrnToggleGroupController {
  isSelected(value: string): boolean;
  toggle(value: string): void;
  readonly disabled: () => boolean;
  register(item: KrnToggleGroupItem): () => void;
  tabIndexFor(item: KrnToggleGroupItem): 0 | -1;
  notifyFocus(item: KrnToggleGroupItem): void;
}

/**
 * Private coordination boundary shared by Toggle Button and Toggle Group.
 *
 * Keeping the token separate from either public implementation lets an
 * isolated Toggle Button import retain optional group coordination without
 * pulling the Toggle Group component into the consumer bundle.
 */
export const KRN_TOGGLE_GROUP = /* @__PURE__ */ new InjectionToken<KrnToggleGroupController>(
  'KRN_TOGGLE_GROUP',
);
