import { InjectionToken } from '@angular/core';
import { KRN_DEFAULT_LOADING_LABEL } from '@kern-ui/angular/i18n';

export interface KrnActionTranslations {
  readonly copyToClipboard: string;
  /**
   * Pending copy feedback. Optional so complete third-party dictionaries made
   * for earlier Kern versions remain source-compatible.
   */
  readonly copying?: string;
  readonly copied: string;
  readonly copyFailed: string;
  readonly moreActions: string;
}

export interface KrnDataGridTranslations {
  readonly ariaLabel: string;
  readonly empty: string;
  readonly filterPlaceholder: string;
  readonly columns: string;
  readonly errorTitle: string;
  readonly loading: string;
  readonly clearFilter: string;
  readonly selectAllVisible: string;
  readonly selectAllPage: string;
  readonly scrollRegion: string;
  readonly expand: string;
  readonly expandRow: string;
  readonly collapseRow: string;
  readonly pagination: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly rowCount: (count: number) => string;
  readonly filterLabel: (label: string) => string;
  readonly selectRow: (index: number) => string;
  readonly resizeColumn: (label: string) => string;
  readonly widthInPixels: (width: number) => string;
  readonly pageRange: (start: number, end: number, total: number) => string;
}

export interface KrnDataDisplayTranslations {
  readonly copy: string;
  readonly copied: string;
  readonly codeCopied: string;
  readonly plainText: string;
  readonly tag: string;
  readonly people: string;
  readonly list: string;
  readonly accordion: string;
  readonly timeline: string;
  readonly rating: string;
  readonly copyCode: (language: string) => string;
  readonly removeItem: (label: string) => string;
  readonly keyboardShortcut: (keys: readonly string[]) => string;
  readonly ratingValue: (value: number, maximum: number) => string;
}

export interface KrnCalendarTranslations {
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly today: string;
}

export interface KrnChartTranslations {
  readonly empty?: string;
  readonly viewData: string;
  readonly hideData: string;
  readonly total: string;
  readonly sourceData: string;
  readonly labelColumn: string;
  readonly valueColumn: string;
  readonly shareColumn: string;
  readonly legend: string;
  /**
   * Backward-compatible template. Prefer `formatPercentOfTotal` for new
   * locale packs that need grammar beyond the `{value}` token.
   */
  readonly percentOfTotal: string;
  readonly formatPercentOfTotal?: (value: string) => string;
  readonly additionalItems?: (count: number) => string;
  readonly datumLabel: (label: string, value: string) => string;
  readonly datumShareLabel: (label: string, value: string, share: string) => string;
  readonly sourceDataCaption: (title: string, sourceData: string) => string;
  readonly summary: (title: string, items: readonly string[]) => string;
}

export interface KrnDatePickerTranslations {
  readonly chooseDate: string;
  readonly chooseDateRange: string;
  readonly selectDate: string;
  readonly selectDateRange: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly clear: string;
  readonly today: string;
  readonly done: string;
  readonly notSelected: string;
  readonly chooseStartDate: string;
  readonly chooseEndDate: string;
}

export interface KrnTimePickerTranslations {
  readonly chooseTime: string;
  readonly selectTime: string;
  readonly twentyFourHourTime: string;
  readonly twentyFourHour: string;
  readonly time: string;
  readonly hour: string;
  readonly minute: string;
  readonly notSet: string;
  readonly keyboardHelp: string;
  readonly commonTimes: string;
  readonly clear: string;
  readonly apply: string;
}

export interface KrnColorPickerTranslations {
  readonly chooseColor: string;
  readonly preview: string;
  readonly suggestedColors: string;
  readonly hue: string;
  readonly saturation: string;
  readonly lightness: string;
  readonly colorValue: string;
  readonly validColor: string;
  readonly invalidColor: string;
  readonly done: string;
  readonly useColor: (color: string) => string;
}

