import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

/**
 * Inheritable defaults for `KrnButton`.
 *
 * Native button semantics such as `type`, `disabled`, `name`, `value`, and
 * form ownership intentionally stay on the host element and are never
 * configured through this options contract.
 */
export interface KrnButtonOptions {
  readonly size: KrnSize;
  readonly variant: KrnActionVariant;
  readonly tone: KrnTone;
  /**
   * Optional loading announcement for a scoped subtree.
   *
   * Omit it to inherit the application-wide copy configured through
   * `provideKrn({translations})`.
   */
  readonly loadingLabel?: string;
}

export const KRN_BUTTON_DEFAULT_OPTIONS: Readonly<KrnButtonOptions> = /* @__PURE__ */ Object.freeze(
  {
    size: 'md',
    variant: 'solid',
    tone: 'brand',
  },
);

const KRN_BUTTON_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnButtonOptions>(
  'KRN_BUTTON_OPTIONS',
  KRN_BUTTON_DEFAULT_OPTIONS,
);

/**
 * Scoped button defaults. Provide a partial patch at any injector boundary;
 * descendants inherit the closest merged, immutable value.
 */
export const KRN_BUTTON_OPTIONS = /* @__PURE__ */ (() => KRN_BUTTON_OPTIONS_FACTORY[0])();
export const provideKrnButtonOptions = /* @__PURE__ */ (() => KRN_BUTTON_OPTIONS_FACTORY[1])();
