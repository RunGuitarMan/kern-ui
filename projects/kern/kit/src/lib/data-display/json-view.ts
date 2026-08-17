import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { KRN_PLATFORM } from '@kern-ui/angular/cdk';

export type KrnJsonPrimitive = string | number | boolean | null;
export type KrnJsonValue =
  KrnJsonPrimitive | readonly KrnJsonValue[] | { readonly [key: string]: KrnJsonValue };

type KrnJsonKind = 'array' | 'object' | 'string' | 'number' | 'boolean' | 'null' | 'circular';

interface KrnJsonNode {
  readonly type: 'node';
  readonly id: string;
  readonly path: string;
  readonly parentPath: string | null;
  readonly key: string | null;
  readonly value: unknown;
  readonly kind: KrnJsonKind;
  readonly level: number;
  readonly index: number;
  readonly setSize: number;
  readonly expandable: boolean;
  readonly childCount: number;
}

interface KrnJsonClosingLine {
  readonly type: 'closing';
  readonly id: string;
  readonly level: number;
  readonly bracket: '}' | ']';
}

type KrnJsonLine = KrnJsonNode | KrnJsonClosingLine;

interface KrnJsonSegment {
  readonly value: string;
  readonly highlighted: boolean;
}

const jsonPointerSegment = (value: string): string =>
  value.replaceAll('~', '~0').replaceAll('/', '~1');

const nodeKind = (value: unknown): KrnJsonKind => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
};

const isExpandable = (value: unknown): value is readonly unknown[] | Record<string, unknown> =>
  value !== null && typeof value === 'object';

const entriesFor = (value: unknown, sortKeys: boolean): readonly [string, unknown][] => {
  if (Array.isArray(value)) return value.map((item, index) => [String(index), item]);
  if (!isExpandable(value)) return [];
  const entries = Object.entries(value);
  return sortKeys ? entries.sort(([left], [right]) => left.localeCompare(right)) : entries;
};

const displayPrimitive = (node: KrnJsonNode): string => {
  if (node.kind === 'string') return JSON.stringify(String(node.value));
  if (node.kind === 'null') return 'null';
  if (node.kind === 'circular') return '"[Circular]"';
  return String(node.value);
};

@Component({
  selector: 'krn-json-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-wrap]': 'wrap()',
  },
  templateUrl: './json-view.html',
  styleUrl: './json-view.css',
})
export class KrnJsonView {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(KRN_PLATFORM);
  private readonly internalExpanded = signal<ReadonlySet<string>>(new Set());
  private previousData: KrnJsonValue | undefined;
  private previousDepth = Number.NaN;

  /** JSON-compatible value rendered as an inspectable hierarchy. */
  readonly data = input.required<KrnJsonValue>();
  /** Accessible name announced for the JSON tree. */
  readonly ariaLabel = input('JSON');
  /** Number of hierarchy levels expanded when data first renders. */
  readonly defaultExpandDepth = input(2, { transform: numberAttribute });
  /** Controlled JSON-pointer paths, or null to keep expansion state internal. */
  readonly expandedPaths = model<readonly string[] | null>(null);
  /** Text or regular expression highlighted in visible keys and primitive values. */
  readonly highlightPattern = input<string | RegExp | null>(null);
  /** Sorts object keys with locale-aware comparison while preserving array order. */
  readonly sortKeys = input(false, { transform: booleanAttribute });
  /** Allows long keys and values to wrap inside the viewport. */
  readonly wrap = input(true, { transform: booleanAttribute });

  protected readonly activePath = signal('$');
  protected readonly expanded = computed(
    () => new Set(this.expandedPaths() ?? this.internalExpanded()),
  );
  protected readonly lines = computed<readonly KrnJsonLine[]>(() =>
    this.buildLines(this.data(), this.expanded(), this.sortKeys()),
  );
  private readonly nodes = computed(() =>
    this.lines().filter((line): line is KrnJsonNode => line.type === 'node'),
  );

  constructor() {
    effect(() => {
      const data = this.data();
      const depth = Math.max(0, this.defaultExpandDepth());
      if (data === this.previousData && depth === this.previousDepth) return;
      this.previousData = data;
      this.previousDepth = depth;
      this.internalExpanded.set(this.defaultExpandedPaths(data, depth));
      this.activePath.set('$');
    });

    effect(() => {
      const nodes = this.nodes();
      if (nodes.some((node) => node.path === this.activePath())) return;
      this.activePath.set(nodes[0]?.path ?? '$');
    });
  }

  protected isExpanded(node: KrnJsonNode): boolean {
    return node.expandable && this.expanded().has(node.path);
  }

  protected openingBracket(node: KrnJsonNode): '{' | '[' {
    return node.kind === 'array' ? '[' : '{';
  }

  protected closingBracket(node: KrnJsonNode): '}' | ']' {
    return node.kind === 'array' ? ']' : '}';
  }

  protected primitive(node: KrnJsonNode): string {
    return displayPrimitive(node);
  }

