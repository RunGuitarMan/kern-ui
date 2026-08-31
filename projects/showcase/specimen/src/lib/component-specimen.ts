import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  Injectable,
  input,
  LOCALE_ID,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KRN_CLIPBOARD_WRITER, type KrnClipboardWriter } from '@kern-ui/angular/cdk';
import { findKernComponent, type KernCatalogItem } from '@kern-ui/showcase';
import {
  KERN_PLAYGROUND_DEFINITIONS,
  findKernPlaygroundDefinition,
  localizeKernPlaygroundFixtureEffect,
  localizeKernPlaygroundStringArgument,
  resolveKernPlaygroundState,
  type KernPlaygroundEnvironment,
  type KernPlaygroundValue,
  type KernPlaygroundValues,
  type KernSpecimenScenario,
} from './playground';
import {
  KrnButton,
  KrnButtonGroup,
  KrnCopyButton,
  KrnDropdownButton,
  KrnFloatingActionButton,
  KrnIconButton,
  KrnLink,
  KrnSplitButton,
  KrnToggleButton,
  KrnToggleGroup,
} from '@kern-ui/angular/actions';
import {
  KrnBarChart,
  KrnDonutChart,
  KrnLineChart,
  type KrnChartDatum,
} from '@kern-ui/angular/addon-charts';
import { KrnDataGrid, type KrnDataColumn, type KrnDataGridMode } from '@kern-ui/angular/addon-grid';
import { KRN_TRANSLATIONS } from '@kern-ui/angular/core';
import {
  KrnAccordion,
  KrnAvatar,
  KrnAvatarGroup,
  KrnBadge,
  KrnCalendar,
  KrnCard,
  KrnChip,
  KrnCodeBlock,
  KrnDescriptionItem,
  KrnDescriptionList,
  KrnDisclosure,
  KrnKeyboardShortcut,
  KrnJsonView,
  KrnList,
  KrnListItem,
  KrnMeter,
  KrnRating,
  KrnResponsiveMedia,
  KrnStat,
  KrnTimeline,
  KrnTimelineItem,
  KrnTree,
  type KrnTreeNode,
} from '@kern-ui/angular/data-display';
import {
  KrnAlert,
  KrnAlertDialog,
  KrnBanner,
  KrnBottomSheet,
  KrnCircularProgress,
  KrnConfirmation,
  KrnDialog,
  KrnDrawer,
  KrnEmptyState,
  KrnErrorState,
  KrnHoverCard,
  KrnLoadingOverlay,
  KrnPopover,
  KrnProgressBar,
  KrnSkeleton,
  KrnSpinner,
  KrnSuccessState,
  KrnToastService,
  KrnToastViewport,
  KrnTooltip,
} from '@kern-ui/angular/feedback';
import {
  KrnAutocomplete,
  KrnCheckbox,
  KrnCheckboxGroup,
  KrnColorPicker,
  KrnCombobox,
  KrnDatePicker,
  KrnDateRangePicker,
  KrnDropUpload,
  KrnFileUpload,
  KrnFormField,
  KrnHint,
  KrnLabel,
  KrnMultiSelect,
  KrnNativeSelect,
  KrnNumberInput,
  KrnOtpInput,
  KrnPasswordInput,
  KrnRadio,
  KrnRadioGroup,
  KrnRangeSlider,
  KrnSearchInput,
  KrnSegmentedControl,
  KrnSelect,
  KrnSlider,
  KrnSwitch,
  KrnTagsInput,
  KrnTextInput,
  KrnTextarea,
  KrnTimePicker,
  KrnValidationMessage,
  type KrnSelectOption,
} from '@kern-ui/angular/forms';
import {
  KrnAppShell,
  KrnAspectRatio,
  KrnCenter,
  KrnCluster,
  KrnContainer,
  KrnDivider,
  KrnGrid,
  KrnHeader,
  KrnInline,
  KrnNavigationRail,
  KrnResizablePanel,
  KrnResizablePanels,
  KrnResizeHandle,
  KrnScrollArea,
  KrnShow,
  KrnSidebar,
  KrnSpacer,
  KrnSplitLayout,
  KrnStack,
} from '@kern-ui/angular/layout';
import {
  KrnBackButton,
  KrnBottomNavigation,
  KrnBreadcrumbs,
  KrnCommandPalette,
  KrnContextMenu,
  KrnMenu,
  KrnMenubar,
  KrnPagination,
  KrnSkipLink,
  KrnStepper,
  KrnTableOfContents,
  KrnTabs,
  KrnTreeNavigation,
  type KrnContextMenuItem,
  type KrnNavigationItem,
  type KrnTabItem,
  type KrnTocItem,
  type KrnTreeNavigationItem,
} from '@kern-ui/angular/navigation';
import {
  KrnCrudToolbar,
  KrnDashboardWidget,
  KrnFilterBar,
  KrnGlobalSearch,
  KrnLoginForm,
  KrnMasterDetailLayout,
  KrnMobileNavigation,
  KrnMultiStepForm,
  KrnNotificationCenter,
  KrnPageHeader,
  KrnProfileForm,
  KrnResponsiveApplicationShell,
  KrnSettingsPanel,
  KrnUserMenu,
  type KrnFilterDefinition,
  type KrnFormStep,
  type KrnNotification,
  type KrnProfileValue,
  type KrnSearchResult,
} from '@kern-ui/angular/patterns';

