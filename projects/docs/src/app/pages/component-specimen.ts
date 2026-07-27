import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { KernCatalogItem } from '@kern-ui/showcase';
import {
  KrnAccordion,
  KrnAlert,
  KrnAlertDialog,
  KrnAppShell,
  KrnAspectRatio,
  KrnAutocomplete,
  KrnAvatar,
  KrnAvatarGroup,
  KrnBackButton,
  KrnBadge,
  KrnBanner,
  KrnBarChart,
  KrnBottomNavigation,
  KrnBottomSheet,
  KrnBreadcrumbs,
  KrnButton,
  KrnButtonGroup,
  KrnCalendar,
  KrnCard,
  KrnCenter,
  KrnCheckbox,
  KrnCheckboxGroup,
  KrnChip,
  KrnCircularProgress,
  KrnCluster,
  KrnCodeBlock,
  KrnColorPicker,
  KrnCombobox,
  KrnCommandPalette,
  KrnConfirmation,
  KrnContainer,
  KrnContextMenu,
  KrnCopyButton,
  KrnCrudToolbar,
  KrnDashboardWidget,
  KrnDataGrid,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnDescriptionItem,
  KrnDescriptionList,
  KrnDialog,
  KrnDisclosure,
  KrnDivider,
  KrnDonutChart,
  KrnDrawer,
  KrnDropUpload,
  KrnDropdownButton,
  KrnEmptyState,
  KrnErrorState,
  KrnFileUpload,
  KrnFilterBar,
  KrnFloatingActionButton,
  KrnFormField,
  KrnGlobalSearch,
  KrnGrid,
  KrnHeader,
  KrnHint,
  KrnHoverCard,
  KrnIconButton,
  KrnInline,
  KrnKeyboardShortcut,
  KrnLabel,
  KrnLineChart,
  KrnLink,
  KrnList,
  KrnListItem,
  KrnLoadingOverlay,
  KrnLoginForm,
  KrnMasterDetailLayout,
  KrnMenu,
  KrnMenubar,
  KrnMeter,
  KrnMobileNavigation,
  KrnMultiSelect,
  KrnMultiStepForm,
  KrnNativeSelect,
  KrnNavigationRail,
  KrnNotificationCenter,
  KrnNumberInput,
  KrnOtpInput,
  KrnPageHeader,
  KrnPagination,
  KrnPasswordInput,
  KrnPopover,
  KrnProfileForm,
  KrnProgressBar,
  KrnRadio,
  KrnRadioGroup,
  KrnRangeSlider,
  KrnRating,
  KrnResizablePanel,
  KrnResizablePanels,
  KrnResizeHandle,
  KrnResponsiveApplicationShell,
  KrnResponsiveMedia,
  KrnScrollArea,
  KrnSearchInput,
  KrnSegmentedControl,
  KrnSelect,
  KrnSettingsPanel,
  KrnShow,
  KrnSidebar,
  KrnSkeleton,
  KrnSkipLink,
  KrnSlider,
  KrnSpacer,
  KrnSpinner,
  KrnSplitButton,
  KrnSplitLayout,
  KrnStack,
  KrnStat,
  KrnStepper,
  KrnSuccessState,
  KrnSwitch,
  KrnTableOfContents,
  KrnTabs,
  KrnTagsInput,
  KrnTextInput,
  KrnTextarea,
  KrnTimePicker,
  KrnTimeline,
  KrnTimelineItem,
  KrnToastService,
  KrnToastViewport,
  KrnToggleButton,
  KrnToggleGroup,
  KrnTooltip,
  KrnTree,
  KrnTreeNavigation,
  KrnUserMenu,
  KrnValidationMessage,
  type KrnChartDatum,
  type KrnDataColumn,
  type KrnFilterDefinition,
  type KrnFormStep,
  type KrnNavigationItem,
  type KrnNotification,
  type KrnProfileValue,
  type KrnSearchResult,
  type KrnSelectOption,
  type KrnTabItem,
  type KrnTocItem,
  type KrnTreeNavigationItem,
  type KrnTreeNode,
} from '@kern-ui/angular';

interface SpecimenRow extends Record<string, unknown> {
  readonly id: number;
  readonly workspace: string;
  readonly owner: string;
  readonly status: string;
  readonly usage: number;
}

