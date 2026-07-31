import {
  KRN_CLIPBOARD_WRITER,
  KRN_OVERLAY_HOST,
  KRN_PLATFORM,
  KrnIdService,
} from '@kern-ui/angular/cdk';
import {
  KRN_CONFIG,
  KRN_TRANSLATIONS,
  KrnIconRegistry,
  KrnThemeService,
} from '@kern-ui/angular/core';
import {
  KRN_COPY_LABELS,
  KRN_DEFAULT_COPY_LABELS,
  KRN_DEFAULT_LOADING_LABEL,
  KRN_LOADING_LABEL,
} from '@kern-ui/angular/i18n';
import {
  KrnButton,
  KrnCopyButton,
  KrnFormField,
  KrnSelect,
  KrnToastService,
  provideKrnCopyButtonOptions,
} from '@kern-ui/angular/kit';
import { KrnDataGrid } from '@kern-ui/angular/addon-grid';
import { KrnBarChart } from '@kern-ui/angular/addon-charts';
import { KrnLoginForm, KrnPageHeader } from '@kern-ui/angular/patterns';

export const runtimeSubpathExports = [
  KRN_CLIPBOARD_WRITER,
  KRN_OVERLAY_HOST,
  KRN_PLATFORM,
  KrnIdService,
  KRN_CONFIG,
  KRN_TRANSLATIONS,
  KRN_COPY_LABELS,
  KRN_DEFAULT_COPY_LABELS,
  KRN_DEFAULT_LOADING_LABEL,
  KRN_LOADING_LABEL,
  KrnIconRegistry,
  KrnThemeService,
  KrnButton,
  KrnCopyButton,
  KrnFormField,
  KrnSelect,
  KrnToastService,
  KrnDataGrid,
  KrnBarChart,
  KrnLoginForm,
  KrnPageHeader,
  provideKrnCopyButtonOptions,
] as const;