import { KERN_SPECIMEN_RENDERER_CONTROLS } from './specimen-renderer-controls';
import {
  resolveKernSpecimenFilterValues,
  resolveKernSpecimenGridMode,
  resolveKernSpecimenMenubarItems,
  resolveKernSpecimenNotifications,
  resolveKernSpecimenShortcutKeys,
} from './specimen-fixture-resolvers';

interface SpecimenRow extends Record<string, unknown> {
  readonly id: number;
  readonly workspace: string;
  readonly owner: string;
  readonly status: string;
  readonly usage: number;
}

export {
  KERN_SPECIMEN_CURATED_RENDERER_CONTROLS,
  KERN_SPECIMEN_RENDERER_CONTROLS,
} from './specimen-renderer-controls';
export {
  resolveKernSpecimenFilterValues,
  resolveKernSpecimenGridMode,
  resolveKernSpecimenMenubarItems,
  resolveKernSpecimenNotifications,
  resolveKernSpecimenShortcutKeys,
} from './specimen-fixture-resolvers';

type KernCopyFixtureState = 'live' | 'idle' | 'pending' | 'copied' | 'error';

@Injectable()
class KernSpecimenClipboardWriter implements KrnClipboardWriter {
  private readonly liveWriter = inject(KRN_CLIPBOARD_WRITER, { skipSelf: true });
  readonly fixtureState = signal<KernCopyFixtureState>('live');

