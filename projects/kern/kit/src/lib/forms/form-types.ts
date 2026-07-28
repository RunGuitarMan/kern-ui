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

export interface KrnSelectOptionContext<T> {
  readonly $implicit: KrnSelectOption<T>;
  readonly option: KrnSelectOption<T>;
  readonly selected: boolean;
}

export type KrnIdentityMatcher<T> = (left: T, right: T) => boolean;

export type KrnOptionStringifier<T> = (option: KrnSelectOption<T>) => string;

export type KrnOptionTrackBy<T> = (option: KrnSelectOption<T>, index: number) => unknown;

export type KrnOptionDisabledHandler<T> = (option: KrnSelectOption<T>) => boolean;

export interface KrnSegmentOption<T = string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface KrnSegmentOptionContext<T> {
  readonly $implicit: KrnSegmentOption<T>;
  readonly option: KrnSegmentOption<T>;
  readonly selected: boolean;
}

export type KrnSegmentDisabledHandler<T> = (option: KrnSegmentOption<T>) => boolean;

export type KrnSegmentTrackBy<T> = (option: KrnSegmentOption<T>, index: number) => unknown;

export interface KrnDatePickerLabels {
  readonly chooseDate: string;
  readonly chooseDateRange: string;
  readonly selectDate: string;
  readonly selectDateRange: string;
  readonly endDate: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly clear: string;
  readonly today: string;
  readonly done: string;
  readonly notSelected: string;
  readonly chooseStartDate: string;
  readonly chooseEndDate: string;
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
