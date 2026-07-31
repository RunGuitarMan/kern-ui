function parseSelector(selector) {
  const source = selector.trim();
  const elementMatch = /^([A-Za-z][\w:-]*)/.exec(source);
  const element = elementMatch?.[1] ?? null;
  let cursor = elementMatch?.[0].length ?? 0;
  const attributes = [];

  while (cursor < source.length) {
    const match =
      /^\[\s*([A-Za-z_][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]/.exec(
        source.slice(cursor),
      );
    if (!match) {
      throw new Error(
        `Unsupported Angular selector ${JSON.stringify(selector)}. ` +
          'Only an optional element and attribute selectors are supported.',
      );
    }
    attributes.push({
      name: match[1],
      value: match[2] ?? match[3] ?? match[4] ?? null,
    });
    cursor += match[0].length;
  }

  if (!element && attributes.length === 0) {
    throw new Error(`Angular selector cannot be empty: ${JSON.stringify(selector)}.`);
  }
  return { element, attributes };
}

function openingTagEnd(source, start, end) {
  let quote = null;
  for (let index = start; index < end; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '>') return index;
  }
  return -1;
}

function openingTagAttributes(openingTag, tagName) {
  const attributes = new Map();
  let cursor = tagName.length + 1;

  while (cursor < openingTag.length) {
    while (/\s/.test(openingTag[cursor] ?? '')) cursor += 1;
    if (openingTag[cursor] === '/' || openingTag[cursor] === '>') break;

    const nameStart = cursor;
    const openingBracket = openingTag[cursor];
    const closingBracket = openingBracket === '[' ? ']' : openingBracket === '(' ? ')' : undefined;
    if (closingBracket) {
      const closingIndex = openingTag.indexOf(closingBracket, cursor + 1);
      if (closingIndex < 0) break;
      cursor = closingIndex + 1;
    } else {
      while (cursor < openingTag.length && !/[\s=/>]/.test(openingTag[cursor] ?? '')) {
        cursor += 1;
      }
    }

    const sourceName = openingTag.slice(nameStart, cursor);
    const name =
      sourceName.startsWith('[') && sourceName.endsWith(']') ? sourceName.slice(1, -1) : sourceName;
    while (/\s/.test(openingTag[cursor] ?? '')) cursor += 1;

    let value = null;
    if (openingTag[cursor] === '=') {
      cursor += 1;
      while (/\s/.test(openingTag[cursor] ?? '')) cursor += 1;
      const quote = openingTag[cursor];
      if (quote === '"' || quote === "'") {
        const valueStart = ++cursor;
        while (cursor < openingTag.length && openingTag[cursor] !== quote) cursor += 1;
        value = openingTag.slice(valueStart, cursor);
        if (openingTag[cursor] === quote) cursor += 1;
      } else {
        const valueStart = cursor;
        while (cursor < openingTag.length && !/[\s>]/.test(openingTag[cursor] ?? '')) cursor += 1;
        value = openingTag.slice(valueStart, cursor);
      }
    }
    attributes.set(name, value);
  }

  return attributes;
}

/**
 * Finds the opening tag that matches a simple Angular component/directive selector.
 *
 * Catalog selectors deliberately use the subset emitted by Angular declarations:
 * an optional element plus one or more attribute selectors, for example
 * `krn-dialog`, `[krnTooltip]`, or `button[krnIconButton]`.
 */
export function findAngularSelectorStart(source, selector, start = 0, end = source.length) {
  const parsedSelector = parseSelector(selector);
  const tagPattern = /<([A-Za-z][\w:-]*)(?=[\s/>])/g;
  tagPattern.lastIndex = Math.max(0, start);

  for (let match = tagPattern.exec(source); match; match = tagPattern.exec(source)) {
    if (match.index >= end) break;
    const tagName = match[1];
    if (parsedSelector.element && tagName !== parsedSelector.element) continue;

    const tagEnd = openingTagEnd(source, match.index + match[0].length, end);
    if (tagEnd < 0) continue;
    const attributes = openingTagAttributes(source.slice(match.index, tagEnd + 1), tagName);
    const matchesAttributes = parsedSelector.attributes.every(({ name, value }) => {
      if (!attributes.has(name)) return false;
      return value === null || attributes.get(name) === value;
    });
    if (matchesAttributes) return match.index;
  }

  return -1;
}
