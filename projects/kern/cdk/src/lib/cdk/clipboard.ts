import { Clipboard as CdkClipboard } from '@angular/cdk/clipboard';
import { inject, InjectionToken } from '@angular/core';

import { KRN_PLATFORM } from './platform';

const KRN_CLIPBOARD_WRITE_ERROR_MESSAGE =
  'KRN_CLIPBOARD_WRITE_FAILED: Clipboard writing is unavailable or failed.';

/**
 * Replaceable boundary for writing plain text to the system clipboard.
 *
 * The default writer prefers the asynchronous Clipboard API and only uses the
 * Angular CDK fallback when that modern API is absent. Consumers can replace
 * this token in tests or constrained rendering environments.
 */
export interface KrnClipboardWriter {
  writeText(value: string): Promise<void>;
}

function clipboardWriteError(): Error {
  return new Error(KRN_CLIPBOARD_WRITE_ERROR_MESSAGE);
}

function createDefaultClipboardWriter(): KrnClipboardWriter {
  const platform = inject(KRN_PLATFORM);
  const fallback = inject(CdkClipboard, { optional: true });

  return Object.freeze({
    async writeText(value: string): Promise<void> {
      if (!platform.isBrowser) {
        throw clipboardWriteError();
      }

      const modern = platform.window?.navigator.clipboard;
      if (typeof modern?.writeText === 'function') {
        await modern.writeText(value);
        return;
      }

      if (!fallback) {
        throw clipboardWriteError();
      }

      try {
        if (fallback.copy(value)) {
          return;
        }
      } catch {
        // Normalize fallback implementation failures to the public boundary.
      }

      throw clipboardWriteError();
    },
  });
}

/** Application-replaceable clipboard writer used by KERN copy affordances. */
export const KRN_CLIPBOARD_WRITER = new InjectionToken<KrnClipboardWriter>('KRN_CLIPBOARD_WRITER', {
  providedIn: 'root',
  factory: createDefaultClipboardWriter,
});
