import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

/**
 * Inheritable visual defaults for `KrnToggleButton`.
 *
 * The two appearance pairs intentionally describe effective pressed state;
 * `aria-pressed` and interaction state remain owned by the component.
 */
export interface KrnToggleButtonOptions {
  readonly size: KrnSize;
  readonly pressedVariant: KrnActionVariant;
  readonly pressedTone: KrnTone;
  readonly unpressedVariant: KrnActionVariant;
  readonly unpressedTone: KrnTone;
}

export const KRN_TOGGLE_BUTTON_DEFAULT_OPTIONS: Readonly<KrnToggleButtonOptions> =
  /* @__PURE__ */ Object.freeze({
    size: 'md',
    pressedVariant: 'soft',
    pressedTone: 'brand',
    unpressedVariant: 'ghost',
    unpressedTone: 'neutral',
  });

const KRN_TOGGLE_BUTTON_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnToggleButtonOptions>(
  'KRN_TOGGLE_BUTTON_OPTIONS',
  KRN_TOGGLE_BUTTON_DEFAULT_OPTIONS,
);

/**
 * Scoped Toggle Button defaults. Each provider supplies a partial immutable
 * patch that is merged with the closest ancestor configuration.
 */
export const KRN_TOGGLE_BUTTON_OPTIONS = /* @__PURE__ */ (() =>
  KRN_TOGGLE_BUTTON_OPTIONS_FACTORY[0])();
export const provideKrnToggleButtonOptions = /* @__PURE__ */ (() =>
  KRN_TOGGLE_BUTTON_OPTIONS_FACTORY[1])();
