import type { Routes } from '@angular/router';
import { KERN_CATALOG_ALIASES } from '@kern-ui/showcase/catalog-index';

export const componentAliasRoutes: Routes = Object.entries(KERN_CATALOG_ALIASES).map(
  ([alias, canonical]) => ({
    path: `components/${alias}`,
    redirectTo: `/components/${canonical}`,
    pathMatch: 'full',
  }),
);

export const routes: Routes = [
  {
    path: '',
    title: 'Kern — Angular design system',
    loadComponent: () => import('./pages/home').then((module) => module.HomePage),
  },
  {
    path: 'foundations',
    title: 'Foundations · Kern',
    loadComponent: () => import('./pages/foundations').then((module) => module.FoundationsPage),
  },
  ...componentAliasRoutes,
  {
    path: 'components/:id',
    loadComponent: () => import('./pages/component-page').then((module) => module.ComponentPage),
  },
  {
    path: 'preview/:id',
    loadComponent: () => import('./pages/preview-page').then((module) => module.PreviewPage),
  },
  {
    path: 'patterns',
    title: 'Patterns · Kern',
    loadComponent: () => import('./pages/patterns').then((module) => module.PatternsPage),
  },
  {
    path: 'accessibility',
    title: 'Accessibility · Kern',
    loadComponent: () => import('./pages/accessibility').then((module) => module.AccessibilityPage),
  },
  {
    path: 'changelog',
    title: 'Changelog · Kern',
    loadComponent: () => import('./pages/changelog').then((module) => module.ChangelogPage),
  },
  { path: '**', redirectTo: '' },
];
