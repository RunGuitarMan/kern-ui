import type { KrnBreakpoint, KrnSpace } from '@kern-ui/angular/core';

export type KrnLayoutSpace = KrnSpace | number | (string & {});
export type KrnLayoutAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type KrnLayoutJustification =
  'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type KrnLayoutAxis = 'horizontal' | 'vertical';
export type KrnResponsiveBreakpoint = KrnBreakpoint | 'none';

const SPACE_TOKENS = new Set([
  '0',
  'px',
  '0.5',
  '1',
  '1.5',
  '2',
  '3',
  '4',
  '5',
  '6',
  '8',
  '10',
  '12',
  '16',
  '20',
  '24',
]);

export function krnCssLength(value: KrnLayoutSpace | null | undefined, fallback = '0'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (SPACE_TOKENS.has(value)) {
    return `var(--krn-space-${value.replace('.', '-')})`;
  }
  return value;
}
