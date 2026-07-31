const defineRecipe = (recipe) => Object.freeze(recipe);

const reactiveFormRecipe = ({
  title,
  scenario,
  template,
  controlType,
  initialValue,
  extraValueImports = {},
  extraTypeImports = {},
  componentImports = [],
  members = [],
  riskTags = ['forms'],
  assertions = ['formControl'],
}) =>
  defineRecipe({
    title,
    scenario,
    template,
    valueImports: {
      '@angular/forms': ['FormControl', 'ReactiveFormsModule'],
      ...extraValueImports,
    },
    typeImports: extraTypeImports,
    componentImports: ['ReactiveFormsModule', ...componentImports],
    members: [
      `readonly control = new FormControl<${controlType}>(${initialValue}, { nonNullable: true });`,
      ...members,
    ],
    riskTags,
    assertions,
  });

const overlayRecipe = ({ title, scenario, selector, heading, body, extra = '' }) =>
  defineRecipe({
    title,
    scenario,
    template: `
      <button type="button" (click)="open = true">Open ${heading}</button>
      <${selector}
        [(open)]="open"
        title="${heading}"
        description="${body}"
        ${extra}
      >
        <p>${body}</p>
        <button krnDialogAction type="button" (click)="open = false">Done</button>
      </${selector}>
    `,
    members: ['open = false;'],
    riskTags: ['overlay', 'controlled-state'],
    assertions: ['[(open)]="open"', 'open = false'],
  });

/**
 * Every catalog id is deliberately listed here. Helpers only remove mechanical Angular Forms and
 * overlay boilerplate; there is no fallback recipe. The generator rejects missing and stale ids.
 */
