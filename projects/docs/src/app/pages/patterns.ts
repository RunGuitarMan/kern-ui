import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

import { DocsI18n } from '../docs-i18n';

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
  protected readonly i18n = inject(DocsI18n);
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
  private readonly readNotifications = signal<ReadonlySet<string>>(new Set());
  protected readonly notifications = computed<readonly KrnNotification[]>(() => [
    {
      id: 'n1',
      title: this.i18n.t('patterns.seatThreshold', 'Seat threshold reached'),
      detail: this.i18n.t(
        'patterns.seatThresholdDetail',
        'Fieldnote is using 96% of its available seats.',
      ),
      timestamp: this.i18n.t('patterns.minutes8', '8 minutes ago'),
      read: this.readNotifications().has('n1'),
      tone: 'warning',
    },
    {
      id: 'n2',
      title: this.i18n.t('patterns.exportCompleted', 'Export completed'),
      detail: this.i18n.t(
        'patterns.exportCompletedDetail',
        'The Q3 audit package is ready to download.',
      ),
      timestamp: this.i18n.t('patterns.minutes34', '34 minutes ago'),
      read: this.readNotifications().has('n2'),
      tone: 'success',
    },
  ]);
  protected readonly steps = computed<readonly KrnFormStep[]>(() => [
    {
      id: 'workspace',
      label: this.i18n.t('patterns.workspace', 'Workspace'),
      description: this.i18n.t('patterns.identity', 'Identity'),
      valid: true,
    },
    {
      id: 'people',
      label: this.i18n.t('patterns.people', 'People'),
      description: this.i18n.t('patterns.collaborators', 'Collaborators'),
      optional: true,
      valid: true,
    },
    {
      id: 'review',
      label: this.i18n.t('patterns.review', 'Review'),
      description: this.i18n.t('patterns.policy', 'Policy'),
      valid: true,
    },
  ]);
  protected readonly profile = computed<KrnProfileValue>(() => ({
    name: 'Avery Cole',
    role: this.i18n.t('patterns.operationsLead', 'Operations lead'),
    bio: this.i18n.t('patterns.profileBio', 'Designing calm systems for complicated work.'),
    timezone: 'Europe/London',
  }));

  protected selectWorkspace(id: number): void {
    this.selectedWorkspace.set(id);
    this.detailOpen.set(true);
    this.selectedCount.set(id === 2 ? 1 : 0);
  }

  protected markAllRead(): void {
    this.readNotifications.set(new Set(['n1', 'n2']));
  }

  protected signedIn(credentials: KrnLoginCredentials): void {
    this.loginMessage.set(
      this.i18n.russian()
        ? `Выполнен вход: ${credentials.email}.`
        : `Signed in as ${credentials.email}.`,
    );
  }

  protected profileSaved(value: KrnProfileValue): void {
    this.profileMessage.set(
      this.i18n.russian()
        ? `Профиль пользователя ${value.name} сохранён.`
        : `${value.name}'s profile was saved.`,
    );
  }

  protected workspaceState(state: 'Healthy' | 'Attention'): string {
    return state === 'Healthy'
      ? this.i18n.t('patterns.healthy', 'Healthy')
      : this.i18n.t('patterns.attention', 'Attention');
  }
}