@Component({
  selector: 'kdocs-component-specimen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KrnAccordion,
    KrnAlert,
    KrnAlertDialog,
    KrnAppShell,
    KrnAspectRatio,
    KrnAutocomplete,
    KrnAvatar,
    KrnAvatarGroup,
    KrnBackButton,
    KrnBadge,
    KrnBanner,
    KrnBarChart,
    KrnBottomNavigation,
    KrnBottomSheet,
    KrnBreadcrumbs,
    KrnButton,
    KrnButtonGroup,
    KrnCalendar,
    KrnCard,
    KrnCenter,
    KrnCheckbox,
    KrnCheckboxGroup,
    KrnChip,
    KrnCircularProgress,
    KrnCluster,
    KrnCodeBlock,
    KrnColorPicker,
    KrnCombobox,
    KrnCommandPalette,
    KrnConfirmation,
    KrnContainer,
    KrnContextMenu,
    KrnCopyButton,
    KrnCrudToolbar,
    KrnDashboardWidget,
    KrnDataGrid,
    KrnDatePicker,
    KrnDateRangePicker,
    KrnDescriptionItem,
    KrnDescriptionList,
    KrnDialog,
    KrnDisclosure,
    KrnDivider,
    KrnDonutChart,
    KrnDrawer,
    KrnDropUpload,
    KrnDropdownButton,
    KrnEmptyState,
    KrnErrorState,
    KrnFileUpload,
    KrnFilterBar,
    KrnFloatingActionButton,
    KrnFormField,
    KrnGlobalSearch,
    KrnGrid,
    KrnHeader,
    KrnHint,
    KrnHoverCard,
    KrnIconButton,
    KrnInline,
    KrnKeyboardShortcut,
    KrnLabel,
    KrnLineChart,
    KrnLink,
    KrnList,
    KrnListItem,
    KrnLoadingOverlay,
    KrnLoginForm,
    KrnMasterDetailLayout,
    KrnMenu,
    KrnMenubar,
    KrnMeter,
    KrnMobileNavigation,
    KrnMultiSelect,
    KrnMultiStepForm,
    KrnNativeSelect,
    KrnNavigationRail,
    KrnNotificationCenter,
    KrnNumberInput,
    KrnOtpInput,
    KrnPageHeader,
    KrnPagination,
    KrnPasswordInput,
    KrnPopover,
    KrnProfileForm,
    KrnProgressBar,
    KrnRadio,
    KrnRadioGroup,
    KrnRangeSlider,
    KrnRating,
    KrnResizablePanel,
    KrnResizablePanels,
    KrnResizeHandle,
    KrnResponsiveApplicationShell,
    KrnResponsiveMedia,
    KrnScrollArea,
    KrnSearchInput,
    KrnSegmentedControl,
    KrnSelect,
    KrnSettingsPanel,
    KrnShow,
    KrnSidebar,
    KrnSkeleton,
    KrnSkipLink,
    KrnSlider,
    KrnSpacer,
    KrnSpinner,
    KrnSplitButton,
    KrnSplitLayout,
    KrnStack,
    KrnStat,
    KrnStepper,
    KrnSuccessState,
    KrnSwitch,
    KrnTableOfContents,
    KrnTabs,
    KrnTagsInput,
    KrnTextInput,
    KrnTextarea,
    KrnTimePicker,
    KrnTimeline,
    KrnTimelineItem,
    KrnToastViewport,
    KrnToggleButton,
    KrnToggleGroup,
    KrnTooltip,
    KrnTree,
    KrnTreeNavigation,
    KrnUserMenu,
    KrnValidationMessage,
    RouterLink,
  ],
  templateUrl: './component-specimen.html',
  styleUrl: './component-specimen.css',
})
export class ComponentSpecimen {
  readonly item = input.required<KernCatalogItem>();

  private readonly toasts = inject(KrnToastService);
  protected readonly surfaceOpen = signal(false);
  protected readonly commandOpen = signal(false);
  protected readonly settingsOpen = signal(false);
  protected readonly selectedCount = signal(3);
  protected readonly detailOpen = signal(false);
  protected readonly formStep = signal(0);
  protected readonly workspaceName = signal('');
  protected readonly workspaceNameTouched = signal(false);
  protected readonly paginationPage = signal(1);
  protected readonly paginationRange = computed(() => {
    const start = (this.paginationPage() - 1) * 20 + 1;
    return `${start}–${Math.min(248, start + 19)}`;
  });
  protected readonly workspaceNameError = computed(() => {
    if (!this.workspaceNameTouched()) {
      return '';
    }
    const length = this.workspaceName().trim().length;
    return length >= 3 && length <= 48 ? '' : 'Use 3–48 characters.';
  });

