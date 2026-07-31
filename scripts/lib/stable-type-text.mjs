import ts from 'typescript';

const typeFormatFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.WriteArrayAsGenericType;

function unionSortKey(value) {
  if (value === 'null') return [1, value];
  if (value === 'undefined') return [2, value];
  return [0, value];
}

function compareCodePoints(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

function compactTypeText(value) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    value,
  );
  const tokens = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    tokens.push({ kind: token, text: scanner.getTokenText() });
  }

  const isWhitespace = ({ kind }) =>
    kind === ts.SyntaxKind.WhitespaceTrivia || kind === ts.SyntaxKind.NewLineTrivia;
  const previousToken = (index) => tokens.slice(0, index).findLast((token) => !isWhitespace(token));
  const nextToken = (index) => tokens.slice(index + 1).find((token) => !isWhitespace(token));
  let result = '';
  for (const [index, token] of tokens.entries()) {
    if (!isWhitespace(token)) {
      result += token.text;
      continue;
    }
    const previous = previousToken(index);
    const next = nextToken(index);
    if (
      !previous ||
      !next ||
      previous.kind === ts.SyntaxKind.OpenBracketToken ||
      next.kind === ts.SyntaxKind.CloseBracketToken
    ) {
      continue;
    }
    if (!result.endsWith(' ')) result += ' ';
  }
  return result.trim();
}

export function stableTypeText(checker, type, location) {
  const rendered = checker.typeToString(type, location, typeFormatFlags);
  if (!rendered.includes('|')) return rendered;

  const sourceFile = ts.createSourceFile(
    '__kern_stable_type.ts',
    `type __KernStableType = ${rendered};`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declaration = sourceFile.statements.find((statement) =>
    ts.isTypeAliasDeclaration(statement),
  );
  if (!declaration || sourceFile.parseDiagnostics.length > 0) return rendered;

  const printer = ts.createPrinter({ removeComments: true });
  const transformed = ts.transform(declaration.type, [
    (context) => {
      const visit = (node) => {
        const visited = ts.visitEachChild(node, visit, context);
        if (!ts.isUnionTypeNode(visited)) return visited;
        const members = [...visited.types].sort((left, right) => {
          const leftText = printer.printNode(ts.EmitHint.Unspecified, left, sourceFile);
          const rightText = printer.printNode(ts.EmitHint.Unspecified, right, sourceFile);
          const leftKey = unionSortKey(leftText);
          const rightKey = unionSortKey(rightText);
          return leftKey[0] - rightKey[0] || compareCodePoints(leftKey[1], rightKey[1]);
        });
        return ts.factory.updateUnionTypeNode(visited, members);
      };
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  try {
    return compactTypeText(
      printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0], sourceFile),
    );
  } finally {
    transformed.dispose();
  }
}
