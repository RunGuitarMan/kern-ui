import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { KernCatalogItem } from '@kern-ui/showcase';
import {
  KERN_PLAYGROUND_DEFINITIONS,
  findKernPlaygroundDefinition,
  resolveKernPlaygroundState,
  type KernPlaygroundEnvironment,
  type KernPlaygroundValue,
  type KernPlaygroundValues,
  type KernSpecimenScenario,
} from './playground';
import {
  KRN_TRANSLATIONS,
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
  type KrnContextMenuItem,
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

const rendererControls = <const T extends readonly string[]>(...keys: T): T =>
  Object.freeze(keys) as T;

/**
 * Static gate between playground contracts and the focused specimen renderer.
 * Keep this explicit: a new control must name the renderer behavior it expects.
 */
export const KERN_SPECIMEN_CURATED_RENDERER_CONTROLS = Object.freeze({
  'app-shell': rendererControls('mobileNavigationOpen'),
  header: rendererControls('elevated'),
  sidebar: rendererControls('collapsed'),
  'navigation-rail': rendererControls('expanded'),
  container: rendererControls('size'),
  stack: rendererControls('gap'),
  inline: rendererControls('wrap'),
  cluster: rendererControls('gap'),
  grid: rendererControls('responsive'),
  'split-layout': rendererControls('reverseCollapsed'),
  center: rendererControls('intrinsic'),
  spacer: rendererControls('axis'),
  divider: rendererControls('orientation'),
  'aspect-ratio': rendererControls('fit'),
  'scroll-area': rendererControls('axis'),
  'responsive-show-hide': rendererControls('display'),
  'resizable-panels': rendererControls('disabled'),
  button: rendererControls('variant', 'tone', 'size', 'loading', 'disabled', 'pressed'),
  'icon-button': rendererControls('variant', 'tone', 'size', 'loading', 'disabled', 'pressed'),
  'button-group': rendererControls('orientation'),
  'split-button': rendererControls('open'),
  'floating-action-button': rendererControls(
    'variant',
    'tone',
    'size',
    'extended',
    'loading',
    'disabled',
  ),
  'toggle-button': rendererControls('disabled', 'selected'),
  'toggle-group': rendererControls('multiple'),
  'copy-button': rendererControls('disabled'),
  link: rendererControls('disabled'),
  'dropdown-button': rendererControls('open'),
  'form-field': rendererControls('state'),
  label: rendererControls('required'),
  hint: rendererControls('content'),
  'validation-message': rendererControls('content'),
  'text-input': rendererControls(
    'placeholder',
    'size',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  textarea: rendererControls(
    'placeholder',
    'size',
    'rows',
    'maxLength',
    'showCount',
    'autoResize',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  'password-input': rendererControls('placeholder', 'disabled', 'readOnly', 'required', 'invalid'),
  'search-input': rendererControls('placeholder', 'disabled', 'readOnly', 'invalid'),
  'number-input': rendererControls(
    'min',
    'max',
    'step',
    'showSteppers',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  checkbox: rendererControls(
    'selected',
    'indeterminate',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  'checkbox-group': rendererControls('disabled'),
  radio: rendererControls('selected', 'disabled', 'readOnly'),
  'radio-group': rendererControls('disabled'),
  switch: rendererControls('selected', 'disabled', 'readOnly', 'required', 'invalid'),
  select: rendererControls(
    'placeholder',
    'optionsState',
    'open',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  'native-select': rendererControls('placeholder', 'disabled', 'readOnly', 'required', 'invalid'),
  'multi-select': rendererControls(
    'placeholder',
    'optionsState',
    'open',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  combobox: rendererControls(
    'placeholder',
    'optionsState',
    'open',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  autocomplete: rendererControls(
    'placeholder',
    'optionsState',
    'open',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  slider: rendererControls('min', 'max', 'step', 'showValue', 'disabled', 'readOnly', 'invalid'),
  'range-slider': rendererControls('min', 'max', 'step', 'disabled', 'readOnly', 'invalid'),
  'segmented-control': rendererControls('disabled', 'readOnly', 'required', 'invalid'),
  'date-picker': rendererControls(
    'min',
    'max',
    'weekStartsOn',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  'date-range-picker': rendererControls('disabled', 'readOnly', 'required', 'invalid'),
  'time-picker': rendererControls(
    'min',
    'max',
    'step',
    'disabled',
    'readOnly',
    'required',
    'invalid',
  ),
  'color-picker': rendererControls('invalid'),
  'file-upload': rendererControls('multiple'),
  'drag-drop-upload': rendererControls('multiple'),
  'verification-code': rendererControls('length'),
  'tags-input': rendererControls('disabled'),
  breadcrumbs: rendererControls('maxItems'),
  tabs: rendererControls('orientation', 'selected'),
  'vertical-tabs': rendererControls('selected'),
  pagination: rendererControls('totalItems', 'pageSize', 'siblingCount'),
  stepper: rendererControls('activeStep'),
  menu: rendererControls('open'),
  menubar: rendererControls('itemState'),
  'context-menu': rendererControls('open'),
  'tree-navigation': rendererControls('selected'),
  'bottom-navigation': rendererControls('selected'),
  'command-palette': rendererControls('open'),
  'table-of-contents': rendererControls('active'),
  'back-button': rendererControls('label'),
  'skip-link': rendererControls('label'),
  alert: rendererControls('tone', 'title', 'dismissible'),
  banner: rendererControls('dismissible'),
  toast: rendererControls('expanded'),
  tooltip: rendererControls('text', 'position', 'showDelay', 'hideDelay'),
  popover: rendererControls('open'),
  'hover-card': rendererControls('openDelay', 'closeDelay'),
  dialog: rendererControls('title', 'description', 'open', 'showClose', 'closeOnEscape'),
  'alert-dialog': rendererControls('open'),
  drawer: rendererControls('open'),
  'bottom-sheet': rendererControls('open'),
  'loading-overlay': rendererControls('active'),
  'progress-bar': rendererControls('value', 'max', 'indeterminate'),
  'circular-progress': rendererControls('value', 'max', 'indeterminate', 'showValue'),
  spinner: rendererControls('label'),
  skeleton: rendererControls('width', 'height', 'shape'),
  'empty-state': rendererControls('tone'),
  'error-state': rendererControls('tone'),
  'success-state': rendererControls('tone'),
  'confirmation-pattern': rendererControls('confirming'),
  badge: rendererControls('tone', 'status'),
  'status-badge': rendererControls('tone'),
  chip: rendererControls('interactive', 'selected', 'removable', 'disabled'),
  tag: rendererControls('interactive', 'selected', 'removable', 'disabled'),
  avatar: rendererControls('imageFailed'),
  'avatar-group': rendererControls('overlap'),
  card: rendererControls('eyebrow', 'heading', 'interactive'),
  stat: rendererControls('trend'),
  'description-list': rendererControls('dataState'),
  list: rendererControls('role'),
  'list-item': rendererControls('selected'),
  accordion: rendererControls('expanded'),
  disclosure: rendererControls('open'),
  timeline: rendererControls('dataState'),
  tree: rendererControls('dataState'),
  'data-table': rendererControls('dataState', 'resizable', 'pagination', 'compact', 'pageSize'),
  'data-grid': rendererControls(
    'dataState',
    'selectable',
    'expandable',
    'filterable',
    'resizable',
    'pagination',
    'compact',
    'pageSize',
    'viewportHeight',
  ),
  calendar: rendererControls('activeMonth'),
  'code-block': rendererControls('language'),
  'keyboard-shortcut': rendererControls('platform'),
  meter: rendererControls('value', 'min', 'max', 'low', 'high', 'optimum'),
  rating: rendererControls('value'),
  'line-chart': rendererControls('title', 'description', 'summaryItemLimit'),
  'bar-chart': rendererControls('title', 'description', 'summaryItemLimit'),
  'donut-chart': rendererControls('title', 'description', 'summaryItemLimit'),
  'responsive-media': rendererControls('aspectRatio'),
  'user-menu': rendererControls('open'),
  'notification-center': rendererControls('dataState'),
  'global-search': rendererControls('query'),
  'filter-bar': rendererControls('activeFilter'),
  'page-header': rendererControls('heading'),
  'settings-panel': rendererControls('open'),
  'crud-toolbar': rendererControls('selectedCount'),
  'bulk-actions': rendererControls('selectedCount'),
  'master-detail-layout': rendererControls('detailOpen'),
  'dashboard-widget': rendererControls('heading'),
  'login-form': rendererControls('loading'),
  'profile-form': rendererControls('saving'),
  'multi-step-form': rendererControls('current'),
  'mobile-navigation': rendererControls('selected'),
  'responsive-application-shell': rendererControls('navigationOpen'),
});

/**
 * Complete renderer contract. Curated controls above are implemented by the
 * focused specimen state/fixtures; automatically classified scalar public API
 * controls are bound directly in the specimen template.
 */
export const KERN_SPECIMEN_RENDERER_CONTROLS: Readonly<Record<string, readonly string[]>> =
  Object.freeze(
    Object.fromEntries(
      KERN_PLAYGROUND_DEFINITIONS.map(({ id, controls }) => [
        id,
        Object.freeze(controls.map(({ key }) => key)),
      ]),
    ),
  );

export function resolveKernSpecimenMenubarItems(
  state: string,
  items: readonly KrnNavigationItem[],
): readonly KrnNavigationItem[] {
  if (state === 'current') {
    return items.map((item, index) =>
      index === 0 ? { ...item, label: `${item.label} · Current` } : item,
    );
  }
  if (state === 'disabled') {
    return items.map((item, index) => (index === 0 ? { ...item, disabled: true } : item));
  }
  return items;
}

export function resolveKernSpecimenNotifications(
  state: string,
  notifications: readonly KrnNotification[],
): readonly KrnNotification[] {
  if (state === 'empty') return [];
  if (state === 'unread') {
    return notifications.map((notification) => ({ ...notification, read: false }));
  }
  return notifications;
}

export function resolveKernSpecimenFilterValues(
  activeFilter: string,
): Readonly<Partial<Record<string, string>>> {
  return activeFilter === 'healthy' || activeFilter === 'attention' ? { state: activeFilter } : {};
}

export function resolveKernSpecimenShortcutKeys(platform: string): readonly string[] {
  return platform === 'Windows' ? ['Ctrl', 'K'] : ['⌘', 'K'];
}

@Component({
  selector: 'kshow-component-specimen',
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
    FormsModule,
    RouterLink,
  ],
  templateUrl: './component-specimen.html',
  styleUrl: './component-specimen.css',
})
export class KernComponentSpecimen {
  readonly item = input.required<KernCatalogItem>();
  readonly scenario = input<KernSpecimenScenario>('default');
  readonly state = input('default');
  readonly args = input<KernPlaygroundValues>({});
  readonly resetRevision = input(0);

  private readonly playgroundDefinition = computed(() => {
    const definition = findKernPlaygroundDefinition(this.item().id);
    if (!definition) {
      throw new Error(`Missing playground definition for "${this.item().id}".`);
    }
    return definition;
  });
  protected readonly effectiveState = computed(() =>
    resolveKernPlaygroundState(this.playgroundDefinition(), {
      state: this.state(),
      scenario: this.scenario(),
      args: this.args(),
    }),
  );
  protected readonly effectiveScenario = computed(() => this.effectiveState().scenario);
  protected readonly effectiveEnvironment = computed<KernPlaygroundEnvironment>(
    () => this.effectiveState().environment,
  );
  protected readonly effectiveVisualPseudoState = computed(
    () => this.effectiveState().visualPseudoState,
  );
  protected readonly effectiveFixtureEffect = computed(() => this.effectiveState().fixtureEffect);
  protected readonly appliedArguments = computed(() => {
    const state = this.effectiveState();
    return this.playgroundDefinition().controls.flatMap((control) => {
      const value = state.args[control.key];
      return Object.is(value, control.defaultValue)
        ? []
        : [
            Object.freeze({
              key: control.key,
              label: control.label,
              value: typeof value === 'string' ? value : JSON.stringify(value),
            }),
          ];
    });
  });
  protected readonly rendererControls = computed(
    () =>
      (KERN_SPECIMEN_RENDERER_CONTROLS as Readonly<Record<string, readonly string[]>>)[
        this.item().id
      ] ?? [],
  );
  protected readonly composition = computed(() => {
    const value = this.effectiveState().args['composition'];
    return value === 'constrained' || value === 'expanded' ? value : 'default';
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toasts = inject(KrnToastService);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  private readonly contextMenuTarget = viewChild<ElementRef<HTMLElement>>('contextMenuTarget');
  protected readonly surfaceOpen = signal(false);
  protected readonly selectOpen = signal(false);
  protected readonly actionMenuOpen = signal(false);
  protected readonly commandOpen = signal(false);
  protected readonly settingsOpen = signal(false);
  protected readonly appShellNavigationOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly navigationRailExpanded = signal(false);
  protected readonly treeNavigationSelected = signal<string | null>('automations');
  protected readonly bottomNavigationValue = signal<string | null>('overview');
  protected readonly tableOfContentsActive = signal<string | null>('specimen-overview');
  protected readonly toastExpanded = signal(false);
  protected readonly confirmationOpen = signal(false);
  protected readonly avatarImageFailed = signal(false);
  protected readonly accordionExpanded = signal(false);
  protected readonly disclosureOpen = signal(false);
  protected readonly calendarActiveMonth = signal('2026-07');
  protected readonly ratingValue = signal(4);
  protected readonly globalSearchQuery = signal('');
  protected readonly filterValues = signal<Readonly<Partial<Record<string, string>>>>({});
  protected readonly mobileNavigationSelected = signal('overview');
  protected readonly responsiveNavigationOpen = signal(false);
  protected readonly selectedCount = signal(3);
  protected readonly detailOpen = signal(false);
  protected readonly formStep = signal(1);
  protected readonly workspaceName = signal('');
  protected readonly workspaceNameTouched = signal(false);
  protected readonly paginationPage = signal(1);
  protected readonly togglePressed = signal(false);
  protected readonly chipSelected = signal(true);
  protected readonly tagSelected = signal(false);
  protected readonly checkboxValue = signal(false);
  protected readonly radioValue = signal<string | null>('monthly');
  protected readonly switchValue = signal(false);
  protected readonly segmentedValue = signal<string | null>('list');
  protected readonly tabValue = signal<string | null>('overview');
  protected readonly progressValue = signal(68);
  protected readonly meterValue = signal(68);
  protected readonly commandQuery = signal('');
  protected readonly treeSelected = signal('');
  protected readonly gridFilter = signal('');
  protected readonly gridPage = signal(1);
  protected readonly gridSortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly gridSortKey = signal('');
  protected readonly calendarFocusedDate = signal('');
  protected readonly calendarValue = signal('');
  protected readonly codeCopied = signal(false);
  protected readonly globalSearchActiveIndex = signal(0);
  protected readonly globalSearchOpen = signal(false);
  protected readonly multiStepFurthestStep = signal(0);
  protected readonly progressMaximum = computed(() => this.numberArgument('max', 100));
  protected readonly progressPercent = computed(() =>
    Math.round((this.progressValue() / Math.max(1, this.progressMaximum())) * 100),
  );
  protected readonly progressAvailable = computed(() =>
    Math.max(0, this.progressMaximum() - this.progressValue()),
  );
  protected readonly meterMaximum = computed(() => this.numberArgument('max', 100));
  private readonly toastSequence = signal(0);
  protected readonly paginationRange = computed(() => {
    const pageSize = Math.max(1, this.numberArgument('pageSize', 20));
    const totalItems = Math.max(0, this.numberArgument('totalItems', 248));
    if (totalItems === 0) return '0';
    const start = (this.paginationPage() - 1) * pageSize + 1;
    return `${start}–${Math.min(totalItems, start + pageSize - 1)}`;
  });
  protected readonly workspaceNameError = computed(() => {
    if (!this.workspaceNameTouched()) {
      return '';
    }
    const length = this.workspaceName().trim().length;
    return length >= 3 && length <= 48 ? '' : 'Use 3–48 characters.';
  });
  private lastItemId = '';
  private lastResetRevision = 0;
  private readonly synchronizedArguments = new Map<string, KernPlaygroundValue>();
  private readonly synchronizeControlledState = effect(() => {
    const id = this.item().id;
    const resetRevision = this.resetRevision();
    this.effectiveState();
    if (!id) return;

    if (id !== this.lastItemId || resetRevision !== this.lastResetRevision) {
      this.lastItemId = id;
      this.lastResetRevision = resetRevision;
      this.synchronizedArguments.clear();
      this.resetInteractiveState();
    }

    switch (id) {
      case 'app-shell':
        this.synchronizeBoolean('mobileNavigationOpen', this.appShellNavigationOpen);
        break;
      case 'sidebar':
        this.synchronizeBoolean('collapsed', this.sidebarCollapsed);
        break;
      case 'navigation-rail':
        this.synchronizeBoolean('expanded', this.navigationRailExpanded);
        break;
      case 'split-button':
      case 'dropdown-button':
      case 'menu':
      case 'user-menu':
        this.synchronizeBoolean('open', this.actionMenuOpen);
        break;
      case 'toggle-button':
        this.synchronizeBoolean('selected', this.togglePressed);
        break;
      case 'chip':
        this.synchronizeBoolean('selected', this.chipSelected, true);
        break;
      case 'tag':
        this.synchronizeBoolean('selected', this.tagSelected);
        break;
      case 'checkbox':
        this.synchronizeBoolean('selected', this.checkboxValue);
        break;
      case 'radio':
        this.synchronizeArgument('selected', false, (selected) =>
          this.radioValue.set(selected ? 'annual' : 'monthly'),
        );
        break;
      case 'switch':
        this.synchronizeBoolean('selected', this.switchValue);
        break;
      case 'select':
      case 'multi-select':
      case 'combobox':
      case 'autocomplete':
        this.synchronizeBoolean('open', this.selectOpen);
        break;
      case 'tabs':
      case 'vertical-tabs':
        this.synchronizeString('selected', this.tabValue, 'overview');
        break;
      case 'popover':
      case 'dialog':
      case 'alert-dialog':
      case 'drawer':
      case 'bottom-sheet':
        this.synchronizeBoolean('open', this.surfaceOpen);
        break;
      case 'progress-bar':
      case 'circular-progress':
        this.synchronizeNumber('value', this.progressValue, 68);
        break;
      case 'meter':
        this.synchronizeNumber('value', this.meterValue, 68);
        break;
      case 'stepper':
        this.synchronizeNumber('activeStep', this.formStep, 1);
        break;
      case 'pagination':
        this.synchronizeNumber('page', this.paginationPage, 1);
        break;
      case 'tree-navigation':
        if (
          this.effectiveScenario() === 'states' &&
          this.argumentOverride('selected') === undefined
        ) {
          this.synchronizedArguments.delete('tree-navigation.selected');
          this.treeNavigationSelected.set(null);
        } else {
          this.synchronizeString('selected', this.treeNavigationSelected, 'automations');
        }
        break;
      case 'bottom-navigation':
        this.synchronizeString('selected', this.bottomNavigationValue, 'overview');
        break;
      case 'command-palette':
        this.synchronizeBoolean('open', this.commandOpen);
        this.synchronizeString('query', this.commandQuery, '');
        break;
      case 'table-of-contents':
        this.synchronizeString('active', this.tableOfContentsActive, 'specimen-overview');
        break;
      case 'toast':
        this.synchronizeBoolean('expanded', this.toastExpanded);
        break;
      case 'confirmation-pattern':
        this.synchronizeBoolean('confirming', this.confirmationOpen);
        break;
      case 'avatar':
        this.synchronizeBoolean('imageFailed', this.avatarImageFailed);
        break;
      case 'accordion':
        this.synchronizeBoolean('expanded', this.accordionExpanded);
        break;
      case 'disclosure':
        this.synchronizeBoolean('open', this.disclosureOpen);
        break;
      case 'calendar':
        this.synchronizeString('activeMonth', this.calendarActiveMonth, '2026-07');
        this.synchronizeString('focusedDate', this.calendarFocusedDate, '');
        this.synchronizeString('value', this.calendarValue, '');
        break;
      case 'code-block':
        this.synchronizeBoolean('copied', this.codeCopied);
        break;
      case 'rating':
        this.synchronizeNumber('value', this.ratingValue, 4);
        break;
      case 'global-search':
        this.synchronizeString('query', this.globalSearchQuery, '');
        this.synchronizeNumber('activeIndex', this.globalSearchActiveIndex, 0);
        this.synchronizeBoolean('open', this.globalSearchOpen);
        break;
      case 'filter-bar':
        this.synchronizeArgument('activeFilter', 'none', (activeFilter) =>
          this.filterValues.set(resolveKernSpecimenFilterValues(activeFilter)),
        );
        break;
      case 'settings-panel':
        this.synchronizeBoolean('open', this.settingsOpen);
        break;
      case 'crud-toolbar':
        this.synchronizeNumber('selectedCount', this.selectedCount, 0);
        break;
      case 'bulk-actions':
        this.synchronizeNumber('selectedCount', this.selectedCount, 3);
        break;
      case 'master-detail-layout':
        this.synchronizeBoolean('detailOpen', this.detailOpen);
        break;
      case 'multi-step-form':
        this.synchronizeNumber('current', this.formStep, 0);
        this.synchronizeNumber('furthestStep', this.multiStepFurthestStep, 0);
        break;
      case 'mobile-navigation':
        this.synchronizeString('selected', this.mobileNavigationSelected, 'overview');
        break;
      case 'responsive-application-shell':
        this.synchronizeBoolean('navigationOpen', this.responsiveNavigationOpen);
        break;
      case 'tree':
        this.synchronizeString('selected', this.treeSelected, '');
        break;
      case 'data-table':
      case 'data-grid':
        this.synchronizeString('filter', this.gridFilter, '');
        this.synchronizeNumber('page', this.gridPage, 1);
        this.synchronizeString('sortDirection', this.gridSortDirection, 'asc');
        this.synchronizeString('sortKey', this.gridSortKey, '');
        break;
    }
  });

  protected readonly selectOptions: readonly KrnSelectOption<string>[] = [
    { value: 'starter', label: 'Starter' },
    { value: 'team', label: 'Team', description: 'For collaborative product teams' },
    { value: 'scale', label: 'Scale', description: 'Advanced controls and governance' },
  ];
  private readonly scaleSelectOptions: readonly KrnSelectOption<string>[] = Array.from(
    { length: 1_000 },
    (_, index) => ({
      value: `option-${index + 1}`,
      label: `Workspace option ${String(index + 1).padStart(4, '0')}`,
      description: index % 5 === 0 ? 'Enterprise search fixture' : undefined,
    }),
  );
  protected readonly activeSelectOptions = computed(() =>
    this.effectiveScenario() === 'stress' ? this.scaleSelectOptions : this.selectOptions,
  );
  protected readonly stressFormFields = Array.from({ length: 200 }, (_, index) => ({
    id: `enterprise-field-${index + 1}`,
    label: `Enterprise field ${index + 1}`,
    placeholder: `Value ${index + 1}`,
  }));
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
      { label: 'Organization', href },
      { label: 'Operations', href },
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
  protected readonly activeMenubarItems = computed(() =>
    resolveKernSpecimenMenubarItems(
      this.stringArgument('itemState', 'default'),
      this.navigationItems,
    ),
  );
  protected readonly contextMenuItems: readonly KrnContextMenuItem[] = [
    { id: 'open', label: 'Open workspace', icon: '↗', shortcut: '↵' },
    { id: 'duplicate', label: 'Duplicate', icon: '⧉', shortcut: '⌘D' },
    {
      id: 'move',
      label: 'Move to',
      icon: '↪',
      children: [
        { id: 'move-operations', label: 'Operations', icon: 'O' },
        { id: 'move-research', label: 'Research', icon: 'R' },
        { id: 'move-archive', label: 'Archive', icon: 'A', disabled: true },
      ],
    },
    { id: 'archive', label: 'Archive workspace', icon: '□', disabled: true },
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
  private readonly asyncTreeNavigationItems: readonly KrnTreeNavigationItem[] = [
    {
      id: 'loading-workspace',
      label: 'Loading workspace',
      childrenState: 'loading',
    },
    {
      id: 'failed-workspace',
      label: 'Failed workspace',
      childrenState: 'error',
    },
    {
      id: 'ready-workspace',
      label: 'Ready workspace',
      children: [{ id: 'ready-overview', label: 'Overview' }],
    },
  ];
  protected readonly activeTreeNavigationItems = computed(() =>
    this.effectiveScenario() === 'states'
      ? this.asyncTreeNavigationItems
      : this.treeNavigationItems,
  );
  protected readonly tocItems: readonly KrnTocItem[] = [
    { id: 'specimen-overview', label: 'Overview', level: 2 },
    { id: 'specimen-api', label: 'API contract', level: 2 },
    { id: 'specimen-a11y', label: 'Accessibility', level: 2 },
  ];
  protected readonly chartData: readonly KrnChartDatum[] = [
    { id: 'mon', label: 'Mon', value: 42 },
    { id: 'tue', label: 'Tue', value: 56 },
    { id: 'wed', label: 'Wed', value: 49 },
    { id: 'thu', label: 'Thu', value: 68 },
    { id: 'fri', label: 'Fri', value: 74 },
    { id: 'sat', label: 'Sat', value: 63 },
  ];
  private readonly scaleChartData: readonly KrnChartDatum[] = Array.from(
    { length: 120 },
    (_, index) => ({
      id: `point-${index + 1}`,
      label: `P${String(index + 1).padStart(3, '0')}`,
      value: 40 + ((index * 37) % 61),
    }),
  );
  protected readonly chartOrderReversed = signal(false);
  protected readonly activeChartData = computed(() => {
    const data = this.effectiveScenario() === 'stress' ? this.scaleChartData : this.chartData;
    return this.chartOrderReversed() ? [...data].reverse() : data;
  });
  protected readonly specimenRows: readonly SpecimenRow[] = [
    { id: 1, workspace: 'Northstar', owner: 'A. Cole', status: 'Healthy', usage: 84 },
    { id: 2, workspace: 'Fieldnote', owner: 'M. Chen', status: 'Attention', usage: 96 },
    { id: 3, workspace: 'Orchard', owner: 'R. Singh', status: 'Healthy', usage: 67 },
    { id: 4, workspace: 'Relay', owner: 'N. Costa', status: 'Healthy', usage: 72 },
  ];
  private readonly scaleRows: readonly SpecimenRow[] = Array.from(
    { length: 10_000 },
    (_, index) => ({
      id: index + 1,
      workspace: `Workspace ${String(index + 1).padStart(5, '0')}`,
      owner: `Owner ${(index % 97) + 1}`,
      status: index % 11 === 0 ? 'Attention' : 'Healthy',
      usage: (index * 17) % 101,
    }),
  );
  protected readonly activeSpecimenRows = computed(() =>
    this.gridDataState() === 'empty'
      ? []
      : this.effectiveScenario() === 'virtual' ||
          this.effectiveScenario() === 'stress' ||
          this.gridDataState() === 'stress'
        ? this.scaleRows
        : this.specimenRows,
  );
  protected readonly gridDataState = computed(() => {
    if (this.effectiveScenario() === 'stress') return 'stress';
    return this.stringArgument<'ready' | 'loading' | 'error' | 'empty' | 'stress'>(
      'dataState',
      'ready',
    );
  });
  protected readonly gridLoading = computed(() => this.gridDataState() === 'loading');
  protected readonly gridError = computed(() =>
    this.gridDataState() === 'error' ? 'Workspace data could not be loaded.' : '',
  );
  protected readonly virtualGridMode = { kind: 'virtual' } as const;
  protected readonly specimenColumns: readonly KrnDataColumn<SpecimenRow>[] = [
    { key: 'workspace', label: 'Workspace', sortable: true, priority: 'primary' },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'status', label: 'State', sortable: true },
    { key: 'usage', label: 'Usage', sortable: true, align: 'end', priority: 'primary' },
  ];
  private readonly pinnedSpecimenColumns: readonly KrnDataColumn<SpecimenRow>[] = [
    {
      key: 'workspace',
      label: 'Workspace',
      sortable: true,
      priority: 'primary',
      width: 220,
      pinned: 'start',
    },
    { key: 'owner', label: 'Owner', sortable: true, width: 260 },
    { key: 'status', label: 'State', sortable: true, width: 220 },
    {
      key: 'usage',
      label: 'Usage',
      sortable: true,
      align: 'end',
      priority: 'primary',
      width: 140,
      pinned: 'end',
    },
  ];
  protected readonly activeSpecimenColumns = computed(() =>
    this.effectiveScenario() === 'states' || this.effectiveScenario() === 'virtual'
      ? this.pinnedSpecimenColumns
      : this.specimenColumns,
  );
  protected readonly treeNodes: readonly KrnTreeNode[] = [
    {
      id: 'src',
      label: 'projects',
      children: [
        { id: 'kern', label: 'kern' },
        { id: 'docs', label: 'docs' },
        { id: 'showcase', label: 'showcase' },
      ],
    },
    { id: 'package', label: 'package.json' },
  ];
  private readonly asyncTreeNodes: readonly KrnTreeNode[] = [
    {
      id: 'loading-projects',
      label: 'Loading projects',
      childrenState: 'loading',
    },
    {
      id: 'failed-projects',
      label: 'Failed projects',
      childrenState: 'error',
    },
    {
      id: 'ready-projects',
      label: 'Ready projects',
      children: [{ id: 'ready-kern', label: 'kern' }],
    },
  ];
  private readonly scaleTreeNodes: readonly KrnTreeNode[] = Array.from(
    { length: 500 },
    (_, index) => ({
      id: `node-${index + 1}`,
      label: `Enterprise node ${String(index + 1).padStart(3, '0')}`,
    }),
  );
  protected readonly treeDataState = computed(() => {
    if (this.effectiveScenario() === 'stress') return 'stress';
    return this.stringArgument<'ready' | 'loading' | 'error' | 'stress'>('dataState', 'ready');
  });
  protected readonly activeTreeNodes = computed(() =>
    this.treeDataState() === 'stress'
      ? this.scaleTreeNodes
      : this.treeDataState() === 'loading'
        ? this.asyncTreeNodes.slice(0, 1)
        : this.treeDataState() === 'error'
          ? this.asyncTreeNodes.slice(1, 2)
          : this.effectiveScenario() === 'states'
            ? this.asyncTreeNodes
            : this.treeNodes,
  );
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
  protected readonly activeNotifications = computed(() =>
    resolveKernSpecimenNotifications(this.stringArgument('dataState', 'ready'), this.notifications),
  );
  protected readonly contentDataState = computed(() =>
    this.stringArgument<'ready' | 'empty' | 'long-text'>('dataState', 'ready'),
  );
  protected readonly shortcutKeys = computed(() =>
    resolveKernSpecimenShortcutKeys(this.stringArgument('platform', 'macOS')),
  );
  protected readonly saveShortcutKeys = computed(() =>
    this.stringArgument<'macOS' | 'Windows'>('platform', 'macOS') === 'Windows'
      ? ['Ctrl', 'S']
      : ['⌘', 'S'],
  );
  protected readonly avatarSource =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2232%22 fill=%22%2346505e%22/%3E%3Ccircle cx=%2232%22 cy=%2224%22 r=%2211%22 fill=%22%23faf7f2%22/%3E%3Cpath d=%22M13 58c2-13 9-20 19-20s17 7 19 20%22 fill=%22%23e56c45%22/%3E%3C/svg%3E';
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

  private contextMenuControlApplied = false;
  private readonly synchronizeContextMenu = afterRenderEffect(() => {
    const requested = this.item().id === 'context-menu' && this.openArgument(false);
    const target = this.contextMenuTarget()?.nativeElement;
    if (!target || requested === this.contextMenuControlApplied) return;

    if (requested) {
      const EventConstructor = target.ownerDocument.defaultView?.MouseEvent;
      if (!EventConstructor) return;
      const bounds = target.getBoundingClientRect();
      target.dispatchEvent(
        new EventConstructor('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: Math.round(bounds.left + Math.min(24, bounds.width / 2)),
          clientY: Math.round(bounds.top + Math.min(24, bounds.height / 2)),
        }),
      );
    } else {
      const menu = this.host.nativeElement.querySelector<HTMLElement>(
        'krn-context-menu [role="menu"]',
      );
      const EventConstructor = menu?.ownerDocument.defaultView?.KeyboardEvent;
      if (menu && EventConstructor) {
        menu.dispatchEvent(
          new EventConstructor('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    }
    this.contextMenuControlApplied = requested;
  });

  private resetInteractiveState(): void {
    this.surfaceOpen.set(false);
    this.selectOpen.set(false);
    this.actionMenuOpen.set(false);
    this.commandOpen.set(false);
    this.settingsOpen.set(false);
    this.appShellNavigationOpen.set(false);
    this.sidebarCollapsed.set(false);
    this.navigationRailExpanded.set(false);
    this.treeNavigationSelected.set('automations');
    this.bottomNavigationValue.set('overview');
    this.tableOfContentsActive.set('specimen-overview');
    this.toastExpanded.set(false);
    this.confirmationOpen.set(false);
    this.avatarImageFailed.set(false);
    this.accordionExpanded.set(false);
    this.disclosureOpen.set(false);
    this.calendarActiveMonth.set('2026-07');
    this.ratingValue.set(4);
    this.globalSearchQuery.set('');
    this.filterValues.set({});
    this.mobileNavigationSelected.set('overview');
    this.responsiveNavigationOpen.set(false);
    this.selectedCount.set(3);
    this.detailOpen.set(false);
    this.formStep.set(1);
    this.workspaceName.set('');
    this.workspaceNameTouched.set(false);
    this.paginationPage.set(1);
    this.togglePressed.set(false);
    this.chipSelected.set(true);
    this.tagSelected.set(false);
    this.checkboxValue.set(false);
    this.radioValue.set('monthly');
    this.switchValue.set(false);
    this.segmentedValue.set('list');
    this.tabValue.set('overview');
    this.progressValue.set(68);
    this.meterValue.set(68);
    this.commandQuery.set('');
    this.treeSelected.set('');
    this.gridFilter.set('');
    this.gridPage.set(1);
    this.gridSortDirection.set('asc');
    this.gridSortKey.set('');
    this.calendarFocusedDate.set('');
    this.calendarValue.set('');
    this.codeCopied.set(false);
    this.globalSearchActiveIndex.set(0);
    this.globalSearchOpen.set(false);
    this.multiStepFurthestStep.set(0);
    this.chartOrderReversed.set(false);
    this.contextMenuControlApplied = false;
  }

  private synchronizeArgument<T extends KernPlaygroundValue>(
    key: string,
    fallback: T,
    apply: (value: T) => void,
  ): void {
    const candidate = this.argument(key);
    const value = (typeof candidate === typeof fallback ? candidate : fallback) as T;
    const token = `${this.item().id}.${key}`;
    if (Object.is(this.synchronizedArguments.get(token), value)) return;
    this.synchronizedArguments.set(token, value);
    apply(value);
  }

  private synchronizeBoolean(
    key: string,
    target: { set(value: boolean): void },
    fallback = false,
  ): void {
    this.synchronizeArgument(key, fallback, (value) => target.set(value));
  }

  private synchronizeNumber(
    key: string,
    target: { set(value: number): void },
    fallback: number,
  ): void {
    this.synchronizeArgument(key, fallback, (value) => target.set(value));
  }

  private synchronizeString<T extends string>(
    key: string,
    target: { set(value: T): void },
    fallback: T,
  ): void {
    this.synchronizeArgument(key, fallback, (value) => target.set(value));
  }

  protected argument(key: string): KernPlaygroundValue | undefined {
    return this.effectiveState().args[key];
  }

  protected booleanArgument(key: string, fallback = false): boolean {
    const value = this.argument(key);
    return typeof value === 'boolean' ? value : fallback;
  }

  protected nullableBooleanArgument(key: string): boolean | null {
    const value = this.argument(key);
    return typeof value === 'boolean' ? value : null;
  }

  protected numberArgument(key: string, fallback: number): number {
    const value = this.argument(key);
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  protected stringArgument<T extends string>(key: string, fallback: T): T {
    const value = this.argument(key);
    return typeof value === 'string' ? (value as T) : fallback;
  }

  protected argumentOverride(key: string): KernPlaygroundValue | undefined {
    const control = this.playgroundDefinition().controls.find((candidate) => candidate.key === key);
    const value = this.argument(key);
    return control && Object.is(value, control.defaultValue) ? undefined : value;
  }

  protected stringArgumentOverride<T extends string>(key: string, fallback: T): T {
    const value = this.argumentOverride(key);
    return typeof value === 'string' ? (value as T) : fallback;
  }

  protected optionsStateArgument(statesValue: 'error' | 'loading'): 'error' | 'loading' | 'ready' {
    const override = this.argumentOverride('optionsState');
    return override === 'error' || override === 'loading' || override === 'ready'
      ? override
      : this.effectiveScenario() === 'states'
        ? statesValue
        : 'ready';
  }

  protected selectionArgument(fallback: boolean): boolean {
    return this.booleanArgument('selected', fallback);
  }

  protected openArgument(fallback: boolean): boolean {
    return this.booleanArgument('open', fallback);
  }

  protected reverseChartOrder(): void {
    this.chartOrderReversed.update((reversed) => !reversed);
  }

  protected showToast(): void {
    const examples = [
      { title: 'Changes saved', message: 'Workspace settings were published.', tone: 'success' },
      { title: 'Export ready', message: 'The audit package is ready to download.', tone: 'info' },
      { title: 'Review requested', message: 'Two policy changes need attention.', tone: 'warning' },
    ] as const;
    const index = this.toastSequence();
    const example = examples[index % examples.length] ?? examples[0];
    this.toastSequence.set(index + 1);
    this.toasts.show(example.message, {
      title: example.title,
      tone: example.tone,
      duration: 0,
      actionLabel: example.tone === 'warning' ? 'Review' : undefined,
    });
  }

  protected adjustProgress(delta: number): void {
    this.progressValue.update((value) =>
      Math.min(this.progressMaximum(), Math.max(0, value + delta)),
    );
  }

  protected adjustMeter(delta: number): void {
    const minimum = this.numberArgument('min', 0);
    this.meterValue.update((value) =>
      Math.min(this.meterMaximum(), Math.max(minimum, value + delta)),
    );
  }
}
