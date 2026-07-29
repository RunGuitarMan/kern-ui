import type { TemplateRef } from '@angular/core';
import type { KrnTreeChildrenState } from './tree.types';

export type KrnNavigationOrientation = 'horizontal' | 'vertical';

export interface KrnBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
  readonly disabled?: boolean;
}

export interface KrnTabItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly badge?: string | number;
  readonly content?: TemplateRef<unknown>;
}

export interface KrnStepItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly optional?: boolean;
  readonly disabled?: boolean;
  readonly error?: string;
}

export interface KrnNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly icon?: string;
  readonly badge?: string | number;
}

export interface KrnContextMenuItem extends KrnNavigationItem {
  readonly children?: readonly KrnContextMenuItem[];
  readonly shortcut?: string;
}

export interface KrnTreeNavigationItem extends KrnNavigationItem {
  readonly children?: readonly KrnTreeNavigationItem[];
  /** Describes an expandable navigation item whose children are loaded by the consumer. */
  readonly childrenState?: KrnTreeChildrenState;
}

export interface KrnCommandItem extends KrnNavigationItem {
  readonly group?: string;
  readonly keywords?: readonly string[];
  readonly shortcut?: string;
}

export interface KrnTocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: 2 | 3 | 4;
}
