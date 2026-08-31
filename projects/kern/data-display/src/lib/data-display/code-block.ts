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
  templateUrl: './code-block.html',
  styleUrl: './code-block.css',
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
  templateUrl: './keyboard-shortcut.html',
  styleUrl: './keyboard-shortcut.css',
})
export class KrnKeyboardShortcut {
  private readonly translations = inject(KRN_TRANSLATIONS);
  readonly keys = input.required<readonly string[]>();
  protected readonly label = computed(() =>
    this.translations.dataDisplay.keyboardShortcut(this.keys()),
  );
}
