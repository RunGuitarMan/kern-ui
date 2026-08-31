import {
  boolean,
  disabled,
  modelBinding,
  number,
  select,
  text,
  type KernPlaygroundControl,
} from '../playground-foundation';

export const LAYOUT_CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> = {
  'app-shell': [
    boolean(
      'mobileNavigationOpen',
      'Mobile navigation open',
      false,
      'Opens the shell navigation surface at mobile breakpoints.',
      modelBinding('mobileNavigationOpen'),
    ),
    text('mainMaxWidth', 'Main max width', '48rem', 'Constrains the primary content measure.'),
    text('sidebarWidth', 'Sidebar width', '10rem', 'Sets the shell sidebar width.'),
  ],
  header: [boolean('elevated', 'Elevated', true, 'Adds the elevated header treatment.')],
  sidebar: [
    boolean(
      'collapsed',
      'Collapsed',
      false,
      'Collapses the sidebar to its configured compact mode.',
      modelBinding('collapsed'),
    ),
    text('width', 'Width', '15rem', 'Sets the expanded sidebar width.'),
  ],
  'navigation-rail': [
    boolean(
      'expanded',
      'Expanded',
      false,
      'Expands the rail to show persistent labels.',
      modelBinding('expanded'),
    ),
  ],
  container: [
    select('size', 'Size', 'sm', 'Changes the maximum container width.', [
      'sm',
      'md',
      'lg',
      'xl',
      'full',
    ]),
  ],
  stack: [
    select('gap', 'Gap', '3', 'Changes the block-axis spacing between projected items.', [
      '2',
      '3',
      '4',
      '8',
    ]),
  ],
  inline: [boolean('wrap', 'Wrap', true, 'Allows inline items to wrap onto another flex line.')],
  cluster: [
    select('gap', 'Gap', '2', 'Changes the spacing between clustered items.', ['1', '2', '4']),
    select(
      'justify',
      'Justify',
      'space-between',
      'Distributes the cluster along its inline axis.',
      ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
    ),
  ],
  grid: [
    boolean('responsive', 'Responsive', true, 'Enables responsive column collapsing.'),
    select('columns', 'Columns', 3, 'Sets a fixed or automatic column count.', [
      'auto',
      1,
      2,
      3,
      4,
    ]),
    text('gap', 'Gap', '3', 'Sets the grid gutter.'),
  ],
  'split-layout': [
    select('ratio', 'Ratio', '1:2', 'Changes the primary-to-secondary pane ratio.', [
      '1:1',
      '1:2',
      '2:1',
      'golden',
    ]),
    text('gap', 'Gap', '4', 'Sets the separation between panes.'),
  ],
  center: [
    boolean('intrinsic', 'Intrinsic', true, 'Centers the child using its intrinsic inline size.'),
    text('maxWidth', 'Maximum width', '28rem', 'Constrains the centered content measure.'),
  ],
  spacer: [
    select('axis', 'Axis', 'horizontal', 'Chooses the axis that receives spacing.', [
      'horizontal',
      'vertical',
    ]),
    text('size', 'Size', '12', 'Sets the spacer length.'),
  ],
  divider: [
    select(
      'orientation',
      'Orientation',
      'horizontal',
      'Changes the separator axis and accessibility semantics.',
      ['horizontal', 'vertical'],
    ),
    text('label', 'Label', 'Access policy', 'Adds an accessible separator label.'),
  ],
  'aspect-ratio': [
    select('fit', 'Object fit', 'cover', 'Changes how projected media fits the ratio box.', [
      'none',
      'fill',
      'cover',
      'contain',
    ]),
  ],
  'scroll-area': [
    select('axis', 'Scroll axis', 'vertical', 'Chooses the axes that can scroll.', [
      'horizontal',
      'vertical',
      'both',
    ]),
    text('maxBlockSize', 'Maximum block size', '16rem', 'Constrains the scrolling viewport.'),
  ],
  'responsive-show-hide': [
    select(
      'display',
      'Display',
      'block',
      'Chooses the display mode used while the responsive content is visible.',
      ['block', 'inline', 'contents', 'flex', 'grid'],
    ),
    select(
      'from',
      'Visible from',
      'md',
      'Shows the desktop specimen from the selected breakpoint.',
      ['none', 'sm', 'md', 'lg', 'xl'],
    ),
    select(
      'until',
      'Visible until',
      'none',
      'Optionally hides the desktop specimen at the selected breakpoint.',
      ['none', 'sm', 'md', 'lg', 'xl'],
    ),
  ],
  'resizable-panels': [
    boolean('disabled', 'Disabled', false, 'Disables pointer and keyboard resizing.'),
    number('step', 'Step', 5, 'Sets the keyboard resize increment.', 1, 25),
  ],
};
