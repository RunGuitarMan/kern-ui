import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
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
        { type: 'element', prefix: ['krn', 'kdocs', 'klab', 'kshow'], style: 'kebab-case' },
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
                '@kern-ui/angular/kit',
                '@kern-ui/angular/patterns',
              ],
              message: 'Kern CDK must not depend on higher-level library layers.',
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
                '@kern-ui/angular/kit',
                '@kern-ui/angular/patterns',
              ],
              message: 'Kern foundations must not depend on component or product layers.',
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
              message: 'Kern core may depend only on Angular, CDK, and foundations.',
            },
          ],
        },
      ],
    },
  },
];
