import type { KrnSize } from '../actions/action-types';

export type KrnControlSize = KrnSize;

export type KrnControlState = 'default' | 'invalid' | 'valid' | 'pending';

export type KrnInputMode =
  'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';

export interface KrnSelectOption<T = string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export interface KrnSegmentOption<T = string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface KrnDateRangeValue {
  readonly start: string;
  readonly end: string;
}

export interface KrnRangeValue {
  readonly start: number;
  readonly end: number;
}

export interface KrnUploadRejection {
  readonly file: File;
  readonly reason: 'type' | 'size' | 'count';
  readonly message: string;
}

export type KrnAutocompleteMode = 'list' | 'both' | 'inline' | 'none';
