import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnOrientation } from './action-types';

/**
 * Inheritable interaction defaults for `KrnToggleGroup`.
 *
 * Controlled values and disabled state intentionally remain instance state:
 * application defaults must not silently select or disable a toolbar.
 */
export interface KrnToggleGroupOptions {
  readonly orientation: KrnOrientation;
  readonly multiple: boolean;
}

export const KRN_TOGGLE_GROUP_DEFAULT_OPTIONS: Readonly<KrnToggleGroupOptions> =
  /* @__PURE__ */ Object.freeze({
    orientation: 'horizontal',
    multiple: false,
  });

const KRN_TOGGLE_GROUP_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnToggleGroupOptions>(
  'KRN_TOGGLE_GROUP_OPTIONS',
  KRN_TOGGLE_GROUP_DEFAULT_OPTIONS,
);

/**
 * Scoped Toggle Group defaults. Each provider merges an immutable partial
 * patch with the closest ancestor configuration.
 */
export const KRN_TOGGLE_GROUP_OPTIONS = /* @__PURE__ */ (() =>
  KRN_TOGGLE_GROUP_OPTIONS_FACTORY[0])();
export const provideKrnToggleGroupOptions = /* @__PURE__ */ (() =>
  KRN_TOGGLE_GROUP_OPTIONS_FACTORY[1])();