  writeText(value: string): Promise<void> {
    switch (this.fixtureState()) {
      case 'live':
        return this.liveWriter.writeText(value);
      case 'pending':
        return new Promise<void>(() => undefined);
      case 'error':
        return Promise.reject(new Error('KERN_SPECIMEN_COPY_FAILED'));
      default:
        return Promise.resolve();
    }
  }
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
    KrnJsonView,
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
    ReactiveFormsModule,
    RouterLink,
  ],
  providers: [
    KernSpecimenClipboardWriter,
    {
      provide: KRN_CLIPBOARD_WRITER,
      useExisting: KernSpecimenClipboardWriter,
    },
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
  private readonly locale = inject(LOCALE_ID);

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
  protected readonly localizedFixtureEffect = computed(() => {
    const effect = this.effectiveFixtureEffect();
    return effect ? localizeKernPlaygroundFixtureEffect(this.locale, effect) : null;
  });
  protected readonly appliedArguments = computed(() => {
    const state = this.effectiveState();
    return this.playgroundDefinition().controls.flatMap((control) => {
      const value = state.args[control.key];
      return Object.is(value, control.defaultValue)
        ? []
        : [
            Object.freeze({
              key: control.key,
              value:
                typeof value === 'string'
                  ? localizeKernPlaygroundStringArgument(this.locale, control.key, value)
                  : JSON.stringify(value),
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
  protected readonly interactive = computed(() => this.playgroundDefinition().interactive);
  protected readonly supportingComponentIds = computed(
    () => this.playgroundDefinition().supportingComponentIds,
  );

  protected localized(english: string, russian: string): string {
    return this.locale === 'ru-RU' ? russian : english;
  }

  protected supportingComponentName(id: string): string {
    return findKernComponent(id)?.name ?? id;
  }

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toasts = inject(KrnToastService);
  private readonly clipboardWriter = inject(KernSpecimenClipboardWriter);
  protected readonly translations = inject(KRN_TRANSLATIONS);
  private readonly contextMenuTarget = viewChild<ElementRef<HTMLElement>>('contextMenuTarget');
  private readonly copyButtonTarget = viewChild<unknown, ElementRef<HTMLElement>>(
    'copyButtonTarget',
    { read: ElementRef },
  );
  protected readonly copyFixtureState = computed<KernCopyFixtureState>(() => {
    const state = this.stringArgument<KernCopyFixtureState>('copyState', 'live');
    return state === 'idle' || state === 'pending' || state === 'copied' || state === 'error'
      ? state
      : 'live';
  });
  protected readonly copyFixtureKey = computed(
    () => `${this.copyFixtureState()}:${this.resetRevision()}`,
  );
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
  protected readonly formFieldControl = new FormControl('Northstar', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  protected readonly paginationPage = signal(1);
  protected readonly togglePressed = signal(false);
  protected readonly toggleValues = signal<readonly string[]>(['list']);
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
    return length >= 3 && length <= 48
      ? ''
      : this.localized('Use 3–48 characters.', 'Используйте от 3 до 48 символов.');
  });
  protected readonly formFieldError = computed(() =>
    this.stringArgument<'default' | 'valid' | 'pending' | 'invalid'>('state', 'default') ===
    'invalid'
      ? this.localized('Use 3–48 characters.', 'Используйте от 3 до 48 символов.')
      : this.workspaceNameError(),
  );
  private lastItemId = '';
  private lastResetRevision = 0;
  private readonly synchronizedArguments = new Map<string, KernPlaygroundValue>();
  private readonly synchronizeFormFieldControl = effect(() => {
    if (this.item().id !== 'form-field') return;

    const state = this.stringArgument<'default' | 'valid' | 'pending' | 'invalid'>(
      'state',
      'default',
    );
    const disabled = this.booleanArgument('disabled', false);

    if (disabled && this.formFieldControl.enabled) {
      this.formFieldControl.disable();
    } else if (!disabled && this.formFieldControl.disabled) {
      this.formFieldControl.enable();
    }

    if (state === 'invalid') {
      this.formFieldControl.setValue('');
      this.formFieldControl.markAsTouched();
    } else if (state === 'valid') {
      this.formFieldControl.setValue('Northstar');
      this.formFieldControl.markAsTouched();
    } else if (state === 'pending') {
      this.formFieldControl.setValue('Northstar');
      this.formFieldControl.markAsPending();
    } else {
      this.formFieldControl.setValue('Northstar');
      this.formFieldControl.markAsPristine();
      this.formFieldControl.markAsUntouched();
      this.formFieldControl.updateValueAndValidity();
    }
  });
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
  protected readonly activeSelectOptions = computed(() => {
    const options =
      this.effectiveScenario() === 'stress' ? this.scaleSelectOptions : this.selectOptions;
    if (this.locale !== 'ru-RU') return options;

    return options.map((option) => {
      if (option.value.startsWith('option-')) {
        return {
          ...option,
          label: option.label.replace('Workspace option', 'Вариант рабочего пространства'),
          description: option.description ? 'Пример корпоративного поиска' : undefined,
        };
      }

      const russian = {
        starter: { label: 'Начальный' },
        team: { label: 'Командный', description: 'Для командной работы над продуктом' },
        scale: {
          label: 'Масштабный',
          description: 'Расширенное управление и контроль',
        },
      }[option.value];
      return russian ? { ...option, ...russian } : option;
    });
  });
  protected readonly stressFormFields = Array.from({ length: 200 }, (_, index) => ({
    id: `enterprise-field-${index + 1}`,
    label: this.localized(`Enterprise field ${index + 1}`, `Корпоративное поле ${index + 1}`),
    placeholder: this.localized(`Value ${index + 1}`, `Значение ${index + 1}`),
  }));
  protected readonly segmentOptions = computed(() => [
    { value: 'list', label: this.localized('List', 'Список') },
    { value: 'board', label: this.localized('Board', 'Доска') },
    { value: 'timeline', label: this.localized('Timeline', 'Хронология') },
  ]);
  protected readonly tabs: readonly KrnTabItem[] = [
    { id: 'overview', label: this.localized('Overview', 'Обзор'), badge: 8 },
    { id: 'activity', label: this.localized('Activity', 'Активность'), badge: 24 },
    { id: 'settings', label: this.localized('Settings', 'Настройки') },
  ];
  protected readonly breadcrumbs = computed(() => {
    const href = `/components/${this.item().id}#specimen`;
    return [
      { label: this.localized('Organization', 'Организация'), href },
      { label: this.localized('Operations', 'Операции'), href },
      { label: this.localized('Workspaces', 'Рабочие пространства'), href },
      { label: 'Northstar', href },
      { label: this.localized('Settings', 'Настройки'), current: true },
    ] as const;
  });
  protected readonly navigationItems: readonly KrnNavigationItem[] = [
    { id: 'overview', label: this.localized('Overview', 'Обзор'), icon: '⌂' },
    { id: 'activity', label: this.localized('Activity', 'Активность'), icon: '↗', badge: 4 },
    { id: 'reports', label: this.localized('Reports', 'Отчёты'), icon: '▤' },
    { id: 'archive', label: this.localized('Archive', 'Архив'), disabled: true },
  ];
  protected readonly activeMenubarItems = computed(() =>
    resolveKernSpecimenMenubarItems(
      this.stringArgument('itemState', 'default'),
      this.navigationItems,
    ),
  );
  protected readonly contextMenuItems: readonly KrnContextMenuItem[] = [
    {
      id: 'open',
      label: this.localized('Open workspace', 'Открыть рабочее пространство'),
      icon: '↗',
      shortcut: '↵',
    },
    {
      id: 'duplicate',
      label: this.localized('Duplicate', 'Дублировать'),
      icon: '⧉',
      shortcut: '⌘D',
    },
    {
      id: 'move',
      label: this.localized('Move to', 'Переместить в'),
      icon: '↪',
      children: [
        { id: 'move-operations', label: this.localized('Operations', 'Операции'), icon: 'O' },
        { id: 'move-research', label: this.localized('Research', 'Исследования'), icon: 'R' },
        {
          id: 'move-archive',
          label: this.localized('Archive', 'Архив'),
          icon: 'A',
          disabled: true,
        },
      ],
    },
    {
      id: 'archive',
      label: this.localized('Archive workspace', 'Архивировать рабочее пространство'),
      icon: '□',
      disabled: true,
    },
  ];
  protected readonly treeNavigationItems: readonly KrnTreeNavigationItem[] = [
    {
      id: 'workspace',
      label: 'Northstar',
      children: [
        { id: 'overview', label: this.localized('Overview', 'Обзор') },
        {
          id: 'operations',
          label: this.localized('Operations', 'Операции'),
          children: [
            { id: 'automations', label: this.localized('Automations', 'Автоматизации') },
            { id: 'audit', label: this.localized('Audit log', 'Журнал аудита') },
          ],
        },
      ],
    },
    { id: 'archive', label: this.localized('Archive', 'Архив') },
  ];
  private readonly asyncTreeNavigationItems: readonly KrnTreeNavigationItem[] = [
    {
      id: 'loading-workspace',
      label: this.localized('Loading workspace', 'Загрузка рабочего пространства'),
      childrenState: 'loading',
    },
    {
      id: 'failed-workspace',
      label: this.localized('Failed workspace', 'Рабочее пространство не загрузилось'),
      childrenState: 'error',
    },
    {
      id: 'ready-workspace',
      label: this.localized('Ready workspace', 'Рабочее пространство готово'),
      children: [{ id: 'ready-overview', label: this.localized('Overview', 'Обзор') }],
    },
  ];
  protected readonly activeTreeNavigationItems = computed(() =>
    this.effectiveScenario() === 'states'
      ? this.asyncTreeNavigationItems
      : this.treeNavigationItems,
  );
  protected readonly tocItems: readonly KrnTocItem[] = [
    { id: 'specimen-overview', label: this.localized('Overview', 'Обзор'), level: 2 },
    { id: 'specimen-api', label: this.localized('API contract', 'Контракт API'), level: 2 },
    { id: 'specimen-a11y', label: this.localized('Accessibility', 'Доступность'), level: 2 },
  ];
  protected readonly chartData: readonly KrnChartDatum[] = [
    { id: 'mon', label: this.localized('Mon', 'Пн'), value: 42 },
    { id: 'tue', label: this.localized('Tue', 'Вт'), value: 56 },
    { id: 'wed', label: this.localized('Wed', 'Ср'), value: 49 },
    { id: 'thu', label: this.localized('Thu', 'Чт'), value: 68 },
    { id: 'fri', label: this.localized('Fri', 'Пт'), value: 74 },
    { id: 'sat', label: this.localized('Sat', 'Сб'), value: 63 },
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
    {
      id: 1,
      workspace: 'Northstar',
      owner: 'A. Cole',
      status: this.localized('Healthy', 'В норме'),
      usage: 84,
    },
    {
      id: 2,
      workspace: 'Fieldnote',
      owner: 'M. Chen',
      status: this.localized('Attention', 'Требует внимания'),
      usage: 96,
    },
    {
      id: 3,
      workspace: 'Orchard',
      owner: 'R. Singh',
      status: this.localized('Healthy', 'В норме'),
      usage: 67,
    },
    {
      id: 4,
      workspace: 'Relay',
      owner: 'N. Costa',
      status: this.localized('Healthy', 'В норме'),
      usage: 72,
    },
  ];
  private readonly scaleRows: readonly SpecimenRow[] = Array.from(
    { length: 10_000 },
    (_, index) => ({
      id: index + 1,
      workspace: this.localized(
        `Workspace ${String(index + 1).padStart(5, '0')}`,
        `Рабочее пространство ${String(index + 1).padStart(5, '0')}`,
      ),
      owner: this.localized(`Owner ${(index % 97) + 1}`, `Владелец ${(index % 97) + 1}`),
      status:
        index % 11 === 0
          ? this.localized('Attention', 'Требует внимания')
          : this.localized('Healthy', 'В норме'),
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
    this.gridDataState() === 'error'
      ? this.localized(
          'Workspace data could not be loaded.',
          'Не удалось загрузить данные рабочего пространства.',
        )
      : '',
  );
  protected readonly dataTableGridMode = computed(() =>
    resolveKernSpecimenGridMode(this.booleanArgument('pagination', false)),
  );
  protected readonly dataGridMode = computed(() =>
    resolveKernSpecimenGridMode(
      this.booleanArgument('pagination', true),
      this.effectiveScenario() === 'virtual' || this.booleanArgument('virtualize', false),
    ),
  );
  protected readonly specimenColumns: readonly KrnDataColumn<SpecimenRow>[] = [
    {
      key: 'workspace',
      label: this.localized('Workspace', 'Рабочее пространство'),
      sortable: true,
      priority: 'primary',
    },
    { key: 'owner', label: this.localized('Owner', 'Владелец'), sortable: true },
    { key: 'status', label: this.localized('State', 'Состояние'), sortable: true },
    {
      key: 'usage',
      label: this.localized('Usage', 'Использование'),
      sortable: true,
      align: 'end',
      priority: 'primary',
    },
  ];
  private readonly pinnedSpecimenColumns: readonly KrnDataColumn<SpecimenRow>[] = [
    {
      key: 'workspace',
      label: this.localized('Workspace', 'Рабочее пространство'),
      sortable: true,
      priority: 'primary',
      width: 220,
      pinned: 'start',
    },
    { key: 'owner', label: this.localized('Owner', 'Владелец'), sortable: true, width: 260 },
    { key: 'status', label: this.localized('State', 'Состояние'), sortable: true, width: 220 },
    {
      key: 'usage',
      label: this.localized('Usage', 'Использование'),
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
  protected readonly jsonPayload = {
    deployment: {
      id: 'dep_01KERN',
      active: true,
      replicas: 3,
      regions: ['eu-central', 'us-east'],
    },
    limits: { cpu: 2, memory: '4Gi' },
    error: null,
  } as const;
  private readonly asyncTreeNodes: readonly KrnTreeNode[] = [
    {
      id: 'loading-projects',
      label: this.localized('Loading projects', 'Загрузка проектов'),
      childrenState: 'loading',
    },
    {
      id: 'failed-projects',
      label: this.localized('Failed projects', 'Проекты не загрузились'),
      childrenState: 'error',
    },
    {
      id: 'ready-projects',
      label: this.localized('Ready projects', 'Проекты готовы'),
      children: [{ id: 'ready-kern', label: 'kern' }],
    },
  ];
  private readonly scaleTreeNodes: readonly KrnTreeNode[] = Array.from(
    { length: 500 },
    (_, index) => ({
      id: `node-${index + 1}`,
      label: this.localized(
        `Enterprise node ${String(index + 1).padStart(3, '0')}`,
        `Корпоративный узел ${String(index + 1).padStart(3, '0')}`,
      ),
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
      description: this.localized('Operations workspace', 'Рабочее пространство операций'),
      group: this.localized('Workspace', 'Рабочее пространство'),
    },
    {
      id: 'fieldnote',
      label: 'Fieldnote',
      description: this.localized('Research project', 'Исследовательский проект'),
      group: this.localized('Project', 'Проект'),
    },
    {
      id: 'orchard',
      label: 'Orchard',
      description: this.localized('Commerce workspace', 'Рабочее пространство коммерции'),
      group: this.localized('Workspace', 'Рабочее пространство'),
    },
  ];
  protected readonly filters: readonly KrnFilterDefinition[] = [
    {
      id: 'state',
      label: this.localized('State', 'Состояние'),
      options: [
        { value: 'healthy', label: this.localized('Healthy', 'В норме'), count: 18 },
        { value: 'attention', label: this.localized('Attention', 'Требует внимания'), count: 6 },
      ],
    },
    {
      id: 'plan',
      label: this.localized('Plan', 'Тариф'),
      options: [
        { value: 'scale', label: this.localized('Scale', 'Масштабный'), count: 12 },
        { value: 'team', label: this.localized('Team', 'Командный'), count: 9 },
      ],
    },
  ];
  protected readonly notifications: readonly KrnNotification[] = [
    {
      id: 'n1',
      title: this.localized('Seat threshold reached', 'Достигнут лимит мест'),
      detail: this.localized(
        'Fieldnote is using 96% of its available seats.',
        'Fieldnote использует 96% доступных мест.',
      ),
      timestamp: this.localized('8 minutes ago', '8 минут назад'),
      read: false,
      tone: 'warning',
    },
    {
      id: 'n2',
      title: this.localized('Export completed', 'Экспорт завершён'),
      detail: this.localized(
        'The Q3 audit package is ready.',
        'Пакет аудита за 3-й квартал готов.',
      ),
      timestamp: this.localized('34 minutes ago', '34 минуты назад'),
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
    {
      id: 'workspace',
      label: this.localized('Workspace', 'Рабочее пространство'),
      description: this.localized('Identity', 'Идентичность'),
      valid: true,
    },
    {
      id: 'people',
      label: this.localized('People', 'Люди'),
      description: this.localized('Collaborators', 'Участники'),
      optional: true,
      valid: true,
    },
    {
      id: 'review',
      label: this.localized('Review', 'Проверка'),
      description: this.localized('Policy', 'Политика'),
      valid: true,
    },
  ];
  protected readonly profile: KrnProfileValue = {
    name: 'Avery Cole',
    role: this.localized('Operations lead', 'Руководитель операций'),
    bio: this.localized(
      'Designing calm systems for complicated work.',
      'Создаёт понятные системы для сложной работы.',
    ),
    timezone: 'Europe/Moscow',
  };
  protected readonly codeSnippet = `import { KrnButton } from '@kern-ui/angular/actions';

@Component({
  imports: [KrnButton],
  template: \`<button krnButton>Publish</button>\`,
})
export class Toolbar {}`;

  protected readonly rowIdentity = (row: SpecimenRow): number => row.id;
  protected readonly expandedRow = (row: SpecimenRow): string =>
    this.localized(
      `${row.workspace} is owned by ${row.owner}.`,
      `Владелец ${row.workspace} — ${row.owner}.`,
    );

  private contextMenuControlApplied = false;
  private lastCopyFixtureHost: HTMLElement | null = null;
  private readonly synchronizeSpecimenTarget = afterRenderEffect((onCleanup) => {
    const item = this.item();
    this.effectiveState();
    this.resetRevision();

    const canvas = this.host.nativeElement.querySelector<HTMLElement>('.specimen-canvas');
    if (!canvas) return;
    const markTarget = () => {
      for (const marked of canvas.querySelectorAll<HTMLElement>(
        '[data-specimen-target], [data-specimen-focus-target]',
      )) {
        marked.removeAttribute('data-specimen-target');
        marked.removeAttribute('data-specimen-focus-target');
        marked.removeAttribute('data-specimen-target-name');
      }

      let target: HTMLElement | null = null;
      try {
        target = canvas.querySelector<HTMLElement>(item.selector);
      } catch {
        return;
      }
      if (!target) return;

      target.setAttribute('data-specimen-target', '');
      target.setAttribute('data-specimen-target-name', item.name);
      const focusableSelector = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
      const focusTarget = target.matches(focusableSelector)
        ? target
        : target.querySelector<HTMLElement>(focusableSelector);
      focusTarget?.setAttribute('data-specimen-focus-target', '');
    };

    const MutationObserverConstructor = canvas.ownerDocument.defaultView?.MutationObserver;
    if (MutationObserverConstructor) {
      const observer = new MutationObserverConstructor(markTarget);
      observer.observe(canvas, { childList: true, subtree: true });
      onCleanup(() => observer.disconnect());
    }
    markTarget();
  });
  private readonly synchronizeCopyFixture = afterRenderEffect(() => {
    if (this.item().id !== 'copy-button') {
      this.lastCopyFixtureHost = null;
      return;
    }

    const state = this.copyFixtureState();
    this.clipboardWriter.fixtureState.set(state);
    const host = this.copyButtonTarget()?.nativeElement;
    if (!host || host === this.lastCopyFixtureHost) return;

    this.lastCopyFixtureHost = host;
    if (state === 'pending' || state === 'copied' || state === 'error') {
      host.querySelector<HTMLButtonElement>('button')?.click();
    }
  });
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
    this.toggleValues.set(['list']);
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
    const resolved = typeof value === 'string' ? value : fallback;
    return localizeKernPlaygroundStringArgument(this.locale, key, resolved) as T;
  }

  protected localizedStringArgument(
    key: string,
    englishDefault: string,
    russianDefault: string,
  ): string {
    const rawValue = this.argument(key);
    const value = typeof rawValue === 'string' ? rawValue : englishDefault;
    const localizedValue = localizeKernPlaygroundStringArgument(this.locale, key, value);
    return this.locale === 'ru-RU' && localizedValue === englishDefault
      ? russianDefault
      : localizedValue;
  }

  protected argumentOverride(key: string): KernPlaygroundValue | undefined {
    const control = this.playgroundDefinition().controls.find((candidate) => candidate.key === key);
    const value = this.argument(key);
    return control && Object.is(value, control.defaultValue) ? undefined : value;
  }

  protected stringArgumentOverride<T extends string>(key: string, fallback: T): T {
    const value = this.argumentOverride(key);
    const resolved = typeof value === 'string' ? value : fallback;
    return localizeKernPlaygroundStringArgument(this.locale, key, resolved) as T;
  }

  protected localizedStringArgumentOverride(
    key: string,
    englishDefault: string,
    russianDefault: string,
  ): string {
    const value = this.argumentOverride(key);
    if (typeof value === 'string') {
      return localizeKernPlaygroundStringArgument(this.locale, key, value);
    }
    return this.localized(englishDefault, russianDefault);
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
      {
        title: this.localized('Changes saved', 'Изменения сохранены'),
        message: this.localized(
          'Workspace settings were published.',
          'Настройки рабочего пространства опубликованы.',
        ),
        tone: 'success',
      },
      {
        title: this.localized('Export ready', 'Экспорт готов'),
        message: this.localized(
          'The audit package is ready to download.',
          'Пакет аудита готов к скачиванию.',
        ),
        tone: 'info',
      },
      {
        title: this.localized('Review requested', 'Требуется проверка'),
        message: this.localized(
          'Two policy changes need attention.',
          'Два изменения политики требуют внимания.',
        ),
        tone: 'warning',
      },
    ] as const;
    const index = this.toastSequence();
    const example = examples[index % examples.length] ?? examples[0];
    this.toastSequence.set(index + 1);
    this.toasts.show(example.message, {
      title: example.title,
      tone: example.tone,
      duration: 0,
      actionLabel: example.tone === 'warning' ? this.localized('Review', 'Проверить') : undefined,
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