  protected segments(value: string): readonly KrnJsonSegment[] {
    const pattern = this.highlightPattern();
    if (!pattern) return [{ value, highlighted: false }];
    const expression =
      typeof pattern === 'string'
        ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        : new RegExp(
            pattern.source,
            pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
          );
    const segments: KrnJsonSegment[] = [];
    let cursor = 0;
    for (const match of value.matchAll(expression)) {
      const index = match.index ?? 0;
      if (index > cursor) segments.push({ value: value.slice(cursor, index), highlighted: false });
      if (match[0]) segments.push({ value: match[0], highlighted: true });
      cursor = index + Math.max(1, match[0]?.length ?? 0);
    }
    if (cursor < value.length) segments.push({ value: value.slice(cursor), highlighted: false });
    return segments.length ? segments : [{ value, highlighted: false }];
  }

  protected toggle(node: KrnJsonNode): void {
    if (!node.expandable) return;
    const next = new Set(this.expanded());
    if (next.has(node.path)) next.delete(node.path);
    else next.add(node.path);
    const value = Object.freeze([...next]);
    if (this.expandedPaths() === null) this.internalExpanded.set(new Set(value));
    else this.expandedPaths.set(value);
  }

  protected activate(event: MouseEvent, node: KrnJsonNode): void {
    this.activePath.set(node.path);
    (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const nodes = this.nodes();
    const index = nodes.findIndex((node) => node.path === this.activePath());
    const current = nodes[index];
    if (!current) return;
    let nextPath: string | null = null;

    if (event.key === 'ArrowDown')
      nextPath = nodes[Math.min(nodes.length - 1, index + 1)]?.path ?? null;
    else if (event.key === 'ArrowUp') nextPath = nodes[Math.max(0, index - 1)]?.path ?? null;
    else if (event.key === 'Home') nextPath = nodes[0]?.path ?? null;
    else if (event.key === 'End') nextPath = nodes.at(-1)?.path ?? null;
    else if (event.key === 'ArrowRight' && current.expandable) {
      if (!this.isExpanded(current)) this.toggle(current);
      else nextPath = nodes[index + 1]?.path ?? null;
    } else if (event.key === 'ArrowLeft') {
      if (this.isExpanded(current)) this.toggle(current);
      else nextPath = current.parentPath;
    } else if ((event.key === 'Enter' || event.key === ' ') && current.expandable) {
      this.toggle(current);
    } else {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (nextPath) this.moveFocus(nextPath);
  }

  private moveFocus(path: string): void {
    this.activePath.set(path);
    this.platform.queueMicrotask(() => {
      const target = [
        ...this.host.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]'),
      ].find((element) => element.dataset['jsonPath'] === path);
      target?.focus({ preventScroll: true });
    });
  }

  private defaultExpandedPaths(data: KrnJsonValue, depth: number): ReadonlySet<string> {
    const paths = new Set<string>();
    const visit = (
      value: unknown,
      path: string,
      level: number,
      ancestors: ReadonlySet<object>,
    ): void => {
      if (!isExpandable(value) || level >= depth || ancestors.has(value)) return;
      paths.add(path);
      const nextAncestors = new Set(ancestors).add(value);
      for (const [key, child] of entriesFor(value, this.sortKeys())) {
        visit(child, `${path}/${jsonPointerSegment(key)}`, level + 1, nextAncestors);
      }
    };
    visit(data, '$', 0, new Set());
    return paths;
  }

  private buildLines(
    data: KrnJsonValue,
    expanded: ReadonlySet<string>,
    sortKeys: boolean,
  ): readonly KrnJsonLine[] {
    const lines: KrnJsonLine[] = [];
    const visit = (
      value: unknown,
      path: string,
      parentPath: string | null,
      key: string | null,
      level: number,
      index: number,
      setSize: number,
      ancestors: ReadonlySet<object>,
    ): void => {
      const circular = isExpandable(value) && ancestors.has(value);
      const kind = circular ? 'circular' : nodeKind(value);
      const children = circular ? [] : entriesFor(value, sortKeys);
      const expandable = !circular && isExpandable(value);
      const node: KrnJsonNode = {
        type: 'node',
        id: path,
        path,
        parentPath,
        key,
        value,
        kind,
        level,
        index,
        setSize,
        expandable,
        childCount: children.length,
      };
      lines.push(node);
      if (!expandable || !expanded.has(path)) return;
      const nextAncestors = new Set(ancestors).add(value as object);
      children.forEach(([childKey, child], childIndex) =>
        visit(
          child,
          `${path}/${jsonPointerSegment(childKey)}`,
          path,
          childKey,
          level + 1,
          childIndex,
          children.length,
          nextAncestors,
        ),
      );
      lines.push({
        type: 'closing',
        id: `${path}::closing`,
        level,
        bracket: kind === 'array' ? ']' : '}',
      });
    };
    visit(data, '$', null, null, 1, 0, 1, new Set());
    return lines;
  }
}
