import { ACTIONS_CONTROL_SETS } from './playground-control-sets/actions';
import { ADDON_CHARTS_CONTROL_SETS } from './playground-control-sets/addon-charts';
import { ADDON_GRID_CONTROL_SETS } from './playground-control-sets/addon-grid';
import { DATA_DISPLAY_CONTROL_SETS } from './playground-control-sets/data-display';
import { FEEDBACK_CONTROL_SETS } from './playground-control-sets/feedback';
import { FORMS_CONTROL_SETS } from './playground-control-sets/forms';
import { LAYOUT_CONTROL_SETS } from './playground-control-sets/layout';
import { NAVIGATION_CONTROL_SETS } from './playground-control-sets/navigation';
import { PATTERNS_CONTROL_SETS } from './playground-control-sets/patterns';

import type { KernPlaygroundControl } from './playground-foundation';

export const CONTROL_SETS: Readonly<Record<string, readonly KernPlaygroundControl[]>> =
  Object.freeze({
    ...ACTIONS_CONTROL_SETS,
    ...ADDON_CHARTS_CONTROL_SETS,
    ...ADDON_GRID_CONTROL_SETS,
    ...DATA_DISPLAY_CONTROL_SETS,
    ...FEEDBACK_CONTROL_SETS,
    ...FORMS_CONTROL_SETS,
    ...LAYOUT_CONTROL_SETS,
    ...NAVIGATION_CONTROL_SETS,
    ...PATTERNS_CONTROL_SETS,
  });
