/**
 * State of a branch whose children are supplied asynchronously.
 *
 * Omit the state for a leaf or a branch whose `children` are already the
 * complete source of truth. Use `idle` before the first request, `loading`
 * while a request is in flight, and `error` to expose a retryable failure.
 */
export type KrnTreeChildrenState = 'idle' | 'loading' | 'error';
