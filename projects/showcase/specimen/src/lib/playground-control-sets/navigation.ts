import {
  boolean,
  disabled,
  fixtureBinding,
  modelBinding,
  number,
  placeholder,
  select,
  text,
  type KernPlaygroundControl,
} from '../playground-foundation';

export const NAVIGATION_CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> = {
  breadcrumbs: [
    number('maxItems', 'Maximum items', 5, 'Controls when middle breadcrumbs collapse.', 2, 12),
  ],
  stepper: [
    number(
      'activeStep',
      'Active step',
      1,
      'Changes the currently active step.',
      0,
      2,
      1,
      modelBinding('activeStep'),
    ),
  ],
  menu: [boolean('open', 'Open', false, 'Opens the navigation menu.', modelBinding('open'))],
  menubar: [
    select(
      'itemState',
      'Item state',
      'default',
      'Changes the deterministic menubar item fixture.',
      ['default', 'current', 'disabled'],
      fixtureBinding('data', 'Selects current and disabled item records in the menubar fixture.'),
    ),
  ],
  'context-menu': [
    boolean(
      'open',
      'Open',
      false,
      'Opens the context-menu fixture.',
      fixtureBinding(
        'interaction',
        'Invokes the documented context-menu trigger because open is interaction-owned.',
      ),
    ),
  ],
  'tree-navigation': [
    select(
      'selected',
      'Selected item',
      'automations',
      'Changes the selected navigation node.',
      ['overview', 'automations', 'archive'],
      modelBinding('selectedId'),
    ),
  ],
  'bottom-navigation': [
    select(
      'selected',
      'Selected item',
      'overview',
      'Changes the active bottom-navigation destination.',
      ['overview', 'activity', 'reports'],
      modelBinding('value'),
    ),
  ],
  'command-palette': [
    boolean('open', 'Open', false, 'Opens the command palette.', modelBinding('open')),
    text('query', 'Query', '', 'Changes the active command query.', modelBinding('query')),
    text(
      'placeholder',
      'Placeholder',
      'Search commands…',
      'Uses locale-aware command search copy until explicitly changed.',
    ),
    text(
      'closeShortcut',
      'Close shortcut',
      'Esc',
      'Uses the locale-aware close shortcut until explicitly changed.',
    ),
  ],
  'table-of-contents': [
    select(
      'active',
      'Active section',
      'specimen-overview',
      'Changes the active table-of-contents entry.',
      ['specimen-overview', 'specimen-api', 'specimen-a11y'],
      modelBinding('activeId'),
    ),
  ],
  'back-button': [text('label', 'Label', 'Back to components', 'Changes the back-button label.')],
  'skip-link': [
    text(
      'label',
      'Label',
      'Skip specimen navigation',
      'Changes the visible-on-focus skip-link label.',
    ),
  ],
  tabs: [
    select(
      'orientation',
      'Orientation',
      'horizontal',
      'Changes visual layout and arrow-key behavior.',
      ['horizontal', 'vertical'],
    ),
    select(
      'selected',
      'Selected tab',
      'overview',
      'Chooses the active tab panel.',
      ['overview', 'activity', 'settings'],
      modelBinding('value'),
    ),
  ],
  'vertical-tabs': [
    select(
      'selected',
      'Selected tab',
      'overview',
      'Chooses the active tab panel.',
      ['overview', 'activity', 'settings'],
      modelBinding('value'),
    ),
  ],
  pagination: [
    number('totalItems', 'Total items', 248, 'Sets the result count.', 0, 100_000),
    number('pageSize', 'Page size', 20, 'Sets results per page.', 1, 1_000),
    number('siblingCount', 'Sibling pages', 1, 'Sets pages shown beside the current page.', 0, 4),
    number('page', 'Current page', 1, 'Controls the active page.', 1, 13, 1, modelBinding('page')),
  ],
};
