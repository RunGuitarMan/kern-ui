import { HarnessPredicate } from '@angular/cdk/testing';
import type { TestElement } from '@angular/cdk/testing';

export type KrnHarnessText = string | RegExp;

function booleanAttributeValue(value: string | null): boolean {
  return value !== null && value !== 'false';
}

async function textMatches(
  value: Promise<string | null> | string | null,
  pattern: KrnHarnessText,
): Promise<boolean> {
  return HarnessPredicate.stringMatches(value, pattern);
}

async function optionalText(
  element: Promise<TestElement | null>,
  options?: { exclude?: string },
): Promise<string | null> {
  const resolved = await element;
  return resolved ? resolved.text(options) : null;
}

async function allText(
  elements: Promise<readonly TestElement[]>,
  options?: { exclude?: string },
): Promise<readonly string[]> {
  return Promise.all((await elements).map((element) => element.text(options)));
}

/** Shared predicates used by Kern component harnesses. */
export const KrnHarnessUtilities = {
  allText,
  booleanAttributeValue,
  optionalText,
  textMatches,
} as const;
