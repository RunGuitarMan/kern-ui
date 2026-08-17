import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { KrnBarChart, type KrnChartDatum } from '@kern-ui/angular/addon-charts';
import { KrnAlert, KrnBadge, KrnButton } from '@kern-ui/angular/kit';
import {
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
  type KrnFormStep,
  type KrnLoginCredentials,
  type KrnNotification,
  type KrnProfileValue,
} from '@kern-ui/angular/patterns';

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
  templateUrl: './patterns.html',
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
