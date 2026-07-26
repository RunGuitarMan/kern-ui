# Kern

Kern is a production-oriented Angular design system for dense product interfaces. Its visual
language is **Editorial Instrument**: graphite and paper surfaces, a restrained ember accent,
tabular data, deliberate rules, and compact typography instead of generic Material styling.

The workspace targets Angular 22, strict TypeScript, standalone components, signals, built-in
control flow, typed reactive forms, SSR/hydration, and Angular's zoneless runtime.

## Workspace

| Project | Purpose | Publishable |
| --- | --- | --- |
| `projects/kern` | Components, composition patterns, tokens, themes, and public API | Yes, as `@kern-ui/angular` |
| `projects/docs` | SSR documentation and interactive component reference | No |
| `projects/lab` | Deterministic visual, responsive, RTL, and state-matrix harness | No |
| `projects/showcase` | Typed documentation catalog and coverage metadata | Private support library |

Kern contains 131 documented entries across Layout, Actions, Forms, Navigation, Feedback,
Data display, and Patterns. The component inventory and state contract are in
[`docs/COMPONENTS.md`](docs/COMPONENTS.md).

## Requirements

- Node.js `24.15.x` or compatible `24.x`
- npm `11+`
- Angular applications on Angular `22.x`

```bash
npm install
npm start
```

Documentation runs at `http://localhost:4200`. The isolated Lab runs at
`http://localhost:4201`:

```bash
npm run start:lab
```

## Consume the library

Build the package locally:

```bash
npm run build:kern
```

In a consumer, install the eventual package and its Angular/CDK peers:

```bash
npm install @kern-ui/angular @angular/cdk @angular/aria
```

Load the token and component style entry once:

```css
@import '@kern-ui/angular/styles/kern.css';
```

Register runtime theming:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideKrnTheme } from '@kern-ui/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKrnTheme({
      theme: 'system',
      density: 'comfortable',
      brandColor: '#d95831',
      persist: true,
    }),
  ],
};
```

Import standalone components directly:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KrnButton, KrnFormField, KrnTextInput } from '@kern-ui/angular';

@Component({
  selector: 'app-profile-action',
  imports: [KrnButton, KrnFormField, KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field label="Workspace name">
      <krn-text-input value="Northstar" />
    </krn-form-field>
    <krn-button variant="solid" tone="brand">Save changes</krn-button>
  `,
})
export class ProfileAction {}
```

The public theme service can switch `light`, `dark`, `system`, and `high-contrast` modes,
`compact`, `comfortable`, and `spacious` density, and a runtime brand color. CSS custom
properties remain the theming contract, so product-specific semantic overrides do not require
recompiling the library.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:a11y
npm run test:responsive
npm run test:visual
npm run package:dry-run
```

`npm run verify` runs the static checks, unit tests, production builds, and package dry-run.
Visual baselines are deterministic Lab scenarios selected with query parameters such as:

```text
http://localhost:4201/?component=data-grid&scenario=default&theme=dark&density=compact&direction=rtl
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for boundaries, accessibility guarantees,
extension guidance, and known trade-offs.

## Release

The repository does not publish automatically. Validate `dist/kern`, inspect the dry-run
tarball, then publish from `dist/kern` only as an explicit release action:

```bash
npm run build:kern
npm run package:dry-run
```

Kern is licensed under the MIT License.
