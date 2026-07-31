import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

export type KrnMenuAlignment = 'start' | 'end';

/**
 * Inheritable appearance and positioning defaults for menu-button components.
 *
 * Menu content, controlled open state, disabled/loading state and selection
 * behavior remain instance concerns.
 */
export interface KrnMenuButtonOptions {
  readonly size: KrnSize;
  readonly variant: KrnActionVariant;
  readonly tone: KrnTone;
  readonly menuAlign: KrnMenuAlignment;
  /** Logical gap in CSS pixels between the trigger and its connected menu. */
  readonly menuOffset: number;
  /** Makes the connected menu exactly as wide as its trigger. */
  readonly matchTriggerWidth: boolean;
}

export const KRN_MENU_BUTTON_DEFAULT_OPTIONS: Readonly<KrnMenuButtonOptions> =
  /* @__PURE__ */ Object.freeze({
    size: 'md',
    variant: 'solid',
    tone: 'brand',
    menuAlign: 'end',
    menuOffset: 8,
    matchTriggerWidth: false,
  });

const KRN_MENU_BUTTON_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnMenuButtonOptions>(
  'KRN_MENU_BUTTON_OPTIONS',
  KRN_MENU_BUTTON_DEFAULT_OPTIONS,
);

/**
 * Scoped defaults shared by Dropdown Button and Split Button.
 *
 * Each provider merges a partial immutable patch with the closest ancestor
 * configuration.
 */
export const KRN_MENU_BUTTON_OPTIONS = /* @__PURE__ */ (() => KRN_MENU_BUTTON_OPTIONS_FACTORY[0])();
export const provideKrnMenuButtonOptions = /* @__PURE__ */ (() =>
  KRN_MENU_BUTTON_OPTIONS_FACTORY[1])();