export const KERN_AGENT_EXAMPLE_RECIPES = Object.freeze({
  'app-shell': defineRecipe({
    title: 'Responsive application shell',
    scenario: 'Compose header, navigation and main content with controlled mobile navigation.',
    template: `
      <krn-app-shell [(mobileNavigationOpen)]="navigationOpen">
        <header krnAppHeader>Operations workspace</header>
        <nav krnAppSidebar aria-label="Workspace">Overview · Reports · Settings</nav>
        <main>
          <h1>Overview</h1>
          <p>Quarterly operating summary.</p>
        </main>
      </krn-app-shell>
    `,
    members: ['navigationOpen = false;'],
    riskTags: ['layout', 'controlled-state'],
    assertions: ['[(mobileNavigationOpen)]="navigationOpen"'],
  }),
  header: defineRecipe({
    title: 'Application header',
    scenario: 'Arrange product identity, page context and account actions.',
    template: `
      <krn-header sticky>
        <strong krnHeaderStart>KERN Console</strong>
        <span>Production</span>
        <button krnHeaderEnd type="button">Account</button>
      </krn-header>
    `,
  }),
  sidebar: defineRecipe({
    title: 'Collapsible workspace sidebar',
    scenario: 'Keep sidebar collapse state application-owned.',
    template: `
      <krn-sidebar [(collapsed)]="collapsed" ariaLabel="Workspace navigation">
        <strong krnSidebarHeader>Workspace</strong>
        <nav aria-label="Sections">Overview · Members · Audit log</nav>
        <small krnSidebarFooter>Acme Europe</small>
      </krn-sidebar>
    `,
    members: ['collapsed = false;'],
    riskTags: ['controlled-state'],
    assertions: ['[(collapsed)]="collapsed"'],
  }),
  'navigation-rail': defineRecipe({
    title: 'Expandable navigation rail',
    scenario: 'Expose compact navigation while preserving controlled expansion.',
    template: `
      <krn-navigation-rail [(expanded)]="expanded" ariaLabel="Primary navigation">
        <strong krnRailHeader>AC</strong>
        <nav aria-label="Primary">Home · Tasks · Reports</nav>
        <button krnRailFooter type="button">Help</button>
      </krn-navigation-rail>
    `,
    members: ['expanded = false;'],
    riskTags: ['controlled-state'],
    assertions: ['[(expanded)]="expanded"'],
  }),
  container: defineRecipe({
    title: 'Bounded content container',
    scenario: 'Center page content with a stable readable width.',
    template: `
      <krn-container size="lg">
        <h1>Customer portfolio</h1>
        <p>Review ownership, risk and renewal dates.</p>
      </krn-container>
    `,
  }),
  stack: defineRecipe({
    title: 'Vertical form stack',
    scenario: 'Apply consistent vertical rhythm to related content.',
    template: `
      <krn-stack gap="4">
        <h2>Billing profile</h2>
        <p>Invoices are sent to the finance owner.</p>
        <button type="button">Edit profile</button>
      </krn-stack>
    `,
  }),
  inline: defineRecipe({
    title: 'Inline action row',
    scenario: 'Align related actions with predictable wrapping.',
    template: `
      <krn-inline gap="2" justify="end" [wrap]="true">
        <button type="button">Cancel</button>
        <button type="button">Save changes</button>
      </krn-inline>
    `,
  }),
  cluster: defineRecipe({
    title: 'Wrapping metadata cluster',
    scenario: 'Wrap independent metadata items without manual margins.',
    template: `
      <krn-cluster gap="2">
        <span>Owner: Platform</span>
        <span>Region: EU</span>
        <span>Status: Healthy</span>
      </krn-cluster>
    `,
  }),
  grid: defineRecipe({
    title: 'Responsive summary grid',
    scenario: 'Lay out metric cards with a minimum usable column width.',
    template: `
      <krn-grid columns="auto" minColumnWidth="14rem" gap="4">
        <article>Revenue: €1.8M</article>
        <article>Renewals: 42</article>
        <article>Risk accounts: 3</article>
      </krn-grid>
    `,
  }),
  'split-layout': defineRecipe({
    title: 'Master and supporting content',
    scenario: 'Compose a responsive primary and secondary column.',
    template: `
      <krn-split-layout ratio="2fr 1fr" collapseAt="md">
        <main krnSplitPrimary>
          <h1>Account health</h1>
          <p>Primary analysis and recent activity.</p>
        </main>
        <aside krnSplitSecondary>Owner and renewal details</aside>
      </krn-split-layout>
    `,
  }),
  center: defineRecipe({
    title: 'Centered empty-state copy',
    scenario: 'Constrain and center a short content block.',
    template: `
      <krn-center maxWidth="32rem" [intrinsic]="true">
        <h2>No incidents</h2>
        <p>All monitored services are currently healthy.</p>
      </krn-center>
    `,
  }),
  spacer: defineRecipe({
    title: 'Semantic layout spacer',
    scenario: 'Reserve tokenized vertical space between independent regions.',
    template: `
      <p>Summary</p>
      <krn-spacer size="6" axis="vertical" />
      <p>Detailed report</p>
    `,
  }),
  divider: defineRecipe({
    title: 'Labeled section divider',
    scenario: 'Separate two form sections with visible context.',
    template: `<krn-divider label="Advanced settings" />`,
  }),
  'aspect-ratio': defineRecipe({
    title: 'Stable media preview',
    scenario: 'Reserve a 16:9 region before preview content is available.',
    template: `
      <krn-aspect-ratio ratio="16 / 9" fit="cover">
        <div role="img" aria-label="Quarterly report preview">Q3 report preview</div>
      </krn-aspect-ratio>
    `,
  }),
  'scroll-area': defineRecipe({
    title: 'Keyboard-accessible activity log',
    scenario: 'Constrain a long activity stream without hiding keyboard access.',
    template: `
      <krn-scroll-area
        axis="vertical"
        maxBlockSize="16rem"
        ariaLabel="Recent account activity"
        [keyboardAccessible]="true"
      >
        <ol>
          <li>Contract approved</li>
          <li>Risk review completed</li>
          <li>Renewal owner assigned</li>
        </ol>
      </krn-scroll-area>
    `,
  }),
  'responsive-show-hide': defineRecipe({
    title: 'Responsive supporting guidance',
    scenario: 'Show supplemental copy only when its target layout has enough room.',
    template: `
      <krn-responsive-show-hide from="md" display="block">
        Keyboard shortcuts are available from the command palette.
      </krn-responsive-show-hide>
    `,
  }),
  'resizable-panels': defineRecipe({
    title: 'Controlled resizable workspace',
    scenario: 'Compose panels and a keyboard-operable resize handle with owned sizes.',
    template: `
      <krn-resizable-panels [(sizes)]="panelSizes" orientation="horizontal">
        <krn-resizable-panel id="customer-list" ariaLabel="Customer list">
          Customer list
        </krn-resizable-panel>
        <krn-resize-handle ariaLabel="Resize customer list and details" />
        <krn-resizable-panel id="customer-detail" ariaLabel="Customer details">
          Customer details
        </krn-resizable-panel>
      </krn-resizable-panels>
    `,
    valueImports: {
      '@kern-ui/angular/kit': ['KrnResizablePanel', 'KrnResizeHandle'],
    },
    componentImports: ['KrnResizablePanel', 'KrnResizeHandle'],
    members: ['panelSizes: readonly number[] = [38, 62];'],
    riskTags: ['controlled-state', 'compound-component'],
    assertions: ['[(sizes)]="panelSizes"', 'readonly number[]'],
  }),
  button: defineRecipe({
    title: 'Primary save action',
    scenario: 'Render an explicit form action with scoped visual and loading-copy defaults.',
    template: `
      <form (submit)="saving = true; $event.preventDefault()">
        <button krnButton type="submit" [loading]="saving">Save changes</button>
      </form>
    `,
    valueImports: {
      '@kern-ui/angular/kit': ['provideKrnButtonOptions'],
    },
    providers: [
      `provideKrnButtonOptions({
        size: 'lg',
        loadingLabel: 'Saving workspace…',
      })`,
    ],
    members: ['saving = false;'],
    riskTags: ['forms', 'controlled-state', 'scoped-options', 'accessibility-copy'],
    assertions: ['provideKrnButtonOptions', 'loadingLabel', '[loading]="saving"'],
  }),
  'icon-button': defineRecipe({
    title: 'Accessible icon-only action',
    scenario: 'Keep the accessible name and native action semantics on the icon-only button host.',
    template: `<button krnIconButton type="button" aria-label="Add team member">+</button>`,
    assertions: ['button krnIconButton', 'type="button"', 'aria-label="Add team member"'],
  }),
  'button-group': defineRecipe({
    title: 'Grouped review actions',
    scenario: 'Present independent native actions as one labeled visual group.',
    template: `
      <div krnButtonGroup aria-label="Review actions">
        <button krnButton type="button" variant="outline">Request changes</button>
        <button krnButton type="button">Approve</button>
      </div>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnButton'] },
    componentImports: ['KrnButton'],
    riskTags: ['compound-component', 'accessibility-copy'],
    assertions: ['div krnButtonGroup', 'aria-label="Review actions"', 'type="button"'],
  }),
  'split-button': defineRecipe({
    title: 'Primary export with alternatives',
    scenario: 'Keep the default action prominent and expose related export formats.',
    template: `
      <krn-split-button [(open)]="open">
        <span krnLabel>Export CSV</span>
        <div krnMenu>
          <button type="button">Export XLSX</button>
          <button type="button">Export JSON</button>
        </div>
      </krn-split-button>
    `,
    members: ['open = false;'],
    riskTags: ['overlay', 'controlled-state'],
    assertions: ['[(open)]="open"'],
  }),
  'floating-action-button': defineRecipe({
    title: 'Create-record floating action',
    scenario: 'Expose a single high-priority creation action on compact layouts.',
    template: `
      <button krnFab type="button">
        <span krnFabIcon>+</span>
        Create customer
      </button>
    `,
    assertions: ['button krnFab', 'type="button"', 'Create customer'],
  }),
  'toggle-button': defineRecipe({
    title: 'Controlled formatting toggle',
    scenario: 'Keep formatting state controlled while native button semantics remain intact.',
    template: `
      <button
        krnToggleButton
        type="button"
        value="bold"
        [(pressed)]="boldEnabled"
      >
        Bold
      </button>
    `,
    members: ['boldEnabled = false;'],
    assertions: ['button', 'krnToggleButton', 'value="bold"', '[(pressed)]="boldEnabled"'],
  }),
  'toggle-group': defineRecipe({
    title: 'Multi-select view controls',
    scenario: 'Control a set of pressed view options by stable string values.',
    template: `
      <div
        krnToggleGroup
        aria-label="Visible dashboard layers"
        [multiple]="true"
        [(values)]="visibleLayers"
      >
        <button krnToggleButton value="targets">Targets</button>
        <button krnToggleButton value="forecast">Forecast</button>
      </div>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnToggleButton'] },
    componentImports: ['KrnToggleButton'],
    members: [`visibleLayers: readonly string[] = ['targets'];`],
    riskTags: ['controlled-state', 'compound-component'],
    assertions: [
      'div',
      'krnToggleGroup',
      'aria-label',
      '[(values)]="visibleLayers"',
      'readonly string[]',
    ],
  }),
  'copy-button': defineRecipe({
    title: 'Copy immutable record id',
    scenario:
      'Copy an explicit domain identifier, localize its accessible context, and consume confirmed outcomes.',
    template: `
      <krn-copy-button
        [value]="customerId"
        (copied)="lastResult = 'Copied ' + $event"
        (copyError)="lastResult = 'Customer id copy failed'"
      >
        Copy customer id {{ customerId }}
      </krn-copy-button>
      <output>{{ lastResult }}</output>
    `,
    valueImports: {
      '@kern-ui/angular/kit': ['provideKrnCopyButtonOptions'],
    },
    providers: [
      `provideKrnCopyButtonOptions({
        size: 'sm',
        feedbackDuration: 2400,
      })`,
    ],
    members: [`readonly customerId = 'CUS-2048';`, `lastResult = '';`],
    riskTags: ['async', 'typed-output', 'scoped-options', 'accessibility-copy'],
    assertions: [
      'provideKrnCopyButtonOptions',
      '[value]="customerId"',
      '(copied)="lastResult',
      '(copyError)="lastResult',
    ],
  }),
  link: defineRecipe({
    title: 'External audit documentation link',
    scenario: 'Render a semantic link with safe external navigation metadata.',
    template: `
      <a
        krnLink
        href="https://example.com/audit-policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        Audit policy
      </a>
    `,
  }),
  'dropdown-button': defineRecipe({
    title: 'Controlled bulk-action menu',
    scenario:
      'Expose keyboard-operable secondary actions with controlled state and scoped placement.',
    template: `
      <krn-dropdown-button [(open)]="open">
        <span krnLabel>Bulk actions</span>
        <button krnMenu type="button">Assign owner</button>
        <button krnMenu type="button">Archive</button>
      </krn-dropdown-button>
    `,
    valueImports: {
      '@kern-ui/angular/kit': ['provideKrnMenuButtonOptions'],
    },
    providers: [
      `provideKrnMenuButtonOptions({
        menuAlign: 'start',
        matchTriggerWidth: true,
      })`,
    ],
    members: ['open = false;'],
    riskTags: ['overlay', 'controlled-state', 'scoped-options', 'keyboard-navigation'],
    assertions: [
      '[(open)]="open"',
      'button krnMenu',
      'provideKrnMenuButtonOptions',
      'matchTriggerWidth',
    ],
  }),
  'form-field': defineRecipe({
    title: 'Labeled reactive form field',
    scenario: 'Compose visible label, control and hint around one typed FormControl.',
    template: `
      <krn-form-field>
        <krn-label for="account-name">Account name</krn-label>
        <krn-text-input
          id="account-name"
          [formControl]="control"
        />
        <krn-hint>Use the legal customer name.</krn-hint>
      </krn-form-field>
    `,
    valueImports: {
      '@angular/forms': ['FormControl', 'ReactiveFormsModule'],
      '@kern-ui/angular/kit': ['KrnHint', 'KrnLabel', 'KrnTextInput'],
    },
    componentImports: ['ReactiveFormsModule', 'KrnHint', 'KrnLabel', 'KrnTextInput'],
    members: [`readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });`],
    riskTags: ['forms', 'compound-component'],
    assertions: ['[formControl]="control"', 'FormControl<string>'],
  }),
  label: defineRecipe({
    title: 'Visible required field label',
    scenario: 'Associate visible copy with its native control.',
    template: `
      <krn-label for="department" [required]="true">Department</krn-label>
      <input id="department" name="department" required />
    `,
  }),
  hint: defineRecipe({
    title: 'Persistent field guidance',
    scenario: 'Provide concise guidance that can be referenced by a control.',
    template: `<krn-hint id="cost-center-hint">Use the six-digit finance code.</krn-hint>`,
  }),
  'validation-message': defineRecipe({
    title: 'Actionable validation message',
    scenario: 'Explain how to correct an invalid form value.',
    template: `
      <krn-validation-message id="email-error">
        Enter a complete business email address.
      </krn-validation-message>
    `,
  }),
  'text-input': reactiveFormRecipe({
    title: 'Typed account-name input',
    scenario: 'Bind a non-nullable text control with an explicit accessible name.',
    template: `
      <krn-text-input
        id="account-name"
        ariaLabel="Account name"
        autocomplete="organization"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "'Acme Europe'",
  }),
  textarea: reactiveFormRecipe({
    title: 'Typed review notes',
    scenario: 'Edit long-form review notes through a non-nullable control.',
    template: `
      <krn-textarea
        id="review-notes"
        ariaLabel="Review notes"
        [rows]="5"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "'Renewal approved pending legal review.'",
  }),
  'password-input': reactiveFormRecipe({
    title: 'Typed password entry',
    scenario: 'Bind password state without reading values from the component instance.',
    template: `
      <krn-password-input
        id="password"
        ariaLabel="Password"
        autocomplete="current-password"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "''",
  }),
  'search-input': reactiveFormRecipe({
    title: 'Typed customer search',
    scenario: 'Own search query state in a non-nullable reactive form control.',
    template: `
      <krn-search-input
        id="customer-search"
        ariaLabel="Search customers"
        placeholder="Name, owner or account id"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "''",
  }),
  'number-input': reactiveFormRecipe({
    title: 'Nullable seat limit',
    scenario: 'Represent an optional numeric value without coercing empty input to zero.',
    template: `
      <krn-number-input
        id="seat-limit"
        ariaLabel="Seat limit"
        [min]="1"
        [max]="10000"
        [formControl]="control"
      />
    `,
    controlType: 'number | null',
    initialValue: '250',
  }),
  checkbox: reactiveFormRecipe({
    title: 'Typed policy acknowledgement',
    scenario: 'Bind a boolean consent value through Angular Forms.',
    template: `
      <krn-checkbox [formControl]="control">
        I confirm the account owner has approved this change.
      </krn-checkbox>
    `,
    controlType: 'boolean',
    initialValue: 'false',
  }),
  'checkbox-group': reactiveFormRecipe({
    title: 'Typed notification channels',
    scenario: 'Bind a stable array of selected string values.',
    template: `
      <krn-checkbox-group
        label="Notification channels"
        [formControl]="control"
      >
        <krn-checkbox value="email">Email</krn-checkbox>
        <krn-checkbox value="slack">Slack</krn-checkbox>
      </krn-checkbox-group>
    `,
    controlType: 'readonly string[]',
    initialValue: "['email']",
    extraValueImports: { '@kern-ui/angular/kit': ['KrnCheckbox'] },
    componentImports: ['KrnCheckbox'],
  }),
  radio: defineRecipe({
    title: 'Individual radio option',
    scenario: 'Provide a stable submitted value and visible option label.',
    template: `<krn-radio name="plan" value="enterprise">Enterprise plan</krn-radio>`,
    assertions: ['value="enterprise"'],
  }),
  'radio-group': reactiveFormRecipe({
    title: 'Typed billing-cycle choice',
    scenario: 'Bind one selected value while composing visible radio options.',
    template: `
      <krn-radio-group label="Billing cycle" [formControl]="control">
        <krn-radio value="monthly">Monthly</krn-radio>
        <krn-radio value="annual">Annual</krn-radio>
      </krn-radio-group>
    `,
    controlType: 'string | null',
    initialValue: "'annual'",
    extraValueImports: { '@kern-ui/angular/kit': ['KrnRadio'] },
    componentImports: ['KrnRadio'],
  }),
  switch: reactiveFormRecipe({
    title: 'Typed audit-alert switch',
    scenario: 'Bind a boolean preference with a visible label.',
    template: `
      <krn-switch [formControl]="control">
        Send an alert when audit policy changes
      </krn-switch>
    `,
    controlType: 'boolean',
    initialValue: 'true',
  }),
  select: reactiveFormRecipe({
    title: 'Typed owner select',
    scenario: 'Supply stable typed options and controlled overlay state.',
    template: `
      <krn-select
        ariaLabel="Account owner"
        [options]="ownerOptions"
        [formControl]="control"
        [(open)]="open"
      />
    `,
    controlType: 'string | null',
    initialValue: "'owner-ada'",
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnSelectOption'] },
    members: [
      `readonly ownerOptions: readonly KrnSelectOption<string>[] = [
        { value: 'owner-ada', label: 'Ada Lovelace' },
        { value: 'owner-grace', label: 'Grace Hopper' },
      ];`,
      'open = false;',
    ],
    riskTags: ['forms', 'options', 'overlay', 'controlled-state'],
    assertions: ['readonly KrnSelectOption<string>[]', '[(open)]="open"'],
  }),
  'native-select': reactiveFormRecipe({
    title: 'Typed native region select',
    scenario: 'Use native select semantics with the same typed option contract.',
    template: `
      <krn-native-select
        ariaLabel="Data region"
        [options]="regionOptions"
        [formControl]="control"
      />
    `,
    controlType: 'string | null',
    initialValue: "'eu-central'",
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnSelectOption'] },
    members: [
      `readonly regionOptions: readonly KrnSelectOption<string>[] = [
        { value: 'eu-central', label: 'EU Central' },
        { value: 'us-east', label: 'US East' },
      ];`,
    ],
    riskTags: ['forms', 'options'],
    assertions: ['readonly KrnSelectOption<string>[]'],
  }),
  'multi-select': reactiveFormRecipe({
    title: 'Typed multi-owner selection',
    scenario: 'Own a readonly selection array and controlled popup state.',
    template: `
      <krn-multi-select
        ariaLabel="Reviewers"
        [options]="reviewerOptions"
        [formControl]="control"
        [(open)]="open"
      />
    `,
    controlType: 'readonly string[]',
    initialValue: "['reviewer-security']",
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnSelectOption'] },
    members: [
      `readonly reviewerOptions: readonly KrnSelectOption<string>[] = [
        { value: 'reviewer-security', label: 'Security team' },
        { value: 'reviewer-legal', label: 'Legal team' },
        { value: 'reviewer-finance', label: 'Finance team' },
      ];`,
      'open = false;',
    ],
    riskTags: ['forms', 'options', 'overlay', 'controlled-state'],
    assertions: ['readonly KrnSelectOption<string>[]', '[(open)]="open"'],
  }),
  combobox: reactiveFormRecipe({
    title: 'Typed editable owner combobox',
    scenario: 'Offer typed suggestions for an application-owned text value.',
    template: `
      <krn-combobox
        ariaLabel="Escalation owner"
        [options]="ownerOptions"
        [formControl]="control"
        [(open)]="open"
      />
    `,
    controlType: 'string',
    initialValue: "'Platform team'",
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnSelectOption'] },
    members: [
      `readonly ownerOptions: readonly KrnSelectOption<string>[] = [
        { value: 'Platform team', label: 'Platform team' },
        { value: 'Security team', label: 'Security team' },
      ];`,
      'open = false;',
    ],
    riskTags: ['forms', 'options', 'overlay', 'controlled-state'],
    assertions: ['readonly KrnSelectOption<string>[]', '[(open)]="open"'],
  }),
  autocomplete: reactiveFormRecipe({
    title: 'Typed account autocomplete',
    scenario: 'Provide explicit suggestions and controlled popup state.',
    template: `
      <krn-autocomplete
        ariaLabel="Customer account"
        [options]="accountOptions"
        [formControl]="control"
        [(open)]="open"
      />
    `,
    controlType: 'string',
    initialValue: "'Acme Europe'",
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnSelectOption'] },
    members: [
      `readonly accountOptions: readonly KrnSelectOption<string>[] = [
        { value: 'Acme Europe', label: 'Acme Europe' },
        { value: 'Acme North America', label: 'Acme North America' },
      ];`,
      'open = false;',
    ],
    riskTags: ['forms', 'options', 'overlay', 'controlled-state'],
    assertions: ['readonly KrnSelectOption<string>[]', '[(open)]="open"'],
  }),
  slider: reactiveFormRecipe({
    title: 'Typed risk threshold',
    scenario: 'Bind a numeric threshold with explicit range and label.',
    template: `
      <krn-slider
        label="Risk threshold"
        [min]="0"
        [max]="100"
        [step]="5"
        [formControl]="control"
      />
    `,
    controlType: 'number',
    initialValue: '65',
  }),
  'range-slider': reactiveFormRecipe({
    title: 'Typed contract-value range',
    scenario: 'Bind start and end values through the public range value type.',
    template: `
      <krn-range-slider
        label="Contract value range"
        startLabel="Minimum value"
        endLabel="Maximum value"
        [min]="0"
        [max]="100"
        [formControl]="control"
      />
    `,
    controlType: 'KrnRangeValue',
    initialValue: '{ start: 20, end: 80 }',
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnRangeValue'] },
    assertions: ['FormControl<KrnRangeValue>'],
  }),
  'segmented-control': reactiveFormRecipe({
    title: 'Typed report period',
    scenario: 'Select one typed period from stable segment options.',
    template: `
      <krn-segmented-control
        ariaLabel="Report period"
        [options]="periodOptions"
        [formControl]="control"
      />
    `,
    controlType: 'string | null',
    initialValue: "'quarter'",
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnSegmentOption'] },
    members: [
      `readonly periodOptions: readonly KrnSegmentOption<string>[] = [
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' },
      ];`,
    ],
    riskTags: ['forms', 'options'],
    assertions: ['readonly KrnSegmentOption<string>[]'],
  }),
  'date-picker': reactiveFormRecipe({
    title: 'Typed renewal date',
    scenario: 'Bind an ISO date string with explicit locale and reference date.',
    template: `
      <krn-date-picker
        ariaLabel="Renewal date"
        locale="en-GB"
        today="2026-07-29"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "'2026-10-15'",
    riskTags: ['forms', 'date-time', 'overlay'],
    assertions: ['FormControl<string>', 'today="2026-07-29"'],
  }),
  'date-range-picker': reactiveFormRecipe({
    title: 'Typed reporting period',
    scenario: 'Bind an explicit ISO start and end date range.',
    template: `
      <krn-date-range-picker
        ariaLabel="Reporting period"
        locale="en-GB"
        today="2026-07-29"
        [formControl]="control"
      />
    `,
    controlType: 'KrnDateRangeValue',
    initialValue: `{ start: '2026-07-01', end: '2026-09-30' }`,
    extraTypeImports: { '@kern-ui/angular/kit': ['KrnDateRangeValue'] },
    riskTags: ['forms', 'date-time', 'overlay'],
    assertions: ['FormControl<KrnDateRangeValue>', 'today="2026-07-29"'],
  }),
  'time-picker': reactiveFormRecipe({
    title: 'Typed maintenance time',
    scenario: 'Bind a 24-hour time string within an allowed operating window.',
    template: `
      <krn-time-picker
        ariaLabel="Maintenance start"
        min="06:00"
        max="22:00"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "'18:30'",
    riskTags: ['forms', 'date-time'],
  }),
  'color-picker': reactiveFormRecipe({
    title: 'Typed chart accent color',
    scenario: 'Bind a normalized color value for user-configurable reporting.',
    template: `
      <krn-color-picker
        pickerLabel="Chart accent"
        textLabel="Hex color"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "'#4666da'",
  }),
  'file-upload': reactiveFormRecipe({
    title: 'Typed contract upload',
    scenario: 'Bind an immutable file list with accepted document formats.',
    template: `
      <krn-file-upload
        label="Signed contract"
        description="PDF, up to 10 MB"
        accept=".pdf,application/pdf"
        [maxSize]="10485760"
        [formControl]="control"
      />
    `,
    controlType: 'readonly File[]',
    initialValue: '[]',
    riskTags: ['forms', 'files'],
    assertions: ['FormControl<readonly File[]>'],
  }),
  'drag-drop-upload': reactiveFormRecipe({
    title: 'Typed evidence drop zone',
    scenario: 'Bind immutable uploaded files while retaining an accessible browse action.',
    template: `
      <krn-drag-drop-upload
        label="Audit evidence"
        description="Drop files or choose from your device"
        [multiple]="true"
        [formControl]="control"
      />
    `,
    controlType: 'readonly File[]',
    initialValue: '[]',
    riskTags: ['forms', 'files'],
    assertions: ['FormControl<readonly File[]>'],
  }),
  'verification-code': reactiveFormRecipe({
    title: 'Typed six-digit verification code',
    scenario: 'Bind the complete code as one string while rendering segmented inputs.',
    template: `
      <krn-verification-code
        label="Verification code"
        [length]="6"
        [formControl]="control"
      />
    `,
    controlType: 'string',
    initialValue: "''",
  }),
  'tags-input': reactiveFormRecipe({
    title: 'Typed account tags',
    scenario: 'Bind an immutable tag array and provide an explicit creation label.',
    template: `
      <krn-tags-input
        label="Account tags"
        placeholder="Add a tag"
        [formControl]="control"
      />
    `,
    controlType: 'readonly string[]',
    initialValue: "['enterprise', 'renewal-q3']",
    assertions: ['FormControl<readonly string[]>'],
  }),
  breadcrumbs: defineRecipe({
    title: 'Typed account breadcrumbs',
    scenario: 'Describe hierarchy with a typed immutable breadcrumb collection.',
    template: `<krn-breadcrumbs [items]="items" ariaLabel="Account location" />`,
    typeImports: { '@kern-ui/angular/kit': ['KrnBreadcrumbItem'] },
    members: [
      `readonly items: readonly KrnBreadcrumbItem[] = [
        { label: 'Customers', href: '/customers' },
        { label: 'Acme Europe', current: true },
      ];`,
    ],
    riskTags: ['navigation', 'typed-collection'],
    assertions: ['readonly KrnBreadcrumbItem[]'],
  }),
  tabs: defineRecipe({
    title: 'Controlled account tabs',
    scenario: 'Use stable ids and application-owned selected tab state.',
    template: `
      <krn-tabs
        ariaLabel="Account sections"
        [items]="items"
        [(value)]="selectedTab"
      >
        Selected section: {{ selectedTab }}
      </krn-tabs>
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnTabItem'] },
    members: [
      `readonly items: readonly KrnTabItem[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'activity', label: 'Activity', badge: 4 },
        { id: 'settings', label: 'Settings' },
      ];`,
      `selectedTab: string | null = 'overview';`,
    ],
    riskTags: ['navigation', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnTabItem[]', '[(value)]="selectedTab"'],
  }),
  'vertical-tabs': defineRecipe({
    title: 'Controlled settings tabs',
    scenario: 'Use vertical orientation for a stable settings subsection.',
    template: `
      <krn-vertical-tabs
        ariaLabel="Settings sections"
        [items]="items"
        [(value)]="selectedTab"
      >
        Selected settings section: {{ selectedTab }}
      </krn-vertical-tabs>
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnTabItem'] },
    members: [
      `readonly items: readonly KrnTabItem[] = [
        { id: 'profile', label: 'Profile' },
        { id: 'security', label: 'Security' },
      ];`,
      `selectedTab: string | null = 'profile';`,
    ],
    riskTags: ['navigation', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnTabItem[]', '[(value)]="selectedTab"'],
  }),
  pagination: defineRecipe({
    title: 'Controlled customer pagination',
    scenario: 'Keep the current one-based page in application state.',
    template: `
      <krn-pagination
        [totalItems]="245"
        [pageSize]="25"
        [(page)]="page"
        ariaLabel="Customer pages"
      />
    `,
    members: ['page = 1;'],
    riskTags: ['navigation', 'controlled-state'],
    assertions: ['[(page)]="page"', '[totalItems]="245"'],
  }),
  stepper: defineRecipe({
    title: 'Controlled onboarding progress',
    scenario: 'Drive a linear multi-step flow with typed immutable steps.',
    template: `
      <krn-stepper
        ariaLabel="Customer onboarding progress"
        [steps]="steps"
        [linear]="true"
        [completedSteps]="completedSteps"
        [(activeStep)]="activeStep"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnStepItem'] },
    members: [
      `readonly steps: readonly KrnStepItem[] = [
        { id: 'company', label: 'Company' },
        { id: 'owners', label: 'Owners' },
        { id: 'review', label: 'Review' },
      ];`,
      'completedSteps: readonly number[] = [0];',
      'activeStep = 1;',
    ],
    riskTags: ['navigation', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnStepItem[]', '[(activeStep)]="activeStep"'],
  }),
  menu: defineRecipe({
    title: 'Controlled record action menu',
    scenario: 'Render typed actions and own disclosure state.',
    template: `
      <krn-menu
        triggerLabel="Record actions"
        [items]="items"
        [(open)]="open"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnNavigationItem'] },
    members: [
      `readonly items: readonly (KrnNavigationItem & { readonly shortcut?: string })[] = [
        { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D' },
        { id: 'archive', label: 'Archive' },
      ];`,
      'open = false;',
    ],
    riskTags: ['navigation', 'overlay', 'controlled-state', 'typed-collection'],
    assertions: ['readonly (KrnNavigationItem', '[(open)]="open"'],
  }),
  menubar: defineRecipe({
    title: 'Typed application menubar',
    scenario: 'Expose a compact keyboard-oriented application menu.',
    template: `<krn-menubar ariaLabel="Application menu" [items]="items" />`,
    typeImports: { '@kern-ui/angular/kit': ['KrnNavigationItem'] },
    members: [
      `readonly items: readonly KrnNavigationItem[] = [
        { id: 'customers', label: 'Customers', href: '/customers' },
        { id: 'reports', label: 'Reports', href: '/reports' },
      ];`,
    ],
    riskTags: ['navigation', 'typed-collection'],
    assertions: ['readonly KrnNavigationItem[]'],
  }),
  'context-menu': defineRecipe({
    title: 'Typed row context actions',
    scenario: 'Provide nested context actions with stable ids.',
    template: `
      <krn-context-menu
        ariaLabel="Customer row actions"
        [items]="items"
      >
        <button type="button">Open row actions</button>
      </krn-context-menu>
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnContextMenuItem'] },
    members: [
      `readonly items: readonly KrnContextMenuItem[] = [
        { id: 'open', label: 'Open customer' },
        {
          id: 'export',
          label: 'Export',
          children: [
            { id: 'export-csv', label: 'CSV' },
            { id: 'export-json', label: 'JSON' },
          ],
        },
      ];`,
    ],
    riskTags: ['navigation', 'overlay', 'typed-collection'],
    assertions: ['readonly KrnContextMenuItem[]'],
  }),
  'tree-navigation': defineRecipe({
    title: 'Controlled product navigation tree',
    scenario: 'Own selected and expanded ids for a typed nested navigation model.',
    template: `
      <krn-tree-navigation
        ariaLabel="Product navigation"
        [items]="items"
        [(selectedId)]="selectedId"
        [(expandedIds)]="expandedIds"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnTreeNavigationItem'] },
    members: [
      `readonly items: readonly KrnTreeNavigationItem[] = [
        {
          id: 'customers',
          label: 'Customers',
          children: [
            { id: 'active-customers', label: 'Active' },
            { id: 'risk-customers', label: 'At risk' },
          ],
        },
      ];`,
      `selectedId: string | null = 'active-customers';`,
      `expandedIds: readonly string[] = ['customers'];`,
    ],
    riskTags: ['navigation', 'tree', 'controlled-state', 'typed-collection'],
    assertions: [
      'readonly KrnTreeNavigationItem[]',
      '[(selectedId)]="selectedId"',
      '[(expandedIds)]="expandedIds"',
    ],
  }),
  'bottom-navigation': defineRecipe({
    title: 'Controlled mobile primary navigation',
    scenario: 'Use stable ids and owned selected destination.',
    template: `
      <krn-bottom-navigation
        ariaLabel="Primary mobile navigation"
        [items]="items"
        [(value)]="selectedDestination"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnNavigationItem'] },
    members: [
      `readonly items: readonly KrnNavigationItem[] = [
        { id: 'home', label: 'Home', href: '/home' },
        { id: 'tasks', label: 'Tasks', href: '/tasks', badge: 3 },
        { id: 'account', label: 'Account', href: '/account' },
      ];`,
      `selectedDestination: string | null = 'home';`,
    ],
    riskTags: ['navigation', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnNavigationItem[]', '[(value)]="selectedDestination"'],
  }),
  'command-palette': defineRecipe({
    title: 'Controlled command palette',
    scenario: 'Own query and open state while supplying typed commands.',
    template: `
      <button type="button" (click)="open = true">Open commands</button>
      <krn-command-palette
        [items]="commands"
        [(query)]="query"
        [(open)]="open"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnCommandItem'] },
    members: [
      `readonly commands: readonly KrnCommandItem[] = [
        {
          id: 'create-customer',
          label: 'Create customer',
          group: 'Customers',
          shortcut: 'C',
          keywords: ['new', 'account'],
        },
        {
          id: 'open-audit-log',
          label: 'Open audit log',
          group: 'Security',
          shortcut: 'A',
        },
      ];`,
      `query = '';`,
      'open = false;',
    ],
    riskTags: ['navigation', 'overlay', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnCommandItem[]', '[(query)]="query"', '[(open)]="open"'],
  }),
  'table-of-contents': defineRecipe({
    title: 'Controlled document contents',
    scenario: 'Track the active heading against stable document ids.',
    template: `
      <krn-table-of-contents
        title="Onboarding guide"
        [items]="items"
        [observe]="false"
        [(activeId)]="activeId"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnTocItem'] },
    members: [
      `readonly items: readonly KrnTocItem[] = [
        { id: 'company', label: 'Company', level: 2 },
        { id: 'owners', label: 'Owners', level: 2 },
        { id: 'permissions', label: 'Permissions', level: 3 },
      ];`,
      `activeId: string | null = 'company';`,
    ],
    riskTags: ['navigation', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnTocItem[]', '[(activeId)]="activeId"'],
  }),
  'back-button': defineRecipe({
    title: 'Explicit back navigation',
    scenario: 'Provide a deterministic href when browser history is not sufficient.',
    template: `<krn-back-button href="/customers" label="Back to customers" />`,
  }),
  'skip-link': defineRecipe({
    title: 'Main-content skip link',
    scenario: 'Give keyboard users a direct route past repeated navigation.',
    template: `
      <krn-skip-link targetId="main-content" label="Skip to account details" />
      <main id="main-content" tabindex="-1">Account details</main>
    `,
  }),
  alert: defineRecipe({
    title: 'Persistent warning alert',
    scenario: 'Communicate a recoverable issue with title and supporting action.',
    template: `
      <krn-alert tone="warning" title="Verification required">
        Confirm the billing owner before the next renewal.
        <button type="button">Review owner</button>
      </krn-alert>
    `,
  }),
  banner: defineRecipe({
    title: 'Dismissible system banner',
    scenario: 'Present a page-wide operational message with explicit tone.',
    template: `
      <krn-banner tone="info" title="Scheduled maintenance" [dismissible]="true">
        Reporting will be read-only from 22:00 to 23:00 UTC.
      </krn-banner>
    `,
  }),
  toast: defineRecipe({
    title: 'Application toast viewport',
    scenario: 'Place one viewport and create notifications through the root service.',
    template: `
      <button type="button" (click)="notify()">Save report</button>
      <krn-toast [(expanded)]="expanded" position="top-end" />
    `,
    coreImports: ['inject'],
    valueImports: { '@kern-ui/angular/kit': ['KrnToastService'] },
    members: [
      'private readonly toasts = inject(KrnToastService);',
      'expanded = false;',
      `notify(): void {
        this.toasts.success('Report saved', { title: 'Saved' });
      }`,
    ],
    riskTags: ['feedback-service', 'controlled-state'],
    assertions: ['inject(KrnToastService)', '[(expanded)]="expanded"'],
  }),
  tooltip: defineRecipe({
    title: 'Accessible abbreviated-action tooltip',
    scenario: 'Supplement an already named control with concise hover and focus guidance.',
    template: `
      <button
        type="button"
        aria-label="Download audit report"
        krnTooltip="Download audit report"
        krnTooltipPosition="below"
      >
        ↓
      </button>
    `,
    assertions: ['aria-label="Download audit report"', 'krnTooltip='],
  }),
  popover: defineRecipe({
    title: 'Controlled contextual popover',
    scenario: 'Compose trigger and content while keeping disclosure state application-owned.',
    template: `
      <krn-popover [(open)]="open" ariaLabel="Account health details">
        <span krnPopoverTrigger>Health details</span>
        <p>Three checks passed and one requires attention.</p>
      </krn-popover>
    `,
    members: ['open = false;'],
    riskTags: ['overlay', 'controlled-state'],
    assertions: ['krnPopoverTrigger', '[(open)]="open"'],
  }),
  'hover-card': defineRecipe({
    title: 'Account preview hover card',
    scenario: 'Provide supplemental preview content through the component-owned focusable trigger.',
    template: `
      <krn-hover-card ariaLabel="Acme Europe preview">
        <span krnHoverCardTrigger>Acme Europe</span>
        <strong>Acme Europe</strong>
        <p>Enterprise · Renewal 15 October</p>
      </krn-hover-card>
    `,
    riskTags: ['overlay'],
    assertions: ['krnHoverCardTrigger'],
  }),
  dialog: overlayRecipe({
    title: 'Controlled edit dialog',
    scenario: 'Open and close a modal dialog through application-owned state.',
    selector: 'krn-dialog',
    heading: 'Edit customer',
    body: 'Update customer ownership and renewal details.',
  }),
  'alert-dialog': overlayRecipe({
    title: 'Controlled destructive confirmation',
    scenario: 'Require an explicit decision for a destructive action.',
    selector: 'krn-alert-dialog',
    heading: 'Archive customer',
    body: 'Archived customers are removed from active reporting.',
    extra: '[closeOnOutside]="false"',
  }),
  drawer: overlayRecipe({
    title: 'Controlled details drawer',
    scenario: 'Show supporting record details without replacing list context.',
    selector: 'krn-drawer',
    heading: 'Customer details',
    body: 'Review contacts, contracts and account ownership.',
  }),
  'bottom-sheet': overlayRecipe({
    title: 'Controlled mobile action sheet',
    scenario: 'Present compact actions from the bottom edge on narrow screens.',
    selector: 'krn-bottom-sheet',
    heading: 'Customer actions',
    body: 'Choose an action for the selected customer.',
  }),
  'loading-overlay': defineRecipe({
    title: 'Controlled blocking save state',
    scenario: 'Keep existing content perceivable while a blocking operation is active.',
    template: `
      <krn-loading-overlay [active]="saving" [blocking]="true" label="Saving customer">
        <section>
          <h2>Customer profile</h2>
          <button type="button" (click)="saving = !saving">Toggle save state</button>
        </section>
      </krn-loading-overlay>
    `,
    members: ['saving = false;'],
    assertions: ['[active]="saving"'],
  }),
  'progress-bar': defineRecipe({
    title: 'Deterministic import progress',
    scenario: 'Communicate known progress with a stable accessible label.',
    template: `
      <krn-progress-bar
        ariaLabel="Customer import progress"
        [value]="processed"
        [max]="total"
        valueText="68 of 100 customers"
      />
    `,
    members: ['processed = 68;', 'readonly total = 100;'],
  }),
  'circular-progress': defineRecipe({
    title: 'Compact sync progress',
    scenario: 'Show known progress where horizontal space is constrained.',
    template: `
      <krn-circular-progress
        ariaLabel="Account sync progress"
        [value]="72"
        [max]="100"
        [showValue]="true"
      />
    `,
  }),
  spinner: defineRecipe({
    title: 'Indeterminate loading status',
    scenario: 'Announce a short unknown-duration operation.',
    template: `<krn-spinner label="Loading audit log" />`,
  }),
  skeleton: defineRecipe({
    title: 'Stable customer-card placeholder',
    scenario: 'Reserve the final content geometry while data loads.',
    template: `
      <section aria-label="Loading customer summary">
        <krn-skeleton width="40%" height="1.25rem" shape="text" />
        <krn-skeleton width="100%" height="4rem" shape="rectangle" />
      </section>
    `,
  }),
  'empty-state': defineRecipe({
    title: 'Empty customer portfolio',
    scenario: 'Explain the absence of records and provide a next action.',
    template: `
      <krn-empty-state
        title="No customers yet"
        description="Create the first customer to start tracking renewals."
      >
        <button type="button">Create customer</button>
      </krn-empty-state>
    `,
  }),
  'error-state': defineRecipe({
    title: 'Recoverable report error',
    scenario: 'Describe a failed load and expose a recovery action.',
    template: `
      <krn-error-state
        title="Report unavailable"
        description="The latest report could not be loaded."
      >
        <button type="button">Try again</button>
      </krn-error-state>
    `,
  }),
  'success-state': defineRecipe({
    title: 'Completed import state',
    scenario: 'Confirm completion and identify the next useful destination.',
    template: `
      <krn-success-state
        title="Import complete"
        description="100 customers were added without errors."
      >
        <a href="/customers">Review customers</a>
      </krn-success-state>
    `,
  }),
  'confirmation-pattern': defineRecipe({
    title: 'Inline archive confirmation',
    scenario: 'Use a reversible inline confirmation for a local record action.',
    template: `
      <krn-confirmation-pattern
        requestLabel="Archive customer"
        prompt="Archive Acme Europe?"
        confirmLabel="Archive"
        [(confirming)]="confirming"
      />
    `,
    members: ['confirming = false;'],
    riskTags: ['controlled-state'],
    assertions: ['[(confirming)]="confirming"'],
  }),
  badge: defineRecipe({
    title: 'Semantic account status badge',
    scenario: 'Express status through text, marker and semantic tone.',
    template: `<krn-badge tone="success" [status]="true">Healthy</krn-badge>`,
  }),
  'status-badge': defineRecipe({
    title: 'Alias status badge',
    scenario: 'Use the status-focused alias with visible state text.',
    template: `<krn-status-badge tone="warning" [status]="true">Review needed</krn-status-badge>`,
  }),
  chip: defineRecipe({
    title: 'Controlled removable filter chip',
    scenario: 'Keep selected filter state application-owned.',
    template: `
      <krn-chip
        [interactive]="true"
        [removable]="true"
        accessibleLabel="Enterprise filter"
        [(selected)]="selected"
      >
        Enterprise
      </krn-chip>
    `,
    members: ['selected = true;'],
    riskTags: ['controlled-state'],
    assertions: ['[(selected)]="selected"'],
  }),
  tag: defineRecipe({
    title: 'Controlled tag alias',
    scenario: 'Use the tag alias for removable classification metadata.',
    template: `
      <krn-tag
        [interactive]="true"
        [removable]="true"
        accessibleLabel="Renewal Q3 tag"
        [(selected)]="selected"
      >
        Renewal Q3
      </krn-tag>
    `,
    members: ['selected = true;'],
    riskTags: ['controlled-state'],
    assertions: ['[(selected)]="selected"'],
  }),
  avatar: defineRecipe({
    title: 'Named account-owner avatar',
    scenario: 'Provide initials fallback and meaningful alternative text.',
    template: `
      <krn-avatar
        name="Ada Lovelace"
        alt="Ada Lovelace, account owner"
        status="online"
      />
    `,
  }),
  'avatar-group': defineRecipe({
    title: 'Account team avatar group',
    scenario: 'Compose named avatars under one accessible group label.',
    template: `
      <krn-avatar-group ariaLabel="Account team">
        <krn-avatar name="Ada Lovelace" alt="Ada Lovelace" />
        <krn-avatar name="Grace Hopper" alt="Grace Hopper" />
        <krn-avatar name="Margaret Hamilton" alt="Margaret Hamilton" />
      </krn-avatar-group>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnAvatar'] },
    componentImports: ['KrnAvatar'],
    riskTags: ['compound-component'],
  }),
  card: defineRecipe({
    title: 'Interactive customer summary card',
    scenario: 'Compose heading, action and footer without hiding semantic content.',
    template: `
      <krn-card eyebrow="Enterprise" heading="Acme Europe" [interactive]="true">
        <button krnCardAction type="button">Open account</button>
        <p>Renewal: 15 October · Owner: Ada Lovelace</p>
        <small krnCardFooter>Updated 12 minutes ago</small>
      </krn-card>
    `,
  }),
  stat: defineRecipe({
    title: 'Revenue metric',
    scenario: 'Pair a formatted value with label, trend and supporting detail.',
    template: `
      <krn-stat
        label="Annual recurring revenue"
        value="€1.8M"
        detail="+8.4% year over year"
        trend="up"
      />
    `,
  }),
  'description-list': defineRecipe({
    title: 'Customer metadata description list',
    scenario: 'Compose semantic term-value pairs with dedicated items.',
    template: `
      <krn-description-list>
        <krn-description-item term="Account owner">Ada Lovelace</krn-description-item>
        <krn-description-item term="Renewal date">15 October 2026</krn-description-item>
      </krn-description-list>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnDescriptionItem'] },
    componentImports: ['KrnDescriptionItem'],
    riskTags: ['compound-component'],
  }),
  list: defineRecipe({
    title: 'Selected customer list',
    scenario: 'Compose semantic list items and expose current selection.',
    template: `
      <krn-list role="listbox" ariaLabel="Customers">
        <krn-list-item heading="Acme Europe" [selected]="true">
          Enterprise · Healthy
        </krn-list-item>
        <krn-list-item heading="Globex">Commercial · Review needed</krn-list-item>
      </krn-list>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnListItem'] },
    componentImports: ['KrnListItem'],
    riskTags: ['compound-component'],
  }),
  'list-item': defineRecipe({
    title: 'Customer list row',
    scenario: 'Compose leading identity, text and trailing metadata.',
    template: `
      <krn-list-item heading="Acme Europe" [selected]="true">
        <span krnListLeading aria-hidden="true">AC</span>
        Enterprise account
        <span krnListTrailing>Healthy</span>
      </krn-list-item>
    `,
  }),
  accordion: defineRecipe({
    title: 'Account policy accordion',
    scenario: 'Group independently controlled disclosures under one accessible label.',
    template: `
      <krn-accordion ariaLabel="Account policies">
        <krn-disclosure heading="Data residency" [(open)]="dataResidencyOpen">
          Customer data is stored in the EU Central region.
        </krn-disclosure>
        <krn-disclosure heading="Retention">Audit records are retained for seven years.</krn-disclosure>
      </krn-accordion>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnDisclosure'] },
    componentImports: ['KrnDisclosure'],
    members: ['dataResidencyOpen = true;'],
    riskTags: ['compound-component', 'controlled-state'],
    assertions: ['[(open)]="dataResidencyOpen"'],
  }),
  disclosure: defineRecipe({
    title: 'Controlled policy disclosure',
    scenario: 'Keep an expandable policy section synchronized with application state.',
    template: `
      <krn-disclosure heading="Data residency" [(open)]="open">
        Customer data is stored in the EU Central region.
      </krn-disclosure>
    `,
    members: ['open = true;'],
    riskTags: ['controlled-state'],
    assertions: ['[(open)]="open"'],
  }),
  timeline: defineRecipe({
    title: 'Customer activity timeline',
    scenario: 'Compose chronologically ordered typed timeline items.',
    template: `
      <krn-timeline ariaLabel="Recent customer activity">
        <krn-timeline-item heading="Contract approved" time="09:42">
          Legal review completed by Grace Hopper.
        </krn-timeline-item>
        <krn-timeline-item heading="Owner assigned" time="08:15">
          Ada Lovelace became the account owner.
        </krn-timeline-item>
      </krn-timeline>
    `,
    valueImports: { '@kern-ui/angular/kit': ['KrnTimelineItem'] },
    componentImports: ['KrnTimelineItem'],
    riskTags: ['compound-component'],
  }),
  tree: defineRecipe({
    title: 'Controlled organization tree',
    scenario: 'Use stable node ids and own expanded and selected state.',
    template: `
      <krn-tree
        ariaLabel="Organization units"
        [nodes]="nodes"
        [(selected)]="selectedId"
        [(expanded)]="expandedIds"
      />
    `,
    typeImports: { '@kern-ui/angular/kit': ['KrnTreeNode'] },
    members: [
      `readonly nodes: readonly KrnTreeNode[] = [
        {
          id: 'engineering',
          label: 'Engineering',
          children: [
            { id: 'platform', label: 'Platform' },
            { id: 'security', label: 'Security' },
          ],
        },
      ];`,
      `selectedId = 'platform';`,
      `expandedIds: ReadonlySet<string> = new Set(['engineering']);`,
    ],
    riskTags: ['tree', 'controlled-state', 'typed-collection'],
    assertions: [
      'readonly KrnTreeNode[]',
      'ReadonlySet<string>',
      '[(selected)]="selectedId"',
      '[(expanded)]="expandedIds"',
    ],
  }),
  'data-table': defineRecipe({
    title: 'Typed controlled customer table',
    scenario: 'Provide typed rows, typed columns and stable domain identity.',
    template: `
      <krn-data-table
        ariaLabel="Customer portfolio"
        [data]="rows"
        [columns]="columns"
        [rowIdentity]="rowIdentity"
        [(page)]="page"
        [(selected)]="selectedRows"
      />
    `,
    typeImports: {
      '@kern-ui/angular/addon-grid': ['KrnDataColumn', 'KrnDataRowKey'],
    },
    members: [
      `readonly rows: readonly CustomerRow[] = [
        { id: 'cus-2048', name: 'Acme Europe', owner: 'Ada Lovelace', arr: 1800000 },
        { id: 'cus-4096', name: 'Globex', owner: 'Grace Hopper', arr: 920000 },
      ];`,
      `readonly columns: readonly KrnDataColumn<CustomerRow>[] = [
        { key: 'name', label: 'Customer', sortable: true, priority: 'primary' },
        { key: 'owner', label: 'Owner', sortable: true },
        {
          key: 'arr',
          label: 'ARR',
          align: 'end',
          format: (value) => new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(value),
        },
      ];`,
      `readonly rowIdentity = (row: CustomerRow): KrnDataRowKey => row.id;`,
      'page = 1;',
      `selectedRows: ReadonlySet<KrnDataRowKey> = new Set<KrnDataRowKey>();`,
    ],
    declarations: [
      `interface CustomerRow {
        readonly id: string;
        readonly name: string;
        readonly owner: string;
        readonly arr: number;
      }`,
    ],
    riskTags: ['data-grid', 'identity', 'controlled-state', 'typed-collection'],
    assertions: [
      'readonly KrnDataColumn<CustomerRow>[]',
      'row: CustomerRow',
      '=> row.id',
      '[(selected)]="selectedRows"',
    ],
  }),
  'data-grid': defineRecipe({
    title: 'Typed controlled enterprise data grid',
    scenario: 'Use typed columns, immutable rows, stable identity, sorting and selection state.',
    template: `
      <krn-data-grid
        ariaLabel="Customer portfolio"
        [data]="rows"
        [columns]="columns"
        [rowIdentity]="rowIdentity"
        [filterable]="true"
        [selectable]="true"
        [(filter)]="filter"
        [(sortKey)]="sortKey"
        [(sortDirection)]="sortDirection"
        [(selected)]="selectedRows"
      />
    `,
    typeImports: {
      '@kern-ui/angular/addon-grid': ['KrnDataColumn', 'KrnDataRowKey', 'KrnDataSortDirection'],
    },
    members: [
      `readonly rows: readonly CustomerRow[] = [
        { id: 'cus-2048', name: 'Acme Europe', owner: 'Ada Lovelace', risk: 18 },
        { id: 'cus-4096', name: 'Globex', owner: 'Grace Hopper', risk: 72 },
      ];`,
      `readonly columns: readonly KrnDataColumn<CustomerRow>[] = [
        { key: 'name', label: 'Customer', sortable: true, priority: 'primary' },
        { key: 'owner', label: 'Owner', sortable: true },
        { key: 'risk', label: 'Risk', sortable: true, align: 'end' },
      ];`,
      `readonly rowIdentity = (row: CustomerRow): KrnDataRowKey => row.id;`,
      `filter = '';`,
      `sortKey = 'name';`,
      `sortDirection: KrnDataSortDirection = 'asc';`,
      `selectedRows: ReadonlySet<KrnDataRowKey> = new Set<KrnDataRowKey>();`,
    ],
    declarations: [
      `interface CustomerRow {
        readonly id: string;
        readonly name: string;
        readonly owner: string;
        readonly risk: number;
      }`,
    ],
    riskTags: ['data-grid', 'identity', 'controlled-state', 'typed-collection'],
    assertions: [
      'readonly KrnDataColumn<CustomerRow>[]',
      'row: CustomerRow',
      '=> row.id',
      '[(sortDirection)]="sortDirection"',
      '[(selected)]="selectedRows"',
    ],
  }),
  calendar: defineRecipe({
    title: 'Controlled renewal calendar',
    scenario: 'Own ISO date, active month and focus state with stable disabled dates.',
    template: `
      <krn-calendar
        ariaLabel="Renewal calendar"
        locale="en-GB"
        today="2026-07-29"
        [disabledDates]="disabledDates"
        [(value)]="selectedDate"
        [(activeMonth)]="activeMonth"
        [(focusedDate)]="focusedDate"
      />
    `,
    members: [
      `selectedDate = '2026-08-14';`,
      `activeMonth = '2026-08';`,
      `focusedDate = '2026-08-14';`,
      `readonly disabledDates: ReadonlySet<string> = new Set(['2026-08-16']);`,
    ],
    riskTags: ['date-time', 'controlled-state'],
    assertions: ['ReadonlySet<string>', '[(activeMonth)]="activeMonth"'],
  }),
  'code-block': defineRecipe({
    title: 'Copyable API request example',
    scenario: 'Render a complete short code sample with language metadata.',
    template: `
      <krn-code-block
        language="typescript"
        languageLabel="TypeScript"
        [code]="sourceCode"
        [(copied)]="copied"
      />
    `,
    members: [
      `readonly sourceCode = "const customer = await client.customers.get('cus-2048');";`,
      'copied = false;',
    ],
    riskTags: ['controlled-state'],
    assertions: ['[(copied)]="copied"'],
  }),
  'keyboard-shortcut': defineRecipe({
    title: 'Command shortcut hint',
    scenario: 'Expose the ordered keys for a common command.',
    template: `<krn-keyboard-shortcut [keys]="shortcut" />`,
    members: [`readonly shortcut: readonly string[] = ['Ctrl', 'K'];`],
    assertions: ['readonly string[]'],
  }),
  meter: defineRecipe({
    title: 'Account health meter',
    scenario: 'Communicate a bounded value with visible label and thresholds.',
    template: `
      <krn-meter
        label="Account health"
        [value]="82"
        [min]="0"
        [max]="100"
        [low]="40"
        [high]="75"
      />
    `,
  }),
  rating: defineRecipe({
    title: 'Controlled customer rating',
    scenario: 'Keep the selected numeric rating in application state.',
    template: `
      <krn-rating
        ariaLabel="Customer satisfaction"
        [max]="5"
        [(value)]="rating"
      />
    `,
    members: ['rating = 4;'],
    riskTags: ['controlled-state'],
    assertions: ['[(value)]="rating"'],
  }),
  'line-chart': defineRecipe({
    title: 'Typed monthly revenue line chart',
    scenario: 'Provide stable datum identity and explicit accessible chart context.',
    template: `
      <krn-line-chart
        title="Monthly recurring revenue"
        description="Revenue for the current quarter"
        [data]="revenue"
      />
    `,
    typeImports: { '@kern-ui/angular/addon-charts': ['KrnChartDatum'] },
    members: [
      `readonly revenue: readonly KrnChartDatum[] = [
        { id: 'jul', label: 'July', value: 1420000 },
        { id: 'aug', label: 'August', value: 1570000 },
        { id: 'sep', label: 'September', value: 1800000 },
      ];`,
    ],
    riskTags: ['charts', 'typed-collection'],
    assertions: ['readonly KrnChartDatum[]'],
  }),
  'bar-chart': defineRecipe({
    title: 'Typed regional revenue bar chart',
    scenario: 'Compare categorical values using stable typed data.',
    template: `
      <krn-bar-chart
        title="Revenue by region"
        description="Annual recurring revenue"
        [data]="revenue"
      />
    `,
    typeImports: { '@kern-ui/angular/addon-charts': ['KrnChartDatum'] },
    members: [
      `readonly revenue: readonly KrnChartDatum[] = [
        { id: 'emea', label: 'EMEA', value: 1800000 },
        { id: 'amer', label: 'Americas', value: 1450000 },
        { id: 'apac', label: 'APAC', value: 980000 },
      ];`,
    ],
    riskTags: ['charts', 'typed-collection'],
    assertions: ['readonly KrnChartDatum[]'],
  }),
  'donut-chart': defineRecipe({
    title: 'Typed portfolio mix donut chart',
    scenario: 'Show part-to-whole values with stable typed datum identity.',
    template: `
      <krn-donut-chart
        title="Portfolio by segment"
        description="Customer count by commercial segment"
        [data]="segments"
      />
    `,
    typeImports: { '@kern-ui/angular/addon-charts': ['KrnChartDatum'] },
    members: [
      `readonly segments: readonly KrnChartDatum[] = [
        { id: 'enterprise', label: 'Enterprise', value: 48 },
        { id: 'commercial', label: 'Commercial', value: 36 },
        { id: 'startup', label: 'Startup', value: 16 },
      ];`,
    ],
    riskTags: ['charts', 'typed-collection'],
    assertions: ['readonly KrnChartDatum[]'],
  }),
  'responsive-media': defineRecipe({
    title: 'Responsive report preview',
    scenario: 'Contain responsive media within a stable aspect ratio.',
    template: `
      <krn-responsive-media aspectRatio="16 / 9">
        <div role="img" aria-label="Revenue dashboard preview">
          Revenue dashboard preview
        </div>
      </krn-responsive-media>
    `,
  }),
  'user-menu': defineRecipe({
    title: 'Controlled user action menu',
    scenario: 'Own menu disclosure state and provide a visible signed-in identity.',
    template: `
      <krn-user-menu
        name="Ada Lovelace"
        detail="Platform administrator"
        [(open)]="open"
      >
        <span krnUserAvatar aria-hidden="true">AL</span>
        <button role="menuitem" type="button">Profile</button>
        <button role="menuitem" type="button">Sign out</button>
      </krn-user-menu>
    `,
    members: ['open = false;'],
    riskTags: ['overlay', 'controlled-state', 'pattern'],
    assertions: ['[(open)]="open"'],
  }),
  'notification-center': defineRecipe({
    title: 'Typed notification center',
    scenario: 'Render immutable notification records with stable ids and read state.',
    template: `
      <krn-notification-center
        heading="Account notifications"
        [notifications]="notifications"
        (markAllRead)="markAllRead()"
      />
    `,
    typeImports: { '@kern-ui/angular/patterns': ['KrnNotification'] },
    members: [
      `notifications: readonly KrnNotification[] = [
        {
          id: 'notification-renewal',
          title: 'Renewal review due',
          detail: 'Acme Europe requires review before 15 October.',
          timestamp: '10 minutes ago',
          read: false,
          tone: 'warning',
        },
      ];`,
      `markAllRead(): void {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          read: true,
        }));
      }`,
    ],
    riskTags: ['pattern', 'typed-collection'],
    assertions: ['readonly KrnNotification[]'],
  }),
  'global-search': defineRecipe({
    title: 'Controlled typed global search',
    scenario: 'Own query, popup and active result state while supplying stable results.',
    template: `
      <krn-global-search
        [results]="results"
        [(query)]="query"
        [(open)]="open"
        [(activeIndex)]="activeIndex"
      />
    `,
    typeImports: { '@kern-ui/angular/patterns': ['KrnSearchResult'] },
    members: [
      `readonly results: readonly KrnSearchResult[] = [
        {
          id: 'customer-acme',
          label: 'Acme Europe',
          description: 'Enterprise customer',
          group: 'Customers',
          keywords: ['renewal', 'ada'],
        },
        {
          id: 'report-risk',
          label: 'Risk report',
          description: 'Accounts requiring review',
          group: 'Reports',
        },
      ];`,
      `query = '';`,
      'open = false;',
      'activeIndex = 0;',
    ],
    riskTags: ['pattern', 'overlay', 'controlled-state', 'typed-collection'],
    assertions: [
      'readonly KrnSearchResult[]',
      '[(query)]="query"',
      '[(open)]="open"',
      '[(activeIndex)]="activeIndex"',
    ],
  }),
  'filter-bar': defineRecipe({
    title: 'Controlled typed customer filters',
    scenario: 'Provide typed filter definitions and own the selected value map.',
    template: `
      <krn-filter-bar
        ariaLabel="Customer filters"
        [filters]="filters"
        [(values)]="filterValues"
      />
    `,
    typeImports: { '@kern-ui/angular/patterns': ['KrnFilterDefinition'] },
    members: [
      `readonly filters: readonly KrnFilterDefinition[] = [
        {
          id: 'status',
          label: 'Status',
          options: [
            { value: 'healthy', label: 'Healthy', count: 42 },
            { value: 'risk', label: 'At risk', count: 3 },
          ],
        },
        {
          id: 'segment',
          label: 'Segment',
          options: [
            { value: 'enterprise', label: 'Enterprise' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
      ];`,
      `filterValues: Readonly<Partial<Record<string, string>>> = { status: 'healthy' };`,
    ],
    riskTags: ['pattern', 'controlled-state', 'typed-collection'],
    assertions: ['readonly KrnFilterDefinition[]', '[(values)]="filterValues"'],
  }),
  'page-header': defineRecipe({
    title: 'Customer portfolio page header',
    scenario: 'Pair required heading with page context and projected metadata.',
    template: `
      <krn-page-header
        index="02"
        eyebrow="Customers"
        heading="Portfolio health"
        description="Review renewal risk and account ownership."
      >
        <span krnPageHeaderMeta>Updated 12 minutes ago</span>
      </krn-page-header>
    `,
  }),
  'settings-panel': defineRecipe({
    title: 'Controlled settings panel',
    scenario: 'Own panel visibility and compose persistent action controls.',
    template: `
      <button type="button" (click)="open = true">Open settings</button>
      <krn-settings-panel heading="Report settings" [(open)]="open">
        <p>Choose visible metrics and reporting period.</p>
        <button krnSettingsActions type="button" (click)="open = false">Apply</button>
      </krn-settings-panel>
    `,
    members: ['open = false;'],
    riskTags: ['pattern', 'overlay', 'controlled-state'],
    assertions: ['[(open)]="open"'],
  }),
  'crud-toolbar': defineRecipe({
    title: 'Customer CRUD toolbar',
    scenario: 'Compose a title and actions while exposing selection count.',
    template: `
      <krn-crud-toolbar ariaLabel="Customer actions" [selectedCount]="selectedCount">
        <strong krnToolbarTitle>Customers</strong>
        <button type="button">Create customer</button>
        <button type="button" [disabled]="selectedCount === 0">Archive selected</button>
      </krn-crud-toolbar>
    `,
    members: ['selectedCount = 2;'],
    riskTags: ['pattern'],
  }),
  'bulk-actions': defineRecipe({
    title: 'Selected-customer bulk actions',
    scenario: 'Use the bulk-action alias with explicit selected record count.',
    template: `
      <krn-bulk-actions ariaLabel="Selected customer actions" [selectedCount]="selectedCount">
        <strong krnToolbarTitle>{{ selectedCount }} customers selected</strong>
        <button type="button">Assign owner</button>
        <button type="button">Archive</button>
      </krn-bulk-actions>
    `,
    members: ['selectedCount = 3;'],
    riskTags: ['pattern'],
  }),
  'master-detail-layout': defineRecipe({
    title: 'Controlled customer master-detail layout',
    scenario: 'Keep compact detail visibility synchronized with route or selection state.',
    template: `
      <krn-master-detail-layout
        masterLabel="Customers"
        detailLabel="Customer details"
        [(detailOpen)]="detailOpen"
      >
        <section krnMaster>
          <button type="button" (click)="detailOpen = true">Acme Europe</button>
        </section>
        <section krnDetail>
          <h2>Acme Europe</h2>
          <button type="button" (click)="detailOpen = false">Back to customers</button>
        </section>
      </krn-master-detail-layout>
    `,
    members: ['detailOpen = false;'],
    riskTags: ['pattern', 'responsive', 'controlled-state'],
    assertions: ['[(detailOpen)]="detailOpen"'],
  }),
  'dashboard-widget': defineRecipe({
    title: 'Revenue dashboard widget',
    scenario: 'Compose required heading, body and a supporting footer.',
    template: `
      <krn-dashboard-widget eyebrow="Portfolio" heading="Annual recurring revenue">
        <strong>€1.8M</strong>
        <span krnWidgetFooter>+8.4% year over year</span>
      </krn-dashboard-widget>
    `,
  }),
  'login-form': defineRecipe({
    title: 'Typed enterprise sign-in form',
    scenario: 'Handle typed submitted credentials and loading state.',
    template: `
      <krn-login-form
        recoveryHref="/recover-access"
        [loading]="submitting"
        (submitted)="submit($event)"
      />
    `,
    typeImports: { '@kern-ui/angular/patterns': ['KrnLoginCredentials'] },
    members: [
      'submitting = false;',
      'lastSubmission: KrnLoginCredentials | null = null;',
      `submit(credentials: KrnLoginCredentials): void {
        this.lastSubmission = credentials;
        this.submitting = true;
      }`,
    ],
    riskTags: ['pattern', 'forms', 'typed-output'],
    assertions: ['KrnLoginCredentials', '(submitted)="submit($event)"'],
  }),
  'profile-form': defineRecipe({
    title: 'Typed editable profile form',
    scenario: 'Supply typed initial profile state and consume typed save output.',
    template: `
      <krn-profile-form
        [value]="profile"
        [timezones]="timezones"
        [saving]="saving"
        (saved)="save($event)"
      />
    `,
    typeImports: { '@kern-ui/angular/patterns': ['KrnProfileValue'] },
    members: [
      `profile: KrnProfileValue = {
        name: 'Ada Lovelace',
        role: 'Platform administrator',
        bio: 'Owns customer-platform operations.',
        timezone: 'Europe/London',
      };`,
      `readonly timezones: readonly { readonly value: string; readonly label: string }[] = [
        { value: 'Europe/London', label: 'London' },
        { value: 'Europe/Berlin', label: 'Berlin' },
      ];`,
      'saving = false;',
      `save(value: KrnProfileValue): void {
        this.profile = value;
        this.saving = true;
      }`,
    ],
    riskTags: ['pattern', 'forms', 'typed-output'],
    assertions: ['profile: KrnProfileValue', '(saved)="save($event)"'],
  }),
  'multi-step-form': defineRecipe({
    title: 'Controlled typed onboarding form',
    scenario: 'Supply required typed steps and own current and furthest progress.',
    template: `
      <krn-multi-step-form
        ariaLabel="Customer onboarding"
        [steps]="steps"
        [(current)]="currentStep"
        [(furthestStep)]="furthestStep"
      >
        <p>Complete the current onboarding section.</p>
      </krn-multi-step-form>
    `,
    typeImports: { '@kern-ui/angular/patterns': ['KrnFormStep'] },
    members: [
      `readonly steps: readonly KrnFormStep[] = [
        { id: 'company', label: 'Company', valid: true },
        { id: 'owners', label: 'Owners', valid: false },
        { id: 'review', label: 'Review', optional: true },
      ];`,
      'currentStep = 1;',
      'furthestStep = 1;',
    ],
    riskTags: ['pattern', 'forms', 'controlled-state', 'typed-collection'],
    assertions: [
      'readonly KrnFormStep[]',
      '[(current)]="currentStep"',
      '[(furthestStep)]="furthestStep"',
    ],
  }),
  'mobile-navigation': defineRecipe({
    title: 'Mobile application navigation',
    scenario: 'Compose touch-friendly primary destinations under one accessible label.',
    template: `
      <krn-mobile-navigation ariaLabel="Primary mobile navigation">
        <a href="/home">Home</a>
        <a href="/tasks">Tasks</a>
        <a href="/account">Account</a>
      </krn-mobile-navigation>
    `,
  }),
  'responsive-application-shell': defineRecipe({
    title: 'Controlled responsive product shell',
    scenario: 'Compose header, navigation and mobile fallback with owned disclosure state.',
    template: `
      <krn-responsive-application-shell
        mainId="main-content"
        [(navigationOpen)]="navigationOpen"
      >
        <header krnAppHeader>
          <button type="button" (click)="navigationOpen = true">Open navigation</button>
          KERN Console
        </header>
        <nav krnAppNavigation aria-label="Primary">Customers · Reports · Settings</nav>
        <main id="main-content">
          <h1>Customer portfolio</h1>
        </main>
        <nav krnAppMobileNavigation aria-label="Mobile primary navigation">
          Home · Tasks · Account
        </nav>
      </krn-responsive-application-shell>
    `,
    members: ['navigationOpen = false;'],
    riskTags: ['pattern', 'responsive', 'controlled-state'],
    assertions: ['[(navigationOpen)]="navigationOpen"'],
  }),
});

export const KERN_AGENT_HIGH_RISK_TASKS = Object.freeze([
  {
    id: 'choose-single-owner',
    query: 'select one typed option form',
    component: 'select',
    requiredMarkers: ['readonly KrnSelectOption<string>[]', '[(open)]="open"'],
  },
  {
    id: 'choose-multiple-reviewers',
    query: 'select multiple typed options form',
    component: 'multi-select',
    requiredMarkers: ['FormControl<readonly string[]>', '[(open)]="open"'],
  },
  {
    id: 'build-controlled-grid',
    query: 'enterprise data grid table sorting selection',
    component: 'data-grid',
    requiredMarkers: ['readonly KrnDataColumn<CustomerRow>[]', '=> row.id'],
  },
  {
    id: 'navigate-tree',
    query: 'tree',
    component: 'tree',
    requiredMarkers: ['ReadonlySet<string>', '[(expanded)]="expandedIds"'],
  },
  {
    id: 'pick-date-range',
    query: 'date range form',
    component: 'date-range-picker',
    requiredMarkers: ['FormControl<KrnDateRangeValue>', 'today="2026-07-29"'],
  },
  {
    id: 'open-modal',
    query: 'dialog',
    component: 'dialog',
    requiredMarkers: ['[(open)]="open"', 'open = false'],
  },
  {
    id: 'search-commands',
    query: 'command palette',
    component: 'command-palette',
    requiredMarkers: ['readonly KrnCommandItem[]', '[(query)]="query"'],
  },
  {
    id: 'responsive-master-detail',
    query: 'master detail',
    component: 'master-detail-layout',
    requiredMarkers: ['[(detailOpen)]="detailOpen"'],
  },
]);
