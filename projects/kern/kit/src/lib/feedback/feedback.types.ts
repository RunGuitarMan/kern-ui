export type KrnFeedbackTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type KrnToastPosition =
  'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
export type KrnToastPauseReason = 'focus' | 'pointer';

export interface KrnToastOptions {
  readonly title?: string;
  readonly tone?: KrnFeedbackTone;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly actionLabel?: string;
  readonly action?: () => void;
}

export interface KrnToastRecord extends KrnToastOptions {
  readonly id: string;
  readonly message: string;
  readonly createdAt: number;
}

export type KrnOverlayCloseReason = 'api' | 'escape' | 'outside' | 'action';
export type KrnOverlayPosition = 'center' | 'inline-end' | 'bottom';