export interface KrnToastTranslations {
  readonly ariaLabel: string;
  readonly stackLabel: string;
  readonly clearAll: string;
  readonly dismiss: string;
  readonly countLabel: (count: number) => string;
  readonly showRecent: string;
  readonly reviewEarlier: (count: number) => string;
  readonly limit: (visible: number, total: number) => string;
}

export interface KrnNavigationTranslations {
  readonly optional: string;
  readonly progress: string;
  readonly menuEmpty: string;
  readonly breadcrumb: string;
  readonly breadcrumbMore: string;
  readonly breadcrumbShowAll: string;
  readonly navigationTree: string;
  readonly tree: string;
  readonly pagination: string;
  readonly previous: string;
  readonly next: string;
  readonly noResults: string;
  /** Backward-compatible template containing the `{page}` token. */
  readonly pageLabel: string;
  readonly formatPageLabel?: (page: number) => string;
  /** Backward-compatible template containing `{start}`, `{end}`, and `{total}`. */
  readonly resultRangeLabel: string;
  readonly formatResultRangeLabel?: (start: number, end: number, total: number) => string;
  readonly actions: string;
  readonly openMenu: string;
  readonly applicationMenu: string;
  readonly contextActions: string;
  readonly sections: string;
  readonly commandPalette: string;
  readonly searchCommandsPlaceholder: string;
  readonly commands: string;
  readonly escapeShortcut: string;
  readonly commandSearch: string;
  /** Backward-compatible template containing the `{query}` token. */
  readonly noCommandResults: string;
  readonly formatNoCommandResults?: (query: string) => string;
  readonly commandNavigate: string;
  readonly commandSelect: string;
  readonly commandAvailableOne: string;
  /** Backward-compatible template containing the `{count}` token. */
  readonly commandAvailableMany: string;
  readonly formatCommandAvailableMany?: (count: number) => string;
  readonly primary: string;
  readonly tableOfContentsTitle: string;
  readonly tableOfContents: string;
  readonly back: string;
  readonly skipToMainContent: string;
  readonly expandNode: (label: string) => string;
  readonly collapseNode: (label: string) => string;
  readonly loadingChildren?: (label: string) => string;
  readonly childrenLoadFailed?: (label: string) => string;
  readonly tabItemCount: (count: string | number) => string;
}

export interface KrnFormTranslations {
  readonly chooseFiles: string;
  readonly fileSelectionRequired: string;
  readonly dropFilesHere: string;
  readonly selectedFiles: string;
  readonly unlimited: string;
  readonly increaseValue: string;
  readonly decreaseValue: string;
  readonly verificationCode: string;
  readonly tags: string;
  readonly addTag: string;
  readonly addTagPlaceholder: string;
  readonly added: string;
  readonly removed: string;
  readonly alreadyAdded: string;
  readonly selectOption: string;
  readonly selectOptions: string;
  readonly noOptions: string;
  readonly startTyping: string;
  readonly noMatches: string;
  readonly loadingOptions?: string;
  readonly optionsLoadFailed?: string;
  readonly showOptions: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly show: string;
  readonly hide: string;
  readonly search: string;
  readonly clearSearch: string;
  readonly value: string;
  readonly range: string;
  readonly minimumValue: string;
  readonly maximumValue: string;
  readonly chooseOption: string;
  readonly removeFile: (name: string) => string;
  readonly maximumFileCount: (name: string, count: number) => string;
  readonly unsupportedFileType: (name: string) => string;
  readonly fileTooLarge: (name: string, maximum: string) => string;
  readonly tagAdded: (tag: string) => string;
  readonly tagRemoved: (tag: string) => string;
  readonly tagAlreadyPresent: (tag: string) => string;
  readonly removeTag: (tag: string) => string;
  readonly verificationCharacter: (position: number, total: number) => string;
  readonly labeledValue: (label: string, value: number) => string;
}

