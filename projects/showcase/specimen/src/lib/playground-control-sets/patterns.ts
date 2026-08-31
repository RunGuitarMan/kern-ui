import {
  boolean,
  fixtureBinding,
  loading,
  modelBinding,
  number,
  select,
  text,
  type KernPlaygroundControl,
} from '../playground-foundation';

export const PATTERNS_CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> = {
  'user-menu': [boolean('open', 'Open', false, 'Opens the user menu.', modelBinding('open'))],
  'notification-center': [
    select(
      'dataState',
      'Data state',
      'ready',
      'Changes the notification collection fixture.',
      ['ready', 'empty', 'unread'],
      fixtureBinding('data', 'Selects ready, empty, or unread notification records.'),
    ),
  ],
  'global-search': [
    text('query', 'Query', '', 'Changes the active search query.', modelBinding('query')),
    number(
      'activeIndex',
      'Active result',
      0,
      'Changes the active result index.',
      0,
      20,
      1,
      modelBinding('activeIndex'),
    ),
    boolean('open', 'Open', false, 'Opens the search result surface.', modelBinding('open')),
  ],
  'filter-bar': [
    select(
      'activeFilter',
      'Active filter',
      'none',
      'Changes the deterministic filter-value fixture.',
      ['none', 'healthy', 'attention'],
      fixtureBinding(
        'interaction',
        'Seeds the public values model with a deterministic filter selection.',
      ),
    ),
  ],
  'page-header': [text('heading', 'Heading', 'Automation health', 'Changes the page heading.')],
  'settings-panel': [
    boolean('open', 'Open', false, 'Opens the settings panel.', modelBinding('open')),
  ],
  'crud-toolbar': [
    number('selectedCount', 'Selected count', 0, 'Changes the selected-record summary.', 0, 100),
  ],
  'bulk-actions': [
    number('selectedCount', 'Selected count', 3, 'Changes the selected-record summary.', 0, 100),
  ],
  'master-detail-layout': [
    boolean(
      'detailOpen',
      'Detail open',
      false,
      'Shows the detail pane on narrow layouts.',
      modelBinding('detailOpen'),
    ),
  ],
  'dashboard-widget': [
    text('heading', 'Heading', 'Automation health', 'Changes the widget heading.'),
  ],
  'login-form': [loading],
  'profile-form': [
    boolean('saving', 'Saving', false, 'Shows the saving state.'),
    text(
      'dirtyMessage',
      'Dirty message',
      'Unsaved changes',
      'Uses locale-aware unsaved-changes copy until explicitly changed.',
    ),
  ],
  'multi-step-form': [
    number(
      'current',
      'Current step',
      0,
      'Changes the current form step.',
      0,
      2,
      1,
      modelBinding('current'),
    ),
    number(
      'furthestStep',
      'Furthest step',
      0,
      'Changes the furthest completed or visited step.',
      0,
      2,
      1,
      modelBinding('furthestStep'),
    ),
  ],
  'mobile-navigation': [
    select(
      'selected',
      'Selected item',
      'overview',
      'Changes the selected projected navigation destination.',
      ['overview', 'activity', 'settings'],
      fixtureBinding(
        'interaction',
        'Selects the active projected navigation action in the mobile fixture.',
      ),
    ),
  ],
  'responsive-application-shell': [
    boolean(
      'navigationOpen',
      'Navigation open',
      false,
      'Opens the responsive shell navigation.',
      modelBinding('navigationOpen'),
    ),
  ],
};
