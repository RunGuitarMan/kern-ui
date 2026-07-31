import { Directive } from '@angular/core';

/**
 * Applies KERN link presentation to a native navigation anchor.
 *
 * The browser or Angular Router owns the destination, browsing context,
 * relationship tokens, accessibility relationships, focus, and activation.
 * Use a native button component for actions that do not navigate.
 *
 * @publicApi
 */
@Directive({
  selector: 'a[krnLink]',
  host: {
    class: 'krn-link',
  },
})
export class KrnLink {}
