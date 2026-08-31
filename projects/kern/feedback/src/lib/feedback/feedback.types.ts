export type KrnFeedbackTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type KrnToastPosition =
  'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
export type KrnToastPauseReason = 'focus' | 'pointer';

export interface KrnToastOptions {
  readonly title?: string;
  readonly tone?: KrnFeedbackTone;
  readonly duration?: number;
  /** Keeps the toast present until explicitly dismissed. */
  /** Keeps the toast visible until the user dismisses it or application code removes it. */
  readonly preserve?: boolean;
  readonly dismissible?: boolean;
  readonly actionLabel?: string;
  readonly action?: () => void;
}

export interface KrnToastRecord extends KrnToastOptions {
  readonly id: string;
  readonly message: string;
  readonly createdAt: number;
}

/**
 * Declarative overlay close source. `escape` also represents the platform close
 * request (for example Android Back or an assistive-technology dismiss gesture).
 */
export type KrnOverlayCloseReason = 'api' | 'escape' | 'outside' | 'action';
/**
 * Drawer entry edge. Physical names are convenient for application UI; logical
 * names remain available for writing-mode-aware layouts.
 */
export type KrnOverlaySide =
  'top' | 'right' | 'bottom' | 'left' | 'block-start' | 'inline-end' | 'block-end' | 'inline-start';
export type KrnOverlayPosition = 'center' | KrnOverlaySide;
export type KrnOverlaySize = 'sm' | 'md' | 'lg';
