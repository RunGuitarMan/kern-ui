import type { DestroyRef } from '@angular/core';
import { ɵgetKrnDocumentRuntimeChannel } from '@kern-ui/angular/cdk';

interface DocumentStateClaim<T> {
  readonly apply: (snapshot: T) => void;
  readonly capture: () => T;
  readonly restore: (snapshot: T) => void;
  released: boolean;
  snapshot: T | undefined;
}

interface DocumentStateChannel {
  active: DocumentStateClaim<unknown> | null;
  readonly waiting: DocumentStateClaim<unknown>[];
}

interface DocumentStateRegistryV1 {
  readonly targets: WeakMap<object, Map<symbol, DocumentStateChannel>>;
  readonly version: 1;
}

const documentStateRegistryChannel = Symbol.for(
  '@kern-ui/angular/core/document-state-ownership/v1',
);

function stateChannels(target: HTMLElement): Map<symbol, DocumentStateChannel> {
  const registry = ɵgetKrnDocumentRuntimeChannel<DocumentStateRegistryV1>(
    target.ownerDocument,
    documentStateRegistryChannel,
    () => ({ targets: new WeakMap(), version: 1 }),
  );
  let channels = registry.targets.get(target);
  if (!channels) {
    channels = new Map();
    registry.targets.set(target, channels);
  }
  return channels;
}

export interface KrnDocumentStateOwnership {
  isActive(): boolean;
  refresh(): void;
}

/**
 * Gives one injector exclusive ownership of a document-level state channel.
 * Later injectors stay dormant until the current owner is destroyed, so a
 * lazy or embedded environment cannot overwrite or reset its ancestor.
 */
export function ownKrnDocumentState<T>(
  target: HTMLElement,
  channelKey: symbol,
  destroyRef: DestroyRef,
  capture: () => T,
  apply: (snapshot: T) => void,
  restore: (snapshot: T) => void,
): KrnDocumentStateOwnership {
  const channels = stateChannels(target);

  let channel = channels.get(channelKey);
  if (!channel) {
    channel = { active: null, waiting: [] };
    channels.set(channelKey, channel);
  }

  const claim: DocumentStateClaim<T> = {
    apply,
    capture,
    released: false,
    restore,
    snapshot: undefined,
  };
  const erasedClaim = claim as DocumentStateClaim<unknown>;

  const activate = (): void => {
    if (claim.released) return;
    claim.snapshot = claim.capture();
    channel.active = erasedClaim;
    claim.apply(claim.snapshot);
  };

  if (channel.active) {
    channel.waiting.push(erasedClaim);
  } else {
    activate();
  }

  const release = (): void => {
    if (claim.released) return;
    claim.released = true;

    if (channel.active !== erasedClaim) {
      const waitingIndex = channel.waiting.indexOf(erasedClaim);
      if (waitingIndex >= 0) channel.waiting.splice(waitingIndex, 1);
      return;
    }

    if (claim.snapshot !== undefined) claim.restore(claim.snapshot);
    claim.snapshot = undefined;
    channel.active = null;

    let next = channel.waiting.shift();
    while (next?.released) next = channel.waiting.shift();
    if (next) {
      next.snapshot = next.capture();
      channel.active = next;
      next.apply(next.snapshot);
      return;
    }

    channels.delete(channelKey);
    if (channels.size === 0) {
      const registry = ɵgetKrnDocumentRuntimeChannel<DocumentStateRegistryV1>(
        target.ownerDocument,
        documentStateRegistryChannel,
        () => ({ targets: new WeakMap(), version: 1 }),
      );
      registry.targets.delete(target);
    }
  };

  destroyRef.onDestroy(release);

  return {
    isActive: (): boolean => !claim.released && channel.active === erasedClaim,
    refresh: (): void => {
      if (!claim.released && channel.active === erasedClaim && claim.snapshot !== undefined) {
        claim.apply(claim.snapshot);
      }
    },
  };
}

export interface KrnElementStateSnapshot {
  readonly attributes: ReadonlyMap<string, string | null>;
  readonly hadStyleAttribute: boolean;
  readonly styles: ReadonlyMap<
    string,
    { readonly priority: string; readonly value: string } | null
  >;
}

function hasInlineStyle(style: CSSStyleDeclaration, property: string): boolean {
  for (let index = 0; index < style.length; index += 1) {
    if (style.item(index) === property) return true;
  }
  return false;
}

export function captureKrnElementState(
  element: HTMLElement,
  attributes: readonly string[],
  styles: readonly string[] = [],
): KrnElementStateSnapshot {
  return {
    attributes: new Map(attributes.map((name) => [name, element.getAttribute(name)] as const)),
    hadStyleAttribute: element.hasAttribute('style'),
    styles: new Map(
      styles.map((property) => [
        property,
        hasInlineStyle(element.style, property)
          ? {
              priority: element.style.getPropertyPriority(property),
              value: element.style.getPropertyValue(property),
            }
          : null,
      ]),
    ),
  };
}

export function restoreKrnElementState(
  element: HTMLElement,
  snapshot: KrnElementStateSnapshot,
): void {
  for (const [name, value] of snapshot.attributes) {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }

  for (const [property, state] of snapshot.styles) {
    if (state) element.style.setProperty(property, state.value, state.priority);
    else element.style.removeProperty(property);
  }

  if (snapshot.styles.size > 0) {
    if (!snapshot.hadStyleAttribute && element.style.length === 0) {
      element.removeAttribute('style');
    } else if (snapshot.hadStyleAttribute && !element.hasAttribute('style')) {
      element.setAttribute('style', '');
    }
  }
}
