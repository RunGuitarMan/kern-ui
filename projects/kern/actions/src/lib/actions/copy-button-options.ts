import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

/**
 * Inheritable appearance and feedback defaults for `KrnCopyButton`.
 *
 * Clipboard values, accessible labels, disabled state, and outputs remain
 * instance concerns and are intentionally excluded from this contract.
 */
export interface KrnCopyButtonOptions {
  readonly size: KrnSize;
  readonly variant: KrnActionVariant;
  readonly tone: KrnTone;
  /** Time in milliseconds before copied/error feedback returns to idle. */
  readonly feedbackDuration: number;
}

export const KRN_COPY_BUTTON_DEFAULT_OPTIONS: Readonly<KrnCopyButtonOptions> =
  /* @__PURE__ */ Object.freeze({
    size: 'md',
    variant: 'outline',
    tone: 'neutral',
    feedbackDuration: 1800,
  });

const KRN_COPY_BUTTON_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnCopyButtonOptions>(
  'KRN_COPY_BUTTON_OPTIONS',
  KRN_COPY_BUTTON_DEFAULT_OPTIONS,
);

/**
 * Scoped Copy Button defaults. Each provider merges a partial immutable patch
 * with the closest ancestor configuration.
 */
export const KRN_COPY_BUTTON_OPTIONS = /* @__PURE__ */ (() => KRN_COPY_BUTTON_OPTIONS_FACTORY[0])();
export const provideKrnCopyButtonOptions = /* @__PURE__ */ (() =>
  KRN_COPY_BUTTON_OPTIONS_FACTORY[1])();
