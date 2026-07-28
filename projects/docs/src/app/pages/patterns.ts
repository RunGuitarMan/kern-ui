import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  KrnAlert,
  KrnBarChart,
  KrnBadge,
  KrnButton,
  KrnCrudToolbar,
  KrnDashboardWidget,
  KrnLoginForm,
  KrnMasterDetailLayout,
  KrnMultiStepForm,
  KrnNotificationCenter,
  KrnPageHeader,
  KrnProfileForm,
  KrnSettingsPanel,
  KrnUserMenu,
  type KrnChartDatum,
  type KrnFormStep,
  type KrnLoginCredentials,
  type KrnNotification,
  type KrnProfileValue,
} from '@kern-ui/angular';

@Component({
  selector: 'kdocs-patterns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KrnAlert,
    KrnBarChart,
    KrnBadge,
    KrnButton,
    KrnCrudToolbar,
    KrnDashboardWidget,
    KrnLoginForm,
    KrnMasterDetailLayout,
    KrnMultiStepForm,
    KrnNotificationCenter,
    KrnPageHeader,
    KrnProfileForm,
    KrnSettingsPanel,
    KrnUserMenu,
  ],
  template: `
    <article class="page">
      <krn-page-header
        index="08"
        eyebrow="Patterns"
        heading="Product flows, assembled in the open."
        description="Patterns combine public primitives without hiding product decisions. Copy them, adapt them, and keep the underlying accessibility contracts."
      >
        <krn-badge tone="brand">15 compositions</krn-badge>
      </krn-page-header>

      <section class="pattern">
        <header>
          <p>08.1 / APPLICATION FRAME</p>
          <h2>Operational toolbar + master detail.</h2>
          <p>
            Selection state changes the toolbar context. Narrow containers replace the two-column
            split with a list/detail transition.
          </p>
        </header>
        <div class="demo-frame">
          <krn-crud-toolbar ariaLabel="Workspace actions" [selectedCount]="selectedCount()">
            <strong krnToolbarTitle>Workspaces</strong>
            @if (selectedCount()) {
              <krn-button variant="ghost" tone="danger" (activated)="selectedCount.set(0)"
                >Archive</krn-button
              >
            } @else {
              <krn-button variant="outline" tone="neutral">Export</krn-button>
              <krn-button>New workspace</krn-button>
            }
          </krn-crud-toolbar>
          <krn-master-detail-layout [(detailOpen)]="detailOpen">
            <div krnMaster class="master-list">
              @for (workspace of workspaces; track workspace.id) {
                <button
                  type="button"
                  [attr.aria-current]="selectedWorkspace() === workspace.id ? 'true' : null"
                  (click)="selectWorkspace(workspace.id)"
                >
                  <span>
                    <strong>{{ workspace.name }}</strong>
                    <small>{{ workspace.owner }}</small>
                  </span>
                  <krn-badge [tone]="workspace.state === 'Healthy' ? 'success' : 'warning'" status>
                    {{ workspace.state }}
                  </krn-badge>
                </button>
              }
            </div>
            <div krnDetail class="detail-panel">
              <button class="back" type="button" (click)="detailOpen.set(false)">
                ← Back to workspaces
              </button>
              <span class="eyebrow">WORKSPACE / {{ selectedWorkspace() }}</span>
              <h3>{{ selectedWorkspaceName() }}</h3>
              <p>
                Permissions, automation health, and usage context remain available without leaving
                the list.
              </p>
              <krn-alert tone="success" title="Healthy"
                >All scheduled runs completed inside the service target.</krn-alert
              >
            </div>
          </krn-master-detail-layout>
        </div>
      </section>

      <section class="pattern">
        <header>
          <p>08.2 / DASHBOARD</p>
          <h2>Widgets with real information hierarchy.</h2>
          <p>
            Widgets are not decorative cards: heading, data, status, and actions remain structurally
            consistent.
          </p>
        </header>
        <div class="widget-grid">
          <krn-dashboard-widget eyebrow="AUTOMATION" heading="Runs by environment">
            <krn-bar-chart title="Last 24 hours" [data]="automationData" />
          </krn-dashboard-widget>
          <krn-dashboard-widget eyebrow="NOTIFICATIONS" heading="Needs attention">
            <krn-notification-center
              heading="Recent events"
              [notifications]="notifications()"
              (markAllRead)="markAllRead()"
            />
          </krn-dashboard-widget>
        </div>
      </section>

      <section class="pattern">
        <header>
          <p>08.3 / MULTI-STEP FORM</p>
          <h2>Progress with validation, not ceremony.</h2>
          <p>
            Navigation exposes the current step, completed reach, optional labels, and invalid-step
            gating.
          </p>
        </header>
        <div class="form-surface">
          <krn-multi-step-form
            [steps]="steps()"
            [(current)]="currentStep"
            completeLabel="Create workspace"
            (completed)="formCompleted.set(true)"
          >
            @switch (currentStep()) {
              @case (0) {
                <div class="step-copy">
                  <span>STEP 01</span>
                  <h3>Name the workspace</h3>
                  <p>Choose a name your team can recognize in audit logs.</p>
                </div>
              }
              @case (1) {
                <div class="step-copy">
                  <span>STEP 02</span>
                  <h3>Invite collaborators</h3>
                  <p>Add members now, or continue and invite them later.</p>
                </div>
              }
              @case (2) {
                <div class="step-copy">
                  <span>STEP 03</span>
                  <h3>Review policy</h3>
                  <p>Confirm access and retention settings before creation.</p>
                </div>
              }
            }
          </krn-multi-step-form>
          @if (formCompleted()) {
            <krn-alert tone="success" title="Workspace created"
              >The pattern emitted a typed completion event.</krn-alert
            >
          }
        </div>
      </section>

      <section class="pattern auth-pattern">
        <header>
          <p>08.4 / AUTH + PROFILE</p>
          <h2>Typed forms with honest states.</h2>
          <p>
            Touched, invalid, dirty, loading, error, and saved states are visible to both users and
            assistive technology.
          </p>
        </header>
        <div class="auth-grid">
          <div class="form-card">
            <span class="eyebrow">ACCOUNT / SIGN IN</span>
            <h3>Continue to Kern</h3>
            <krn-login-form (submitted)="signedIn($event)" />
            @if (loginMessage()) {
              <krn-alert tone="success" title="Credentials accepted">{{
                loginMessage()
              }}</krn-alert>
            }
          </div>
          <div class="form-card">
            <span class="eyebrow">SETTINGS / PROFILE</span>
            <h3>Public profile</h3>
            <krn-profile-form [value]="profile" (saved)="profileSaved($event)" />
            @if (profileMessage()) {
              <krn-alert tone="success">{{ profileMessage() }}</krn-alert>
            }
          </div>
        </div>
      </section>

      <section class="pattern compact-pattern">
        <header>
          <p>08.5 / GLOBAL CONTEXT</p>
          <h2>User menu and settings panel.</h2>
        </header>
        <div class="context-demo">
          <krn-user-menu name="Avery Cole" detail="avery@north.ops">
            <span krnUserAvatar class="avatar">AC</span>
            <button role="menuitem" type="button">Profile</button>
            <button role="menuitem" type="button" (click)="settingsOpen.set(true)">
              Workspace settings
            </button>
            <button role="menuitem" type="button">Sign out</button>
          </krn-user-menu>
          <krn-button variant="outline" tone="neutral" (activated)="settingsOpen.set(true)"
            >Open settings</krn-button
          >
        </div>
      </section>
    </article>

    <krn-settings-panel heading="Workspace settings" [(open)]="settingsOpen">
      <div class="settings-content">
        <h3>Default experience</h3>
        <label>Workspace name <input value="Northstar" /></label>
        <label
          >Data region
          <select>
            <option>European Union</option>
            <option>United States</option>
          </select></label
        >
        <label class="check"
          ><input type="checkbox" checked /> Require SSO for administrators</label
        >
      </div>
      <div krnSettingsActions>
        <krn-button variant="outline" tone="neutral" (activated)="settingsOpen.set(false)"
          >Cancel</krn-button
        >
        <krn-button (activated)="settingsOpen.set(false)">Save changes</krn-button>
      </div>
    </krn-settings-panel>
  `,
  styleUrl: './patterns.css',
})
export class PatternsPage {
  protected readonly selectedCount = signal(0);
  protected readonly detailOpen = signal(false);
  protected readonly selectedWorkspace = signal(1);
  protected readonly currentStep = signal(0);
  protected readonly formCompleted = signal(false);
  protected readonly settingsOpen = signal(false);
  protected readonly loginMessage = signal('');
  protected readonly profileMessage = signal('');
  protected readonly workspaces = [
    { id: 1, name: 'Northstar', owner: 'Avery Cole', state: 'Healthy' },
    { id: 2, name: 'Fieldnote', owner: 'Mina Chen', state: 'Attention' },
    { id: 3, name: 'Orchard', owner: 'Ravi Singh', state: 'Healthy' },
  ] as const;
  protected readonly selectedWorkspaceName = () =>
    this.workspaces.find((workspace) => workspace.id === this.selectedWorkspace())?.name ??
    'Workspace';
  protected readonly automationData: readonly KrnChartDatum[] = [
    { label: 'Prod', value: 148 },
    { label: 'Stage', value: 82 },
    { label: 'Dev', value: 124 },
    { label: 'Local', value: 37 },
  ];
  protected readonly notifications = signal<readonly KrnNotification[]>([
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
      detail: 'The Q3 audit package is ready to download.',
      timestamp: '34 minutes ago',
      read: false,
      tone: 'success',
    },
  ]);
  protected readonly steps = signal<readonly KrnFormStep[]>([
    { id: 'workspace', label: 'Workspace', description: 'Identity', valid: true },
    { id: 'people', label: 'People', description: 'Collaborators', optional: true, valid: true },
    { id: 'review', label: 'Review', description: 'Policy', valid: true },
  ]);
  protected readonly profile: KrnProfileValue = {
    name: 'Avery Cole',
    role: 'Operations lead',
    bio: 'Designing calm systems for complicated work.',
    timezone: 'Europe/London',
  };

  protected selectWorkspace(id: number): void {
    this.selectedWorkspace.set(id);
    this.detailOpen.set(true);
    this.selectedCount.set(id === 2 ? 1 : 0);
  }

  protected markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  protected signedIn(credentials: KrnLoginCredentials): void {
    this.loginMessage.set(`Signed in as ${credentials.email}.`);
  }

  protected profileSaved(value: KrnProfileValue): void {
    this.profileMessage.set(`${value.name}'s profile was saved.`);
  }
}
