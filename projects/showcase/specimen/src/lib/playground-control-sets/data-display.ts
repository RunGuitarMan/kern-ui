import {
  boolean,
  disabled,
  displayTone,
  fixtureBinding,
  loading,
  modelBinding,
  number,
  range,
  select,
  text,
  type KernPlaygroundControl,
} from '../playground-foundation';

export const DATA_DISPLAY_CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> =
  {
    avatar: [
      boolean(
        'imageFailed',
        'Image fallback',
        false,
        'Shows the deterministic initials fallback.',
        modelBinding('imageFailed'),
      ),
    ],
    'avatar-group': [
      text('overlap', 'Overlap', '0.625rem', 'Changes how far adjacent avatars overlap.'),
    ],
    stat: [
      select('trend', 'Trend', 'up', 'Changes the trend indicator.', ['flat', 'up', 'down']),
      text('detail', 'Detail', '+12.4% this quarter', 'Adds context for the statistic.'),
      text('label', 'Label', 'Active workspaces', 'Names the statistic.'),
      text('value', 'Value', '2,481', 'Sets the displayed statistic value.'),
    ],
    'description-list': [
      select(
        'dataState',
        'Data state',
        'ready',
        'Changes the projected description-item fixture.',
        ['ready', 'empty', 'long-text'],
        fixtureBinding('data', 'Selects populated, empty, or long-text description-item records.'),
      ),
    ],
    list: [
      select('role', 'Role', 'list', 'Switches between static-list and listbox semantics.', [
        'list',
        'listbox',
      ]),
    ],
    'list-item': [boolean('selected', 'Selected', false, 'Shows the selected list-item state.')],
    accordion: [
      boolean(
        'expanded',
        'Expanded item',
        false,
        'Expands the first disclosure in the accordion fixture.',
        fixtureBinding('interaction', 'Controls the open model of the first projected disclosure.'),
      ),
    ],
    disclosure: [
      boolean('open', 'Open', false, 'Expands the disclosure content.', modelBinding('open')),
    ],
    timeline: [
      select(
        'dataState',
        'Data state',
        'ready',
        'Changes the projected timeline-item fixture.',
        ['ready', 'empty', 'long-text'],
        fixtureBinding('data', 'Selects populated, empty, or long-text timeline items.'),
      ),
    ],
    calendar: [
      text(
        'activeMonth',
        'Active month',
        '2026-07',
        'Changes the visible ISO calendar month.',
        modelBinding('activeMonth'),
      ),
      text(
        'focusedDate',
        'Focused date',
        '',
        'Changes the roving-focus ISO date.',
        modelBinding('focusedDate'),
      ),
      text('value', 'Value', '', 'Changes the selected ISO date.', modelBinding('value')),
    ],
    'code-block': [
      select('language', 'Language', 'typescript', 'Changes the displayed language label.', [
        'typescript',
        'html',
        'css',
        'json',
      ]),
      boolean(
        'copied',
        'Copied',
        false,
        'Changes the public copied acknowledgement state.',
        modelBinding('copied'),
      ),
      text(
        'code',
        'Code',
        'const status = 1;',
        'Overrides the production-like runnable code fixture.',
      ),
    ],
    'keyboard-shortcut': [
      select(
        'platform',
        'Platform',
        'macOS',
        'Changes the projected shortcut-key fixture.',
        ['macOS', 'Windows'],
        fixtureBinding('content', 'Selects the documented key sequence rendered by the specimen.'),
      ),
    ],
    rating: [
      number('value', 'Value', 4, 'Changes the selected rating.', 0, 5, 1, modelBinding('value')),
    ],
    'responsive-media': [
      text('aspectRatio', 'Aspect ratio', '16 / 9', 'Changes the responsive media ratio.'),
    ],
    'json-view': [
      number(
        'defaultExpandDepth',
        'Expanded depth',
        2,
        'Sets how many JSON hierarchy levels open initially.',
        0,
        8,
      ),
      text(
        'highlightPattern',
        'Highlight',
        '',
        'Highlights matching text; an empty value leaves the JSON unmarked.',
      ),
      boolean('sortKeys', 'Sort keys', false, 'Sorts object keys alphabetically.'),
      boolean('wrap', 'Wrap lines', true, 'Wraps long keys and values inside the viewport.'),
    ],
    badge: [
      displayTone,
      select('variant', 'Variant', 'subtle', 'Changes badge contrast.', [
        'solid',
        'subtle',
        'outline',
      ]),
      select('size', 'Size', 'md', 'Changes badge density.', ['sm', 'md', 'lg']),
      boolean('status', 'Status marker', false, 'Shows a status dot.'),
    ],
    'status-badge': [
      select('tone', 'Tone', 'success', 'Changes the semantic status color.', [
        'neutral',
        'brand',
        'info',
        'success',
        'warning',
        'danger',
      ]),
    ],
    chip: [
      boolean('interactive', 'Interactive', true, 'Renders the label as a toggle action.'),
      boolean(
        'selected',
        'Selected',
        true,
        'Shows the selected treatment.',
        modelBinding('selected'),
      ),
      boolean('removable', 'Removable', false, 'Shows a remove action.'),
      disabled,
    ],
    tag: [
      boolean('interactive', 'Interactive', false, 'Renders the label as a toggle action.'),
      boolean(
        'selected',
        'Selected',
        false,
        'Shows the selected treatment.',
        modelBinding('selected'),
      ),
      boolean('removable', 'Removable', true, 'Shows a remove action.'),
      disabled,
    ],
    card: [
      text('eyebrow', 'Eyebrow', 'WORKSPACE / 0248', 'Sets compact contextual metadata.'),
      text('heading', 'Heading', 'Northstar', 'Sets the card heading.'),
      boolean('interactive', 'Interactive', true, 'Adds the interactive surface treatment.'),
    ],
    tree: [
      select(
        'dataState',
        'Data state',
        'ready',
        'Shows ready, loading, error, or large-tree data.',
        ['ready', 'loading', 'error', 'stress'],
        fixtureBinding('data', 'Selects the specimen node fixture; it is not a KrnTree input.'),
      ),
      text('selected', 'Selected', '', 'Changes the selected tree node.', modelBinding('selected')),
    ],
    meter: [
      range('value', 'Value', 68, 'Sets the current measured value.', 0, 100),
      number('min', 'Minimum', 0, 'Sets the lower bound.', 0, 100),
      number('max', 'Maximum', 100, 'Sets the upper bound.', 1, 1_000),
      number('low', 'Low threshold', 40, 'Sets the low-range threshold.', 0, 100),
      number('high', 'High threshold', 80, 'Sets the high-range threshold.', 0, 100),
      number('optimum', 'Optimum', 20, 'Sets the preferred value.', 0, 100),
      text('label', 'Label', 'Storage used', 'Names the meter for assistive technology.'),
    ],
  };
