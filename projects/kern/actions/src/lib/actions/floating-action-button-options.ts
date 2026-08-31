import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

/**
 * Inheritable visual and loading-copy defaults for `KrnFloatingActionButton`.
 *
 * Native button semantics such as `type`, `disabled`, form ownership, and
 * accessible-name relationships intentionally remain on the host element.
 */
export interface KrnFloatingActionButtonOptions {
  readonly size: KrnSize;
  readonly variant: KrnActionVariant;
  readonly tone: KrnTone;
  readonly extended: boolean;
  /**
   * Optional loading announcement for a scoped subtree.
   *
   * Omit it to inherit the application-wide copy configured through
   * `provideKrn({translations})`.
   */
  readonly loadingLabel?: string;
}

export const KRN_FLOATING_ACTION_BUTTON_DEFAULT_OPTIONS: Readonly<KrnFloatingActionButtonOptions> =
  /* @__PURE__ */ Object.freeze({
    size: 'lg',
    variant: 'solid',
    tone: 'brand',
    extended: true,
  });

const KRN_FLOATING_ACTION_BUTTON_OPTIONS_FACTORY =
  /* @__PURE__ */ createKrnOptions<KrnFloatingActionButtonOptions>(
    'KRN_FLOATING_ACTION_BUTTON_OPTIONS',
    KRN_FLOATING_ACTION_BUTTON_DEFAULT_OPTIONS,
  );

/**
 * Scoped floating-action defaults. Each provider supplies a partial immutable
 * patch that is merged with the closest ancestor configuration.
 */
export const KRN_FLOATING_ACTION_BUTTON_OPTIONS = /* @__PURE__ */ (() =>
  KRN_FLOATING_ACTION_BUTTON_OPTIONS_FACTORY[0])();
export const provideKrnFloatingActionButtonOptions = /* @__PURE__ */ (() =>
  KRN_FLOATING_ACTION_BUTTON_OPTIONS_FACTORY[1])();
