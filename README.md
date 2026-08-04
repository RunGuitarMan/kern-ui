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
| `projects/docs`     | SSR docs, interactive playground, and deterministic preview host | No                         |
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

Documentation and deterministic component previews run together at `http://localhost:4200`.
`npm start` first establishes the Nx dependency graph, then keeps `kern`, `showcase`, and `docs`
under watch so library edits are reflected without a manual rebuild. Use `npm run serve:docs` only
when the two libraries are already built and a Docs-only server is intentional. The library watcher
rebuilds the ordered `kern → showcase` graph after a source change, avoiding concurrent writes to
package output.
Every component page includes the same shareable playground used by `/preview/:component`: theme
(system/light/dark/high contrast), density (compact/comfortable/spacious), direction, locale,
scoped motion tokens, brand color, canvas width, scenarios, named acceptance states, and typed
component controls. Public input/model controls are identified separately from documentation-only
fixture controls so developers and code agents do not mistake preview composition for package API.

### Nx workflow

Nx owns the project graph and all application/library targets. `docs` may depend on `showcase` and
`kern`, while `showcase` may depend on `kern`; ESLint enforces those tagged module boundaries. Use
the root npm scripts for stable contributor and CI entry points, or Nx directly for focused and
affected work:

```bash
npm run nx:projects
npm run nx:graph
npx nx show project docs
npx nx run docs:build:production
npm run affected:lint
npm run affected:test
npm run affected:build
```

`nx.json` uses `main` as the default comparison branch. Supply `--base` and `--head` to an
affected command when CI does not expose the expected Git refs.

The committed `.env` sets `NG_BUILD_MAX_WORKERS=1`. Nx loads this workspace environment before
running targets, making Angular and Sass worker shutdown deterministic on the supported Node 24
toolchain. This limits compiler workers inside a target; it does not disable Nx task parallelism.
Nx is the only persistent task-cache owner; production projects disable the nested Angular cache
to avoid duplicate and stale compiler state. The isolated Vite smoke target uses an ephemeral
prebundle cache that is removed before and after its run. Keep these settings in local and CI
builds unless a toolchain upgrade is validated with the complete gate.

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

