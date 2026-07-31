import { InjectionToken } from '@angular/core';

/** Default accessible name for a menu segment that reveals related actions. */
export const KRN_DEFAULT_MORE_ACTIONS_LABEL = 'More actions';

/**
 * Tree-shakable accessible copy for menu-button segments.
 *
 * `provideKrn` bridges this token to `translations.actions.moreActions`.
 * Leaf consumers can override it directly without retaining the complete
 * translation registry.
 */
export const KRN_MORE_ACTIONS_LABEL = new InjectionToken<string>('KRN_MORE_ACTIONS_LABEL', {
  providedIn: 'root',
  factory: () => KRN_DEFAULT_MORE_ACTIONS_LABEL,
});