  protected readonly selectOptions: readonly KrnSelectOption<string>[] = [
    { value: 'starter', label: 'Starter' },
    { value: 'team', label: 'Team', description: 'For collaborative product teams' },
    { value: 'scale', label: 'Scale', description: 'Advanced controls and governance' },
  ];
  protected readonly segmentOptions = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
    { value: 'timeline', label: 'Timeline' },
  ] as const;
  protected readonly tabs: readonly KrnTabItem[] = [
    { id: 'overview', label: 'Overview', badge: 8 },
    { id: 'activity', label: 'Activity', badge: 24 },
    { id: 'settings', label: 'Settings' },
  ];
  protected readonly breadcrumbs = computed(() => {
    const href = `/components/${this.item().id}#specimen`;
    return [
      { label: 'Workspaces', href },
      { label: 'Northstar', href },
      { label: 'Settings', current: true },
    ] as const;
  });
  protected readonly navigationItems: readonly KrnNavigationItem[] = [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'activity', label: 'Activity', icon: '↗', badge: 4 },
    { id: 'reports', label: 'Reports', icon: '▤' },
    { id: 'archive', label: 'Archive', disabled: true },
  ];
  protected readonly treeNavigationItems: readonly KrnTreeNavigationItem[] = [
    {
      id: 'workspace',
      label: 'Northstar',
      children: [
        { id: 'overview', label: 'Overview' },
        {
          id: 'operations',
          label: 'Operations',
          children: [
            { id: 'automations', label: 'Automations' },
            { id: 'audit', label: 'Audit log' },
          ],
        },
      ],
    },
    { id: 'archive', label: 'Archive' },
  ];
  protected readonly tocItems: readonly KrnTocItem[] = [
    { id: 'specimen-overview', label: 'Overview', level: 2 },
    { id: 'specimen-api', label: 'API contract', level: 2 },
    { id: 'specimen-a11y', label: 'Accessibility', level: 2 },
  ];
  protected readonly chartData: readonly KrnChartDatum[] = [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 56 },
    { label: 'Wed', value: 49 },
    { label: 'Thu', value: 68 },
    { label: 'Fri', value: 74 },
    { label: 'Sat', value: 63 },
  ];
  protected readonly specimenRows: readonly SpecimenRow[] = [
    { id: 1, workspace: 'Northstar', owner: 'A. Cole', status: 'Healthy', usage: 84 },
    { id: 2, workspace: 'Fieldnote', owner: 'M. Chen', status: 'Attention', usage: 96 },
    { id: 3, workspace: 'Orchard', owner: 'R. Singh', status: 'Healthy', usage: 67 },
    { id: 4, workspace: 'Relay', owner: 'N. Costa', status: 'Healthy', usage: 72 },
  ];
  protected readonly specimenColumns: readonly KrnDataColumn<SpecimenRow>[] = [
    { key: 'workspace', label: 'Workspace', sortable: true, priority: 'primary' },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'status', label: 'State', sortable: true },
    { key: 'usage', label: 'Usage', sortable: true, align: 'end', priority: 'primary' },
  ];
  protected readonly treeNodes: readonly KrnTreeNode[] = [
    {
      id: 'src',
      label: 'projects',
      children: [
        { id: 'kern', label: 'kern' },
        { id: 'docs', label: 'docs' },
        { id: 'lab', label: 'lab' },
      ],
    },
    { id: 'package', label: 'package.json' },
  ];
  protected readonly searchResults: readonly KrnSearchResult[] = [
    {
      id: 'northstar',
      label: 'Northstar',
      description: 'Operations workspace',
      group: 'Workspace',
    },
    { id: 'fieldnote', label: 'Fieldnote', description: 'Research project', group: 'Project' },
    { id: 'orchard', label: 'Orchard', description: 'Commerce workspace', group: 'Workspace' },
  ];
  protected readonly filters: readonly KrnFilterDefinition[] = [
    {
      id: 'state',
      label: 'State',
      options: [
        { value: 'healthy', label: 'Healthy', count: 18 },
        { value: 'attention', label: 'Attention', count: 6 },
      ],
    },
    {
      id: 'plan',
      label: 'Plan',
      options: [
        { value: 'scale', label: 'Scale', count: 12 },
        { value: 'team', label: 'Team', count: 9 },
      ],
    },
  ];
  protected readonly notifications: readonly KrnNotification[] = [
    {
      id: 'n1',
      title: 'Seat threshold reached',
      detail: 'Fieldnote is using 96% of its available seats.',
      timestamp: '8 minutes ago',
      read: false,
      tone: 'warning',
    },
    {
      id: 'n2',
      title: 'Export completed',
      detail: 'The Q3 audit package is ready.',
      timestamp: '34 minutes ago',
      read: true,
      tone: 'success',
    },
  ];
  protected readonly steps: readonly KrnFormStep[] = [
    { id: 'workspace', label: 'Workspace', description: 'Identity', valid: true },
    { id: 'people', label: 'People', description: 'Collaborators', optional: true, valid: true },
    { id: 'review', label: 'Review', description: 'Policy', valid: true },
  ];
  protected readonly profile: KrnProfileValue = {
    name: 'Avery Cole',
    role: 'Operations lead',
    bio: 'Designing calm systems for complicated work.',
    timezone: 'Europe/Moscow',
  };
  protected readonly codeSnippet = `import { KrnButton } from '@kern-ui/angular';

@Component({
  imports: [KrnButton],
  template: \`<krn-button>Publish</krn-button>\`,
})
export class Toolbar {}`;

  protected readonly rowIdentity = (row: SpecimenRow): number => row.id;
  protected readonly expandedRow = (row: SpecimenRow): string =>
    `${row.workspace} is owned by ${row.owner}.`;

  constructor() {
    effect(() => {
      this.item().id;
      this.surfaceOpen.set(false);
      this.commandOpen.set(false);
      this.settingsOpen.set(false);
      this.detailOpen.set(false);
      this.formStep.set(0);
      this.workspaceName.set('');
      this.workspaceNameTouched.set(false);
      this.paginationPage.set(1);
    });
  }

  protected showToast(): void {
    this.toasts.success('Workspace settings were published.', {
      title: 'Changes saved',
      duration: 0,
      actionLabel: 'Review',
    });
  }
}