export interface KrnFeedbackTranslations {
  readonly dialog: string;
  readonly close: string;
  readonly moreInformation: string;
  readonly preview: string;
  readonly dismissMessage: string;
  readonly progress: string;
  readonly loading: string;
  readonly loadingInProgress: string;
  readonly emptyStateTitle: string;
  readonly errorStateTitle: string;
  readonly successStateTitle: string;
  readonly delete: string;
  readonly confirmPrompt: string;
  readonly confirm: string;
  readonly cancel: string;
}

export interface KrnPatternTranslations {
  readonly globalSearch: string;
  readonly searchPlaceholder: string;
  readonly clearSearch: string;
  readonly resultLabel: (label: string) => string;
  readonly noSearchResults: (query: string) => string;
  readonly userActions: string;
  readonly notifications: string;
  readonly notificationCenter: string;
  readonly unread: string;
  readonly markAllRead: string;
  readonly notificationsEmpty: string;
  readonly filters: string;
  readonly all: string;
  readonly clearAll: string;
  readonly settings: string;
  readonly closeSettings: string;
  readonly actions: string;
  readonly masterList: string;
  readonly detail: string;
  readonly mobileNavigation: string;
  readonly signIn: string;
  readonly email: string;
  readonly invalidEmail: string;
  readonly password: string;
  readonly rememberMe: string;
  readonly forgotPassword: string;
  readonly signingIn: string;
  readonly unsavedChanges: string;
  readonly displayName: string;
  readonly displayNameRequired: string;
  readonly role: string;
  readonly bio: string;
  readonly bioMaximumLength: (maximumLength: number) => string;
  readonly timezone: string;
  readonly timezoneUnavailable: string;
  readonly saving: string;
  readonly saveProfile: string;
  readonly complete: string;
  readonly formProgress: string;
  readonly optional: string;
  readonly back: string;
  readonly continue: string;
  readonly step: string;
  readonly unreadCount: (count: number) => string;
  readonly activeFilters: (count: number) => string;
  readonly selectedCount: (count: number) => string;
  readonly minimumPasswordLength: (minimumLength: number) => string;
  readonly stepCounter: (current: number, total: number) => string;
  readonly profileTimezones: readonly {
    readonly value: string;
    readonly label: string;
  }[];
}

export interface KrnLayoutTranslations {
  readonly mobileNavigation: string;
  readonly openNavigation: string;
  readonly closeNavigation: string;
  readonly primaryNavigation: string;
  readonly secondaryNavigation: string;
  readonly scrollableContent: string;
  readonly resizeAdjacentPanels: string;
}

export interface KrnTranslations {
  readonly actions: KrnActionTranslations;
  readonly dataDisplay: KrnDataDisplayTranslations;
  readonly dataGrid: KrnDataGridTranslations;
  readonly calendar: KrnCalendarTranslations;
  readonly chart: KrnChartTranslations;
  readonly datePicker: KrnDatePickerTranslations;
  readonly timePicker: KrnTimePickerTranslations;
  readonly colorPicker: KrnColorPickerTranslations;
  readonly toast: KrnToastTranslations;
  readonly navigation: KrnNavigationTranslations;
  readonly forms: KrnFormTranslations;
  readonly feedback: KrnFeedbackTranslations;
  readonly patterns: KrnPatternTranslations;
  readonly layout: KrnLayoutTranslations;
}

export type KrnTranslationsPatch = {
  readonly [Group in keyof KrnTranslations]?: Partial<KrnTranslations[Group]>;
};

/**
 * Resolves a typed translation formatter or, for backward compatibility,
 * interpolates only exact `{token}` entries from a legacy string template.
 *
 * Interpolation is single-pass: replacement values are text, are never
 * evaluated, and cannot introduce a second placeholder expansion.
 */
