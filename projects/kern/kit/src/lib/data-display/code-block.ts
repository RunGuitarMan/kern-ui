import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';

type KrnCodeTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'literal'
  | 'number'
  | 'decorator'
  | 'tag'
  | 'attribute'
  | 'type'
  | 'operator'
  | 'punctuation';

interface KrnCodeToken {
  readonly value: string;
  readonly kind: KrnCodeTokenKind;
}

const codeKeywords = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'constructor',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'get',
  'if',
  'implements',
  'import',
  'in',
  'infer',
  'interface',
  'keyof',
  'let',
  'new',
  'of',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'satisfies',
  'set',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'type',
  'typeof',
  'undefined',
  'using',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

const codeTokenPattern =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`|<\/?[A-Za-z][\w.-]*|(?:\[\(|\[\*|\[|\(|#)[A-Za-z_][\w.-]*(?:\)\]|\]|\))(?=\s*=)|@[A-Za-z_$][\w$]*|\b[A-Za-z_$][\w$]*\b|\b\d+(?:\.\d+)?\b|=>|===?|!==?|&&|\|\||\?\?|[+\-*/%<>!&|?=]+|[{}()[\],.;:])/gm;

function highlightCode(source: string, language: string): readonly KrnCodeToken[] {
  const normalizedLanguage = language.toLowerCase();
  if (!/(?:angular|html|typescript|ts|javascript|js|tsx|jsx)/.test(normalizedLanguage)) {
    return [{ value: source, kind: 'plain' }];
  }

  const tokens: KrnCodeToken[] = [];
  let cursor = 0;
  for (const match of source.matchAll(codeTokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ value: source.slice(cursor, index), kind: 'plain' });
    const value = match[0];
    tokens.push({ value, kind: codeTokenKind(value) });
    cursor = index + value.length;
  }
  if (cursor < source.length) tokens.push({ value: source.slice(cursor), kind: 'plain' });
  return tokens;
}

function codeTokenKind(value: string): KrnCodeTokenKind {
  if (/^(?:\/[/*]|<!--)/.test(value)) return 'comment';
  if (/^['"`]/.test(value)) return 'string';
  if (/^<\/?[A-Za-z]/.test(value)) return 'tag';
  if (/^@/.test(value)) return 'decorator';
  if (/^(?:\[\(|\[\*|\[|\(|#).+(?:\)\]|\]|\))$/.test(value)) return 'attribute';
  if (/^\d/.test(value)) return 'number';
  if (/^(?:true|false|null|undefined|NaN)$/.test(value)) return 'literal';
  if (codeKeywords.has(value)) return 'keyword';
  if (/^[A-Z][\w$]*$/.test(value)) return 'type';
  if (/^(?:=>|===?|!==?|&&|\|\||\?\?|[+\-*/%<>!&|?=]+)$/.test(value)) return 'operator';
  if (/^[{}()[\],.;:]$/.test(value)) return 'punctuation';
  return 'plain';
}

@Component({
  selector: 'krn-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <span>{{ displayLanguage() }}</span>
      <button
        type="button"
        (click)="copy()"
        [attr.aria-label]="translations.dataDisplay.copyCode(displayLanguage())"
      >
        {{ copied() ? translations.dataDisplay.copied : translations.dataDisplay.copy }}
      </button>
    </div>
    <pre
      tabindex="0"
    ><code>@for (token of highlightedTokens(); track $index) {<span [class]="'token token-' + token.kind">{{ token.value }}</span>}</code></pre>
    <span class="sr-only" aria-live="polite">{{
      copied() ? translations.dataDisplay.codeCopied : ''
    }}</span>
  `,
  styles: `
    :host {
      --_code-surface: var(--krn-color-surface-sunken, #f5f5f6);
      --_code-header: var(--krn-color-surface-subtle, #fafafa);
      --_code-border: var(--krn-color-border, #dedee2);
      --_code-text: var(--krn-color-text, #1d1d1f);
      --_code-muted: var(--krn-color-text-muted, #66666d);
      --_code-action: var(--krn-color-link, #3154c8);
      --_code-action-hover: var(--krn-color-surface-raised, #fff);
      --_syntax-comment: var(--krn-color-text-muted, #66666d);
      --_syntax-string: var(--krn-color-success, #207a4b);
      --_syntax-keyword: var(--krn-color-primary, #3154c8);
      --_syntax-literal: var(--krn-color-warning, #7b5511);
      --_syntax-number: var(--krn-color-warning, #7b5511);
      --_syntax-decorator: var(--krn-color-danger, #a42f46);
      --_syntax-tag: var(--krn-color-danger, #a42f46);
      --_syntax-attribute: var(--krn-color-primary, #3154c8);
      --_syntax-type: var(--krn-color-info, #275ca8);
      --_syntax-operator: var(--krn-color-text-muted, #66666d);
      display: block;
      min-inline-size: 0;
      max-inline-size: 100%;
      overflow: clip;
      border: var(--krn-border-width-1, 1px) solid var(--_code-border);
      border-radius: var(--krn-radius-surface, 0.75rem);
      color: var(--_code-text);
      background: var(--_code-surface);
      box-shadow: var(--krn-shadow-sm, 0 1px 3px rgb(0 0 0 / 10%));
    }
    .bar {
      display: flex;
      min-block-size: 2.5rem;
      align-items: center;
      justify-content: space-between;
      padding-inline: 0.875rem;
      border-block-end: var(--krn-border-width-1, 1px) solid var(--_code-border);
      color: var(--_code-muted);
      background: var(--_code-header);
      font:
        550 0.75rem/1 var(--krn-font-family-mono, ui-monospace),
        monospace;
    }
    button {
      min-block-size: 1.75rem;
      padding-inline: 0.5rem;
      border: 0;
      border-radius: 0.3125rem;
      color: var(--_code-action);
      background: transparent;
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      color: var(--krn-color-primary-hover, var(--_code-action));
      background: var(--_code-action-hover);
    }
    button:focus-visible,
    pre:focus-visible {
      outline: var(--krn-focus-ring-width, 2px) solid var(--krn-color-focus, #3154c8);
      outline-offset: -3px;
    }
    pre {
      max-block-size: var(--krn-code-max-height, 28rem);
      margin: 0;
      padding: 1.125rem;
      overflow: auto;
      font:
        0.8125rem/1.65 var(--krn-font-family-mono, ui-monospace),
        SFMono-Regular,
        Consolas,
        monospace;
      font-variant-ligatures: none;
      tab-size: 2;
    }
    code {
      white-space: pre;
    }
    .token-comment {
      color: var(--_syntax-comment);
      font-style: italic;
    }
    .token-string {
      color: var(--_syntax-string);
    }
    .token-keyword {
      color: var(--_syntax-keyword);
    }
    .token-literal {
      color: var(--_syntax-literal);
    }
    .token-number {
      color: var(--_syntax-number);
    }
    .token-decorator {
      color: var(--_syntax-decorator);
    }
    .token-tag {
      color: var(--_syntax-tag);
    }
    .token-attribute {
      color: var(--_syntax-attribute);
    }
    .token-type {
      color: var(--_syntax-type);
    }
    .token-operator,
    .token-punctuation {
      color: var(--_syntax-operator);
    }
    ::selection {
      color: var(--_code-text);
      background: var(--krn-color-selection, rgb(49 84 200 / 24%));
    }
    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class KrnCodeBlock {
  private readonly clipboard = inject(Clipboard);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  readonly code = input.required<string>();
  readonly language = input('text');
  readonly languageLabel = input('');
  readonly copied = model(false);
  protected readonly displayLanguage = computed(
    () =>
      this.languageLabel() ||
      (this.language().toLocaleLowerCase() === 'text'
        ? this.translations.dataDisplay.plainText
        : this.language()),
  );
  protected readonly highlightedTokens = computed(() =>
    highlightCode(this.code(), this.language()),
  );

  protected copy(): void {
    if (!this.clipboard.copy(this.code())) return;
    this.copied.set(true);
  }
}

@Component({
  selector: 'krn-keyboard-shortcut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'label()',
  },
  template: `
    @for (key of keys(); track $index) {
      <kbd>{{ key }}</kbd>
      @if (!$last) {
        <span aria-hidden="true">+</span>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--krn-color-text-muted, #626a76);
      font-size: 0.6875rem;
    }
    kbd {
      min-inline-size: 1.375rem;
      padding: 0.125rem 0.3125rem;
      border: 1px solid var(--krn-color-border, #cdd1d7);
      border-block-end-width: 2px;
      border-radius: 0.25rem;
      color: var(--krn-color-text, #252932);
      background: var(--krn-color-surface-raised, #f2f3f5);
      font:
        600 0.6875rem/1rem ui-monospace,
        monospace;
      text-align: center;
    }
  `,
})
export class KrnKeyboardShortcut {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly keys = input.required<readonly string[]>();
  protected readonly label = computed(() =>
    this.translations.dataDisplay.keyboardShortcut(this.keys()),
  );
}
