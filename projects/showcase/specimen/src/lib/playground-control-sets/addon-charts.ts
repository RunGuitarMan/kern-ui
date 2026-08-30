import {
  chartDescription,
  chartSummaryLimit,
  chartTitle,
  text,
  type KernPlaygroundControl,
} from '../playground-foundation';

export const ADDON_CHARTS_CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> =
  {
    'line-chart': [chartTitle, chartDescription, chartSummaryLimit],
    'bar-chart': [
      text('title', 'Title', 'Runs by environment', 'Sets the visible chart title.'),
      text('description', 'Description', 'Successful runs', 'Adds concise dataset context.'),
      chartSummaryLimit,
    ],
    'donut-chart': [
      text('title', 'Title', 'Workspace plan mix', 'Sets the visible chart title.'),
      text(
        'description',
        'Description',
        'Current active workspaces',
        'Adds concise dataset context.',
      ),
      chartSummaryLimit,
    ],
  };
