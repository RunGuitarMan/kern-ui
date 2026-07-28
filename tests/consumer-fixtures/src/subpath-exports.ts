import { KRN_OVERLAY_HOST, KRN_PLATFORM, KrnIdService } from '@kern-ui/angular/cdk';
import {
  KRN_CONFIG,
  KRN_TRANSLATIONS,
  KrnIconRegistry,
  KrnThemeService,
} from '@kern-ui/angular/core';
import { KrnButton, KrnFormField, KrnSelect, KrnToastService } from '@kern-ui/angular/kit';
import { KrnDataGrid } from '@kern-ui/angular/addon-grid';
import { KrnBarChart } from '@kern-ui/angular/addon-charts';
import { KrnLoginForm, KrnPageHeader } from '@kern-ui/angular/patterns';

export const runtimeSubpathExports = [
  KRN_OVERLAY_HOST,
  KRN_PLATFORM,
  KrnIdService,
  KRN_CONFIG,
  KRN_TRANSLATIONS,
  KrnIconRegistry,
  KrnThemeService,
  KrnButton,
  KrnFormField,
  KrnSelect,
  KrnToastService,
  KrnDataGrid,
  KrnBarChart,
  KrnLoginForm,
  KrnPageHeader,
] as const;