export function krnFormatTranslation<Arguments extends readonly unknown[]>(
  template: string,
  parameters: Readonly<Record<string, string | number>>,
  formatter: ((...args: Arguments) => string) | undefined,
  ...args: Arguments
): string {
  if (formatter) return formatter(...args);

  let result = '';
  let cursor = 0;
  while (cursor < template.length) {
    const tokenStart = template.indexOf('{', cursor);
    if (tokenStart < 0) {
      result += template.slice(cursor);
      break;
    }

    const tokenEnd = template.indexOf('}', tokenStart + 1);
    if (tokenEnd < 0) {
      result += template.slice(cursor);
      break;
    }

    const token = template.slice(tokenStart + 1, tokenEnd);
    result += template.slice(cursor, tokenStart);
    result += Object.prototype.hasOwnProperty.call(parameters, token)
      ? String(parameters[token])
      : template.slice(tokenStart, tokenEnd + 1);
    cursor = tokenEnd + 1;
  }

  return result;
}

export const KRN_ENGLISH_TRANSLATIONS: Readonly<KrnTranslations> = Object.freeze({
  actions: Object.freeze({
    copyToClipboard: 'Copy to clipboard',
    copying: 'Copying…',
    copied: 'Copied',
    copyFailed: 'Could not copy',
    moreActions: 'More actions',
  }),
  dataDisplay: Object.freeze({
    copy: 'Copy',
    copied: 'Copied',
    codeCopied: 'Code copied to clipboard',
    plainText: 'text',
    tag: 'tag',
    people: 'People',
    list: 'List',
    accordion: 'Accordion',
    timeline: 'Timeline',
    rating: 'Rating',
    copyCode: (language: string): string => `Copy ${language} code`,
    removeItem: (label: string): string => `Remove ${label}`,
    keyboardShortcut: (keys: readonly string[]): string => keys.join(' plus '),
    ratingValue: (value: number, maximum: number): string => `${value} of ${maximum}`,
  }),
  dataGrid: Object.freeze({
    ariaLabel: 'Data grid',
    empty: 'No data to display',
    filterPlaceholder: 'Filter rows…',
    columns: 'Columns',
    errorTitle: 'Could not load data',
    loading: 'Loading data',
    clearFilter: 'Clear filter',
    selectAllVisible: 'Select all visible rows',
    selectAllPage: 'Select all rows on this page',
    scrollRegion: 'Scrollable data table',
    expand: 'Expand',
    expandRow: 'Expand row',
    collapseRow: 'Collapse row',
    pagination: 'Table pagination',
    previousPage: 'Previous',
    nextPage: 'Next',
    rowCount: (count: number): string => `${count} ${count === 1 ? 'row' : 'rows'}`,
    filterLabel: (label: string): string => `Filter ${label}`,
    selectRow: (index: number): string => `Select row ${index}`,
    resizeColumn: (label: string): string => `Resize ${label}`,
    widthInPixels: (width: number): string => `${width} pixels`,
    pageRange: (start: number, end: number, total: number): string => `${start}–${end} of ${total}`,
  }),
  calendar: Object.freeze({
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
  }),
  chart: Object.freeze({
    empty: 'No chart data',
    viewData: 'View data',
    hideData: 'Hide data',
    total: 'Total',
    sourceData: 'source data',
    labelColumn: 'Label',
    valueColumn: 'Value',
    shareColumn: 'Share',
    legend: 'Chart legend',
    percentOfTotal: '{value} of total',
    formatPercentOfTotal: (value: string): string => `${value} of total`,
    additionalItems: (count: number): string => `${count} more data points`,
    datumLabel: (label: string, value: string): string => `${label}: ${value}`,
    datumShareLabel: (label: string, value: string, share: string): string =>
      `${label}: ${value}, ${share}`,
    sourceDataCaption: (title: string, sourceData: string): string => `${title} — ${sourceData}`,
    summary: (title: string, items: readonly string[]): string => `${title}. ${items.join(', ')}`,
  }),
  datePicker: Object.freeze({
    chooseDate: 'Choose date',
    chooseDateRange: 'Choose date range',
    selectDate: 'Select a date',
    selectDateRange: 'Select a date range',
    startDate: 'Start date',
    endDate: 'End date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    clear: 'Clear',
    today: 'Today',
    done: 'Done',
    notSelected: 'Not selected',
    chooseStartDate: 'Choose a start date',
    chooseEndDate: 'Now choose an end date',
  }),
  timePicker: Object.freeze({
    chooseTime: 'Choose time',
    selectTime: 'Select a time',
    twentyFourHourTime: '24-hour time',
    twentyFourHour: '24-hour',
    time: 'Time',
    hour: 'Hour',
    minute: 'Minute',
    notSet: 'Not set',
    keyboardHelp: 'Use arrow keys to adjust each value.',
    commonTimes: 'Common times',
    clear: 'Clear',
    apply: 'Apply',
  }),
  colorPicker: Object.freeze({
    chooseColor: 'Choose color',
    preview: 'Preview',
    suggestedColors: 'Suggested colors',
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    colorValue: 'Color value',
    validColor: 'Valid hexadecimal color.',
    invalidColor: 'Enter a valid hexadecimal color.',
    done: 'Done',
    useColor: (color: string): string => `Use color ${color}`,
  }),
  toast: Object.freeze({
    ariaLabel: 'Notifications',
    stackLabel: 'Notification stack',
    clearAll: 'Clear all',
    dismiss: 'Dismiss notification',
    countLabel: (count: number): string => (count === 1 ? 'notification' : 'notifications'),
    showRecent: 'Show recent',
    reviewEarlier: (count: number): string => `Review ${count} earlier`,
    limit: (visible: number, total: number): string =>
      `Showing the latest ${visible} of ${total} notifications.`,
  }),
  navigation: Object.freeze({
    optional: 'Optional',
    progress: 'Progress',
    menuEmpty: 'No actions available',
    breadcrumb: 'Breadcrumb',
    breadcrumbMore: 'More',
    breadcrumbShowAll: 'Show all breadcrumb items',
    navigationTree: 'Navigation tree',
    tree: 'Tree',
    pagination: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    noResults: 'No results',
    pageLabel: 'Page {page}',
    formatPageLabel: (page: number): string => `Page ${page}`,
    resultRangeLabel: 'Showing {start} to {end} of {total}',
    formatResultRangeLabel: (start: number, end: number, total: number): string =>
      `Showing ${start} to ${end} of ${total}`,
    actions: 'Actions',
    openMenu: 'Open menu',
    applicationMenu: 'Application menu',
    contextActions: 'Context actions',
    sections: 'Sections',
    commandPalette: 'Command palette',
    searchCommandsPlaceholder: 'Search commands…',
    commands: 'Commands',
    escapeShortcut: 'Esc',
    commandSearch: 'Search commands',
    noCommandResults: 'No commands match “{query}”',
    formatNoCommandResults: (query: string): string => `No commands match “${query}”`,
    commandNavigate: 'Navigate',
    commandSelect: 'Select',
    commandAvailableOne: '1 command available',
    commandAvailableMany: '{count} commands available',
    formatCommandAvailableMany: (count: number): string => `${count} commands available`,
    primary: 'Primary',
    tableOfContentsTitle: 'On this page',
    tableOfContents: 'Table of contents',
    back: 'Back',
    skipToMainContent: 'Skip to main content',
    expandNode: (label: string): string => `Expand ${label}`,
    collapseNode: (label: string): string => `Collapse ${label}`,
    loadingChildren: (label: string): string => `Loading children for ${label}`,
    childrenLoadFailed: (label: string): string => `Could not load children for ${label}`,
    tabItemCount: (count: string | number): string =>
      typeof count === 'number' ? `${count} ${count === 1 ? 'item' : 'items'}` : count,
  }),
  forms: Object.freeze({
    chooseFiles: 'Choose files',
    fileSelectionRequired: 'At least one file is required.',
    dropFilesHere: 'Drop files here',
    selectedFiles: 'Selected files',
    unlimited: 'Unlimited',
    increaseValue: 'Increase value',
    decreaseValue: 'Decrease value',
    verificationCode: 'Verification code',
    tags: 'Tags',
    addTag: 'Add tag',
    addTagPlaceholder: 'Add a tag',
    added: 'Added',
    removed: 'Removed',
    alreadyAdded: 'Already added',
    selectOption: 'Select an option',
    selectOptions: 'Select options',
    noOptions: 'No options',
    startTyping: 'Start typing',
    noMatches: 'No matches',
    loadingOptions: 'Loading options…',
    optionsLoadFailed: 'Could not load options',
    showOptions: 'Show options',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    show: 'Show',
    hide: 'Hide',
    search: 'Search',
    clearSearch: 'Clear search',
    value: 'Value',
    range: 'Range',
    minimumValue: 'Minimum value',
    maximumValue: 'Maximum value',
    chooseOption: 'Choose an option',
    removeFile: (name: string): string => `Remove ${name}`,
    maximumFileCount: (name: string, count: number): string =>
      `${name}: maximum file count is ${count}.`,
    unsupportedFileType: (name: string): string => `${name}: unsupported file type.`,
    fileTooLarge: (name: string, maximum: string): string =>
      `${name}: file is larger than ${maximum}.`,
    tagAdded: (tag: string): string => `${tag} added.`,
    tagRemoved: (tag: string): string => `${tag} removed.`,
    tagAlreadyPresent: (tag: string): string => `${tag} is already present.`,
    removeTag: (tag: string): string => `Remove ${tag}`,
    verificationCharacter: (position: number, total: number): string =>
      `Character ${position} of ${total}`,
    labeledValue: (label: string, value: number): string => `${label}: ${value}`,
  }),
  feedback: Object.freeze({
    dialog: 'Dialog',
    close: 'Close',
    moreInformation: 'More information',
    preview: 'Preview',
    dismissMessage: 'Dismiss message',
    progress: 'Progress',
    loading: 'Loading',
    loadingInProgress: KRN_DEFAULT_LOADING_LABEL,
    emptyStateTitle: 'Nothing here yet',
    errorStateTitle: 'Something went wrong',
    successStateTitle: 'Completed',
    delete: 'Delete',
    confirmPrompt: 'Are you sure?',
    confirm: 'Confirm',
    cancel: 'Cancel',
  }),
  patterns: Object.freeze({
    globalSearch: 'Global search',
    searchPlaceholder: 'Search…',
    clearSearch: 'Clear search',
    resultLabel: (label: string): string => `${label} results`,
    noSearchResults: (query: string): string => `No results for “${query}”`,
    userActions: 'User actions',
    notifications: 'Notifications',
    notificationCenter: 'Notification center',
    unread: 'Unread',
    markAllRead: 'Mark all read',
    notificationsEmpty: 'You are all caught up.',
    filters: 'Filters',
    all: 'All',
    clearAll: 'Clear all',
    settings: 'Settings',
    closeSettings: 'Close settings',
    actions: 'Actions',
    masterList: 'Master list',
    detail: 'Detail',
    mobileNavigation: 'Mobile navigation',
    signIn: 'Sign in',
    email: 'Email',
    invalidEmail: 'Enter a valid email address.',
    password: 'Password',
    rememberMe: 'Keep me signed in',
    forgotPassword: 'Forgot password?',
    signingIn: 'Signing in…',
    unsavedChanges: 'Unsaved changes',
    displayName: 'Display name',
    displayNameRequired: 'Add a display name.',
    role: 'Role',
    bio: 'Bio',
    bioMaximumLength: (maximumLength: number): string =>
      `Bio must contain at most ${maximumLength} characters.`,
    timezone: 'Timezone',
    timezoneUnavailable: 'Select an available timezone.',
    saving: 'Saving…',
    saveProfile: 'Save profile',
    complete: 'Complete',
    formProgress: 'Form progress',
    optional: 'Optional',
    back: 'Back',
    continue: 'Continue',
    step: 'Step',
    unreadCount: (count: number): string => `${count} unread`,
    activeFilters: (count: number): string => `${count} active`,
    selectedCount: (count: number): string => `${count} selected`,
    minimumPasswordLength: (minimumLength: number): string =>
      `Password must contain at least ${minimumLength} characters.`,
    stepCounter: (current: number, total: number): string => `Step ${current} of ${total}`,
    profileTimezones: Object.freeze([
      { value: 'UTC', label: 'UTC' },
      { value: 'Europe/London', label: 'London (GMT/BST)' },
      { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
      { value: 'America/New_York', label: 'New York (ET)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    ]),
  }),
  layout: Object.freeze({
    mobileNavigation: 'Mobile navigation',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    primaryNavigation: 'Primary navigation',
    secondaryNavigation: 'Secondary navigation',
    scrollableContent: 'Scrollable content',
    resizeAdjacentPanels: 'Resize adjacent panels',
  }),
});

const LEGACY_FORMATTER_FIELDS: Readonly<
  Partial<
    Record<
      keyof KrnTranslations,
      readonly (readonly [legacyField: string, formatterField: string, tokens: readonly string[]])[]
    >
  >
> = Object.freeze({
  chart: Object.freeze([
    Object.freeze(['percentOfTotal', 'formatPercentOfTotal', Object.freeze(['value'])] as const),
  ]),
  navigation: Object.freeze([
    Object.freeze(['pageLabel', 'formatPageLabel', Object.freeze(['page'])] as const),
    Object.freeze([
      'resultRangeLabel',
      'formatResultRangeLabel',
      Object.freeze(['start', 'end', 'total']),
    ] as const),
    Object.freeze([
      'noCommandResults',
      'formatNoCommandResults',
      Object.freeze(['query']),
    ] as const),
    Object.freeze([
      'commandAvailableMany',
      'formatCommandAvailableMany',
      Object.freeze(['count']),
    ] as const),
  ]),
});

/**
 * Creates an immutable, complete translation set from a typed partial
 * override. When a patch overrides a legacy template without its corresponding
 * typed formatter, the resulting complete dictionary derives a safe formatter
 * from that template instead of retaining the unrelated English formatter.
 */
export function createKrnTranslations(patch: KrnTranslationsPatch = {}): Readonly<KrnTranslations> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(KRN_ENGLISH_TRANSLATIONS).map(([groupName, defaults]) => {
        const group = groupName as keyof KrnTranslations;
        const overrides = (patch[group] ?? {}) as Readonly<Record<string, unknown>>;
        const translations: Record<string, unknown> = {
          ...defaults,
          ...overrides,
        };

        for (const [legacyField, formatterField, tokens] of LEGACY_FORMATTER_FIELDS[group] ?? []) {
          if (
            Object.prototype.hasOwnProperty.call(overrides, legacyField) &&
            !Object.prototype.hasOwnProperty.call(overrides, formatterField)
          ) {
            const template = translations[legacyField];
            if (typeof template === 'string') {
              translations[formatterField] = (...args: unknown[]): string => {
                const parameters = Object.fromEntries(
                  tokens.map((token, index) => [token, String(args[index] ?? '')]),
                ) as Readonly<Record<string, string>>;
                return krnFormatTranslation(template, parameters, undefined);
              };
            }
          }
        }

        return [group, Object.freeze(translations)];
      }),
    ) as unknown as KrnTranslations,
  );
}

/**
 * Replaceable application-wide UI copy. Component-level label inputs remain
 * available for one-off overrides.
 */
export const KRN_TRANSLATIONS = new InjectionToken<Readonly<KrnTranslations>>('KRN_TRANSLATIONS', {
  providedIn: 'root',
  factory: () => KRN_ENGLISH_TRANSLATIONS,
});
