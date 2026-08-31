import type { DestroyRef, Renderer2 } from '@angular/core';

interface KrnLoadingActivationGuard {
  readonly destroyRef: DestroyRef;
  readonly element: HTMLButtonElement;
  readonly isLoading: () => boolean;
  readonly renderer: Renderer2;
}

/**
 * Keeps a temporarily loading native action focusable while preventing both
 * consumer handlers and the button's implicit form action.
 * The returned synchronizer owns `aria-disabled` as a derived loading state
 * and must run from the host component's `ngDoCheck`, including additional
 * server render passes where the loading input itself did not change.
 *
 * This is intentionally private to the actions package. Public components
 * expose state through their own inputs instead of a second behavior API.
 */
export function registerKrnLoadingActivationGuard({
  destroyRef,
  element,
  isLoading,
  renderer,
}: KrnLoadingActivationGuard): () => void {
  const stopListening = renderer.listen(
    element,
    'click',
    (event: MouseEvent): void => {
      if (!isLoading()) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    },
    { capture: true },
  );

  destroyRef.onDestroy(() => {
    stopListening();
  });

  return (): void => {
    if (isLoading()) {
      if (element.getAttribute('aria-disabled') !== 'true') {
        renderer.setAttribute(element, 'aria-disabled', 'true');
      }

      return;
    }

    if (element.hasAttribute('aria-disabled')) {
      renderer.removeAttribute(element, 'aria-disabled');
    }
  };
}
