export interface KrnSearchResult {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly keywords?: readonly string[];
}

export interface KrnNotification {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly timestamp: string;
  /** Optional ISO 8601 date or date-time for the rendered `<time datetime>` attribute. */
  readonly dateTime?: string;
  readonly read: boolean;
  readonly tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

export interface KrnFilterOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
}

export interface KrnFilterDefinition {
  readonly id: string;
  readonly label: string;
  readonly options: readonly KrnFilterOption[];
}
