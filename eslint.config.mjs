import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'coverage/**',
      'node_modules/**',
      'out-tsc/**',
      'playwright-report/**',
      'projects/kern/api/**/*.d.ts',
      'test-results/**',
    ],
  },
  {
    files: ['projects/**/*.{ts,js,mjs,cjs}'],
    plugins: {
      '@nx': nx,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allow: [],
          depConstraints: [
            {
              sourceTag: 'scope:kern',
              onlyDependOnLibsWithTags: ['scope:kern'],
            },
            {
              sourceTag: 'scope:showcase',
              onlyDependOnLibsWithTags: ['scope:kern', 'scope:showcase'],
            },
            {
              sourceTag: 'scope:docs',
              onlyDependOnLibsWithTags: ['scope:kern', 'scope:showcase', 'scope:docs'],
            },
          ],
          enforceBuildableLibDependency: true,
        },
      ],
    },
  },
  {
    files: ['projects/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@angular-eslint': angular,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: ['krn', 'kdocs', 'kshow'], style: 'kebab-case' },
          // Components may enhance a native semantic host while retaining a
          // template (for example, button[krnButton]).
          { type: 'attribute', prefix: 'krn', style: 'camelCase' },
        ],
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'krn', style: 'camelCase' },
      ],
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['projects/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
    },
  },
  {
    files: ['projects/kern/agent/{examples,recipes}/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  // Package-style aliases intentionally resolve through dist, so keep the publishable-to-private
  // back-edge explicit in addition to Nx's tagged relative/absolute import checks.
  {
    files: ['projects/kern/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@kern-ui/showcase', '@kern-ui/showcase/**'],
              message: 'The publishable Kern package must not depend on the private showcase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/kern/cdk/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@kern-ui/angular',
              message: 'Kern CDK must not import the compatibility root.',
            },
          ],
          patterns: [
            {
              group: [
                '@kern-ui/angular/addon-charts',
                '@kern-ui/angular/addon-grid',
                '@kern-ui/angular/core',
                '@kern-ui/angular/i18n',
                '@kern-ui/angular/kit',
                '@kern-ui/angular/patterns',
              ],
              message: 'Kern CDK must not depend on higher-level library layers.',
            },
            {
              group: ['@kern-ui/showcase', '@kern-ui/showcase/**'],
              message: 'The publishable Kern package must not depend on the private showcase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/kern/i18n/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@kern-ui/angular',
              message: 'Kern i18n must not import the compatibility root.',
            },
          ],
          patterns: [
            {
              group: [
                '@kern-ui/angular/addon-charts',
                '@kern-ui/angular/addon-grid',
                '@kern-ui/angular/cdk',
                '@kern-ui/angular/core',
                '@kern-ui/angular/kit',
                '@kern-ui/angular/patterns',
              ],
              message: 'Kern i18n must remain an independent leaf-token layer.',
            },
            {
              group: ['@kern-ui/showcase', '@kern-ui/showcase/**'],
              message: 'The publishable Kern package must not depend on the private showcase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/kern/core/src/lib/foundations/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@kern-ui/angular',
              message: 'Kern foundations must not import the compatibility root.',
            },
          ],
          patterns: [
            {
              group: [
                '../core/**',
                '@kern-ui/angular/addon-charts',
                '@kern-ui/angular/addon-grid',
                '@kern-ui/angular/cdk',
                '@kern-ui/angular/i18n',
                '@kern-ui/angular/kit',
                '@kern-ui/angular/patterns',
              ],
              message: 'Kern foundations must not depend on component or product layers.',
            },
            {
              group: ['@kern-ui/showcase', '@kern-ui/showcase/**'],
              message: 'The publishable Kern package must not depend on the private showcase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/kern/core/src/lib/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@kern-ui/angular',
              message: 'Kern core must not import the compatibility root.',
            },
          ],
          patterns: [
            {
              group: [
                '@kern-ui/angular/addon-charts',
                '@kern-ui/angular/addon-grid',
                '@kern-ui/angular/kit',
                '@kern-ui/angular/patterns',
              ],
              message: 'Kern core may depend only on Angular, CDK, i18n, and foundations.',
            },
            {
              group: ['@kern-ui/showcase', '@kern-ui/showcase/**'],
              message: 'The publishable Kern package must not depend on the private showcase.',
            },
          ],
        },
      ],
    },
  },
];
