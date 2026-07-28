import { TemplateRef } from '@angular/core';
import type { Type } from '@angular/core';

/**
 * Content accepted by composable Kern APIs.
 *
 * Components should narrow this union deliberately and document which context
 * is passed to templates. Plain strings remain the preferred accessible default.
 */
export type KrnContent<TContext = void, TComponent extends object = object> =
  string | TemplateRef<TContext> | Type<TComponent>;

/** Standard template context for item-based components such as Select or Grid. */
export interface KrnItemContentContext<TItem, TMeta = undefined> {
  readonly $implicit: TItem;
  readonly item: TItem;
  readonly index: number;
  readonly meta: TMeta;
}

export function isKrnTemplateContent<TContext>(
  content: KrnContent<TContext>,
): content is TemplateRef<TContext> {
  return content instanceof TemplateRef;
}

export function isKrnComponentContent<TComponent extends object>(
  content: KrnContent<unknown, TComponent>,
): content is Type<TComponent> {
  return typeof content === 'function';
}
