import { createKrnOptions } from '@kern-ui/angular/cdk';
import type { KrnActionVariant, KrnSize, KrnTone } from './action-types';

/**
 * Inheritable visual and loading-copy defaults for `KrnIconButton`.
 *
 * Native button semantics such as `type`, `disabled`, form ownership, and
 * accessible-name attributes intentionally remain on the host element.
 */
export interface KrnIconButtonOptions {
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

export const KRN_ICON_BUTTON_DEFAULT_OPTIONS: Readonly<KrnIconButtonOptions> =
  /* @__PURE__ */ Object.freeze({
    size: 'md',
    variant: 'ghost',
    tone: 'neutral',
  });

const KRN_ICON_BUTTON_OPTIONS_FACTORY = /* @__PURE__ */ createKrnOptions<KrnIconButtonOptions>(
  'KRN_ICON_BUTTON_OPTIONS',
  KRN_ICON_BUTTON_DEFAULT_OPTIONS,
);

/**
 * Scoped icon-button defaults. Each provider supplies a partial immutable
 * patch that is merged with the closest ancestor configuration.
 */
export const KRN_ICON_BUTTON_OPTIONS = /* @__PURE__ */ (() => KRN_ICON_BUTTON_OPTIONS_FACTORY[0])();
export const provideKrnIconButtonOptions = /* @__PURE__ */ (() =>
  KRN_ICON_BUTTON_OPTIONS_FACTORY[1])();
