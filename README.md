# KERN

Kern is a production-oriented Angular design system for dense product interfaces. Its visual
language is **Editorial Instrument**: graphite and paper surfaces, a restrained ember accent,
tabular data, deliberate rules, and compact typography instead of generic Material styling.

The workspace targets Angular 22, strict TypeScript, standalone components, signals, built-in
control flow, typed reactive forms, SSR/hydration, and Angular's zoneless runtime.

## Workspace

| Project             | Purpose                                                          | Publishable                |
| ------------------- | ---------------------------------------------------------------- | -------------------------- |
| `projects/kern`     | Components, composition patterns, tokens, themes, and public API | Yes, as `@kern-ui/angular` |
| `projects/docs`     | SSR documentation and interactive component reference            | No                         |
| `projects/lab`      | Deterministic visual, responsive, RTL, and state-matrix harness  | No                         |
| `projects/showcase` | Typed documentation catalog and coverage metadata                | Private support library    |

Kern contains 131 catalog entries across Layout, Actions, Forms, Navigation, Feedback,
Data display, and Patterns. Each entry has an explicit lifecycle status; the inventory, status
policy, and distinction between catalog requirements and test evidence are documented in
[`docs/COMPONENTS.md`](docs/COMPONENTS.md).

The `0.1.0` source line is currently an unreleased candidate. `@kern-ui/angular` is not yet
published to npm; install commands below describe the consumer contract that the release artifact
must satisfy.

## Requirements

- Node.js `24.18.x` (the version in `.nvmrc`) or a compatible `24.x`
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

Once published, the preferred Angular CLI flow is:

```bash
ng add @kern-ui/angular --project my-app
ng generate @kern-ui/angular:doctor --project my-app --strict
```

`ng-add` registers the required global stylesheet idempotently; `doctor` provides a read-only CI
check. Workspaces with more than one application must name the target project.

Manual installation remains available:

```bash
npm install @kern-ui/angular @angular/cdk @angular/aria
```

Load the supported component style entry once, normally in the application's global stylesheet:

```css
@import '@kern-ui/angular/styles/kern.css';
```

This import is required for the complete component presentation. It includes tokens, themes,
density, preferences, base rules, utilities, Angular CDK overlay styles, and shared structural
styles for action and form controls. Importing `tokens.css` alone is not a component-ready setup.

Register Kern's runtime contract:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideKrn } from '@kern-ui/angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKrn({
      locale: 'en-US',
      direction: 'ltr',
      theme: 'system',
      density: 'comfortable',
      motion: 'system',
      brandColor: '#d95831',
      persistPreferences: true,
    }),
  ],
};
```

For a flash-free first paint, invoke the CSP-safe `applyKrnPrepaintTheme()` helper in the external
bootstrap module before `bootstrapApplication(...)`. Use the same preference storage key and
defaults passed to `provideKrn`.

Import standalone components directly:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KrnButton, KrnFormField, KrnTextInput } from '@kern-ui/angular/kit';

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

`provideKrn` also supplies locale, direction, motion preference, overlay-host, persistence, and
platform-adapter configuration. Locale defaults to Angular's `LOCALE_ID`; direction defaults to
the document's `dir`. Kern ships typed English defaults for shared component UI copy; applications
can supply partial `translations` overrides, while product copy and one-off labels remain explicit
consumer inputs.

Runtime ownership is explicit: `/cdk` contains infrastructure, `/core` configuration and
foundations, `/kit` general components, `/addon-grid` and `/addon-charts` heavy capabilities, and
`/patterns` product compositions. The package root remains a compatibility aggregator with strict
identity against these subpaths; new code should prefer the narrow owner.

## Consumer testing

The package ships a separate, test-only Angular CDK harness entry point:

```ts
import { KrnButtonHarness, KrnDataGridHarness } from '@kern-ui/angular/testing';
```

Use these harnesses instead of depending on internal component markup. Runtime components remain
available from the root compatibility API and from the supported direct subpaths documented in
the [package README](projects/kern/README.md).

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:browsers
npm run test:a11y
npm run test:responsive
npm run test:visual
npm run verify:api-baseline
npm run verify:consumers
npm run package:dry-run
```

`npm run verify` runs token parity, entrypoint ownership and identity, lint, type checking,
schematic and unit tests, production builds, committed public API baselines, packed direct/root
consumer bundle budgets, testing-entrypoint checks, and the package dry-run. Browser projects
remain a separate release gate; `test:e2e` runs the complete Playwright matrix. See
[`docs/CONSUMER_QUALITY_GATES.md`](docs/CONSUMER_QUALITY_GATES.md) for baseline and bundle update
rules.
Visual baselines are deterministic Lab scenarios selected with query parameters such as:

```text
http://localhost:4201/?component=data-grid&scenario=default&theme=dark&density=compact&direction=rtl
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for runtime boundaries, the accessibility
contract, extension guidance, and known trade-offs. Browser and assistive-technology scope is
defined separately in [`docs/BROWSER_SUPPORT.md`](docs/BROWSER_SUPPORT.md).

## Release

The repository does not publish automatically. Validate `dist/kern`, inspect the dry-run
tarball, then publish from `dist/kern` only as an explicit release action:

```bash
npm run build:kern
npm run package:dry-run
```

## Project policies

- [Contributing](CONTRIBUTING.md)
- [Versioning and compatibility](docs/VERSIONING.md)
- [Browser and platform support](docs/BROWSER_SUPPORT.md)
- [Security policy](SECURITY.md)
- [Support policy](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

Kern is licensed under the [MIT License](LICENSE).