Kern works without a mandatory root provider. Register `provideKrn` when the application needs
shared runtime preferences, translations, a custom overlay host, or explicit SSR-safe defaults:

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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { KrnButton, KrnFormField, KrnTextInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-profile-action',
  imports: [ReactiveFormsModule, KrnButton, KrnFormField, KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field label="Workspace name">
      <krn-text-input [formControl]="workspaceName" />
    </krn-form-field>
    <button krnButton variant="solid" tone="brand">Save changes</button>
  `,
})
export class ProfileAction {
  protected readonly workspaceName = new FormControl('Northstar', { nonNullable: true });
}
```

`KrnFormField` owns label, optional copy, hint/error layout, and description relationships; the
projected control remains the source of truth for `id`, required, disabled, readonly, pending,
valid, and invalid state. Disable reactive controls through their `FormControl` instead of adding
state to the presentation wrapper. Project exactly one control: group controls such as Checkbox
Group, Radio Group, Segmented Control, Verification Code, and Range Slider receive
`aria-labelledby` plus delegated label focus automatically. Native controls also use the mounted
visible field label as their accessible name; Checkbox, Switch, and Slider compose it with their
own visible label instead of hiding either name.

The public theme service can switch `light`, `dark`, `system`, and `high-contrast` modes,
`compact`, `comfortable`, and `spacious` density, and a runtime brand color. CSS custom
properties remain the theming contract, so product-specific semantic overrides do not require
recompiling the library.

`provideKrn` also supplies locale, direction, motion preference, overlay-host, persistence, and
platform-adapter configuration. Locale defaults to Angular's `LOCALE_ID`; direction defaults to
the document's `dir`. Kern ships complete typed English and Russian locale packs for shared
component UI copy. Applications can install a pack through `provideKrn` or supply partial
`translations` overrides, while product copy and one-off labels remain explicit consumer inputs.
Legacy `{token}` string overrides remain supported; optional typed `format…` fields provide
plural-aware formatting without evaluating or recursively expanding translation text.

Runtime ownership is explicit: `/cdk` contains infrastructure, `/i18n` dependency-light UI-copy
tokens, `/core` configuration and foundations, `/kit` general components, `/addon-grid` and
`/addon-charts` heavy capabilities, and `/patterns` product compositions. The package root remains
a compatibility aggregator with strict identity against these subpaths; new code should prefer
the narrow owner.

## Consumer testing

The package ships a separate, test-only Angular CDK harness entry point:

```ts
import {
  KrnButtonGroupHarness,
  KrnButtonHarness,
  KrnDataGridHarness,
  KrnIconButtonHarness,
  KrnToggleButtonHarness,
  KrnToggleGroupHarness,
} from '@kern-ui/angular/testing';
```

Use these harnesses instead of depending on internal component markup. Runtime components remain
available from the root compatibility API and from the supported direct subpaths documented in
the [package README](projects/kern/README.md). New tests can use the narrower
`/testing/actions`, `/testing/data-display`, `/testing/feedback`, `/testing/forms`,
`/testing/layout`, and `/testing/navigation` entrypoints while `/testing` remains compatible.

## Developer and agent discovery

The optional `@kern-ui/mcp` package ships the compiler-derived manifest, per-component
Markdown/JSON, `llms.txt`, import map, 131 standalone examples, and 13 enterprise recipes without
adding them to `@kern-ui/angular`. Every source is installed from its packed tarball and
strict-AOT compiled in an isolated consumer. The repository server uses the same contract:

```bash
node tools/kern-mcp/server.mjs
```

The documentation build also publishes `llms.txt`, `llms-full.txt`, `component-manifest.json`,
and the complete browsable contract under `agent/` at its deployment root, all copied from that
same generated source. Artifact URLs in the manifest are relative to the manifest itself, while
component UI routes are relative to the documentation deployment mount; both root and `/agent/`
discovery therefore remain valid under versioned base paths.

Common enterprise starts can be generated without guessing imports or required state:

```bash
ng generate @kern-ui/angular:typed-form profile --project my-app
ng generate @kern-ui/angular:data-grid accounts --project my-app --mode controlled
ng generate @kern-ui/angular:crud customers --project my-app
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:showcase:specimens
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
Visual baselines use deterministic Docs preview scenarios selected with path and query state:

```text
http://localhost:4200/preview/data-grid?scenario=default&theme=dark&density=compact&direction=rtl&locale=en-US
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for runtime boundaries, the accessibility
contract, extension guidance, and known trade-offs. Browser and assistive-technology scope is
defined separately in [`docs/BROWSER_SUPPORT.md`](docs/BROWSER_SUPPORT.md).
Task-oriented guidance for selection, forms, server Grid data, date/time, trees, overlays, charts,
locales, testing, and performance is collected in [`docs/COOKBOOK.md`](docs/COOKBOOK.md).
Install `@kern-ui/mcp` as a development dependency to expose the immutable agent contract through
the read-only `npx --no-install kern-mcp` executable.

## Release

The repository prepares one immutable release candidate and publishes the exact synchronized
Angular and MCP tarballs through a protected GitHub environment and npm trusted publishing. It
verifies checksums, dependency policy, provenance metadata, and CycloneDX SBOMs. Local validation
remains available:

```bash
npm run build:kern
npm run package:dry-run
```

Maintainers must follow the protected procedure in
[`docs/RELEASING.md`](docs/RELEASING.md); do not rebuild or publish a different artifact under an
approved version.

## Project policies

- [Contributing](CONTRIBUTING.md)
- [Versioning and compatibility](docs/VERSIONING.md)
- [Browser and platform support](docs/BROWSER_SUPPORT.md)
- [Enterprise cookbook](docs/COOKBOOK.md)
- [Security policy](SECURITY.md)
- [Support policy](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

Kern is licensed under the [MIT License](LICENSE).
