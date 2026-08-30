import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnOrientation } from './action-types';

/**
 * Inheritable layout defaults for `KrnButtonGroup`.
 *
 * Accessible naming, focus, activation, loading, disabled, and form semantics
 * intentionally remain native concerns of the group host and its child actions.
 */
export interface KrnButtonGroupOptions {
  readonly orientation: KrnOrientation;
  readonly connected: boolean;
}

export const KRN_BUTTON_GROUP_DEFAULT_OPTIONS: Readonly<KrnButtonGroupOptions> =
  /* @__PURE__ */ Object.freeze({
    orientation: 'horizontal',
    connected: false,
  });

const KRN_BUTTON_GROUP_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnButtonGroupOptions>(
  'KRN_BUTTON_GROUP_OPTIONS',
  KRN_BUTTON_GROUP_DEFAULT_OPTIONS,
);

/**
 * Scoped button-group defaults. Each provider merges a partial immutable patch
 * with the closest ancestor configuration.
 */
export const KRN_BUTTON_GROUP_OPTIONS = /* @__PURE__ */ (() =>
  KRN_BUTTON_GROUP_OPTIONS_FACTORY[0])();
export const provideKrnButtonGroupOptions = /* @__PURE__ */ (() =>
  KRN_BUTTON_GROUP_OPTIONS_FACTORY[1])();
