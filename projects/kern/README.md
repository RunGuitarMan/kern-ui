# @kern-ui/angular

Kern is an accessible, token-driven Angular component library for production product
interfaces. It uses standalone components, signals, typed forms, Angular CDK/Aria, logical CSS
properties, SSR-safe platform access, and a tree-shakeable public API.

## Install

For an Angular CLI application, the schematic registers the global KERN bundle before the
application stylesheet so product-level overrides retain precedence:

```bash
ng add @kern-ui/angular --project my-app
```

In workspaces with more than one application, `--project` is required. CI can verify the setup
without changing files:

```bash
ng generate @kern-ui/angular:doctor --project my-app --strict
```

Use `--fix` instead of `--strict` to add a missing style entry. Manual installation remains
available:

```bash
npm install @kern-ui/angular @angular/cdk @angular/aria
```

```css
@import '@kern-ui/angular/styles/kern.css';
```

Load `kern.css` once from a global stylesheet. It is part of the supported component contract,
not an optional theme: it includes Angular CDK overlay rules and shared structural styles used by
action and form components. The smaller style exports are for tooling and controlled
integrations; importing `tokens.css` alone is not sufficient to render the component library.

```ts
import { provideKrn } from '@kern-ui/angular/core';

export const appConfig = {
  providers: [
    provideKrn({
      locale: 'en-US',
      direction: 'ltr',
      theme: 'system',
      density: 'comfortable',
      motion: 'system',
    }),
  ],
};
```

Use the narrow entrypoint that owns the capability:

| Entrypoint                      | Contents                                                |
| ------------------------------- | ------------------------------------------------------- |
| `@kern-ui/angular/cdk`          | Platform, IDs, content, and overlay infrastructure      |
| `@kern-ui/angular/i18n`         | Lightweight UI-copy bridge tokens for leaf components   |
| `@kern-ui/angular/core`         | Tokens, icons, configuration, theming, and locale packs |
| `@kern-ui/angular/kit`          | Layout, actions, forms, navigation, feedback, display   |
| `@kern-ui/angular/addon-grid`   | Virtualized enterprise data grid                        |
| `@kern-ui/angular/addon-charts` | Accessible chart components                             |
| `@kern-ui/angular/patterns`     | Opinionated product compositions                        |
| `@kern-ui/angular/testing`      | Angular CDK component harnesses                         |

`@kern-ui/angular` remains a supported compatibility aggregator and preserves the same runtime
identities as direct imports. Deep source imports and undeclared family paths such as
`@kern-ui/angular/forms` are unsupported.

## Lifecycle

Component and public-symbol maturity is explicit:

- `stable` APIs follow the documented compatibility contract;
- `beta` APIs are suitable for controlled production evaluation but may be refined before
  promotion;
- `experimental` extension APIs may change or be removed before `1.0`;
- `recipe` exports are adaptable product compositions rather than sealed widgets;
- `deprecated` APIs retain a documented replacement and removal window.

The repository lifecycle registry covers every catalog entry and named package export. Review the
[lifecycle policy](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/LIFECYCLE.md) and
[active deprecations](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/DEPRECATIONS.md)
before adopting beta or extension contracts.

## Runtime configuration

`provideKrn` is the preferred application provider:

| Option                 | Contract                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `locale`               | Canonical BCP 47 locale; defaults to Angular's `LOCALE_ID`              |
| `direction`            | `ltr` or `rtl`; defaults to the document direction                      |
| `theme`                | `light`, `dark`, `system`, or `high-contrast`                           |
| `density`              | `compact`, `comfortable`, or `spacious`                                 |
| `motion`               | `system`, `reduce`, or `full`                                           |
| `brandColor`           | Valid hexadecimal brand color, or `null`                                |
| `persistPreferences`   | Persist theme preferences when storage is available; defaults to `true` |
| `preferenceStorageKey` | Storage key; defaults to `krn.preferences`                              |
| `overlayHost`          | Dynamic CSS selector or resolver for the shared CDK/Kern overlay branch |
| `platform`             | Advanced replacement for the SSR/browser capability adapter             |
| `translations`         | Typed partial override of Kern's English component UI copy              |

`provideKrn` is optional: components have SSR-safe defaults and do not require a root provider.
Locale, direction, and motion document attributes are written only when explicitly configured;
the theme provider manages its own theme and density attributes. Locale-aware formatting uses the
configured locale where a component exposes that behavior. `KRN_TRANSLATIONS` provides a complete
typed English default, and `createKrnTranslations` can build a full immutable dictionary from a
partial override. Existing `{token}` string overrides remain compatible; optional typed
`format…` fields should be used for plural- or grammar-sensitive copy. Token interpolation is
single-pass and never evaluates translation text. Kern ships schema-checked `en-US` and `ru-RU`
locale packs:

```ts
import { krnLocaleConfig, KRN_RU_RU_LOCALE, provideKrn } from '@kern-ui/angular/core';

export const appConfig = {
  providers: [provideKrn(krnLocaleConfig(KRN_RU_RU_LOCALE))],
};
```

Application copy remains outside the locale packs; component label inputs remain available for
one-off overrides.

### Native action defaults and loading copy

`KrnButton`, `KrnIconButton`, and `KrnToggleButton` keep native `button` semantics on their hosts.
Configure only inheritable visual defaults and the optional subtree loading announcement through
their scoped options; instance inputs still take precedence:

```ts
import {
  provideKrnButtonOptions,
  provideKrnIconButtonOptions,
  provideKrnToggleButtonOptions,
  provideKrnToggleGroupOptions,
} from '@kern-ui/angular/kit';

@Component({
  providers: [
    provideKrnButtonOptions({
      size: 'lg',
      variant: 'solid',
      tone: 'brand',
      loadingLabel: 'Saving workspace…',
    }),
    provideKrnIconButtonOptions({
      size: 'md',
      variant: 'ghost',
      tone: 'neutral',
    }),
    provideKrnToggleButtonOptions({
      pressedVariant: 'soft',
      pressedTone: 'brand',
      unpressedVariant: 'ghost',
      unpressedTone: 'neutral',
    }),
    provideKrnToggleGroupOptions({
      orientation: 'horizontal',
      multiple: true,
    }),
  ],
})
export class WorkspaceActions {}
```

Native `type`, `disabled`, form ownership, accessible naming, descriptions, and pressed state stay
on the host. The one reserved ARIA attribute is `aria-disabled`: Button, Icon Button, and Floating
Action Button derive it from `loading` on every browser or server render pass while leaving the
button focusable. Use native `disabled` for ordinary unavailability instead of supplying
`aria-disabled` yourself.

Toggle Button similarly reserves `aria-pressed` for effective standalone or Toggle Group state.
Use `<button krnToggleButton value="bold" [(pressed)]="boldEnabled">Bold</button>` and do not bind a
second, competing `aria-pressed` value.

Use a labelled `<div krnToggleGroup>` when related native Toggle Buttons should share controlled
string values and one toolbar tab stop. Arrow keys follow `orientation`, Home/End jump to the
first/last enabled toggle, RTL is respected, and moving focus never changes selection. Use Radio
Group or Segmented Control instead for an Angular form that requires exactly one value.

For application-wide localization, prefer `provideKrn({translations: ...})`. Kern derives the
lightweight `KRN_LOADING_LABEL`, `KRN_COPY_LABELS`, and `KRN_MORE_ACTIONS_LABEL` bridges from that
shared registry so importing leaf actions does not retain the complete translation dictionary in
a narrow bundle. A low-level nested locale boundary that provides `KRN_TRANSLATIONS` directly must
also install `provideKrnTranslationBridge()` at that boundary; direct leaf-token overrides remain
available from `@kern-ui/angular/i18n`. Component label inputs are the narrowest one-off override.

The overlay host is resolved whenever Angular CDK requests its container, so a host rendered after
bootstrap is supported; a missing host falls back to `document.body`. Use a dedicated host element
without product content. During a modal interaction, Kern uses registered trigger-to-pane
ownership to keep nested panes operable while inerting pre-existing and late programmatic
background overlays plus the rest of the application. A custom CDK primitive that opts into
Kern's overlay classes must call `KrnOverlayCoordinator.registerOverlayOwnership` after attachment;
unregistered branches are isolated by design.

`provideKrnTheme` remains available when an application wants only theme, density, brand, and
preference persistence. `KrnThemeDirective` can scope theme, density, and brand overrides to a
subtree.

To avoid a light-theme flash while Angular bootstraps, call the CSP-safe prepaint helper from the
same external module that starts the application:

```ts
import { applyKrnPrepaintTheme } from '@kern-ui/angular/core';

applyKrnPrepaintTheme();
bootstrapApplication(AppComponent, appConfig);
```

It validates persisted preferences and updates only document attributes and CSS custom
properties. Pass the same `storageKey`, theme, density, and brand defaults used by `provideKrn`
when they differ from the defaults.

## SSR and hydration

Reusable browser capabilities are exposed through `KRN_PLATFORM`, and `KrnIdService` is the
shared deterministic ID primitive. For order-independent data-driven IDs, use stable application
keys rather than array indexes. The workspace documentation application exercises Angular server
rendering and hydration; consumers must still test their own routes, overlay host, locale data,
CSP, and custom platform adapter.

## Component harnesses

Consumer tests can use the versioned Angular CDK harness contract instead of querying KERN's
internal DOM:

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  KrnButtonGroupHarness,
  KrnButtonHarness,
  KrnDataGridHarness,
  KrnDialogHarness,
  KrnFormControlHarness,
  KrnFormFieldHarness,
  KrnIconButtonHarness,
  KrnSelectHarness,
  KrnToggleButtonHarness,
  KrnToggleGroupHarness,
} from '@kern-ui/angular/testing';

const loader = TestbedHarnessEnvironment.loader(fixture);
const reviewActions = await loader.getHarness(
  KrnButtonGroupHarness.with({ accessibleName: 'Review actions', connected: true }),
);
const save = await loader.getHarness(KrnButtonHarness.with({ text: 'Save', disabled: false }));
const more = await loader.getHarness(KrnIconButtonHarness.with({ accessibleName: 'More actions' }));
const bold = await loader.getHarness(KrnToggleButtonHarness.with({ value: 'bold', pressed: true }));
const formatting = await loader.getHarness(
  KrnToggleGroupHarness.with({ accessibleName: 'Formatting', multiple: true }),
);
const groupedButtons = await reviewActions.getButtons();
const activeFormats = await formatting.getValues();
await save.click();
await more.click();
await bold.click();
```

`@kern-ui/angular/testing` is a physical, test-only secondary entry point. Its bundle imports no
Kern runtime entry point and ships in lockstep with the component package. Harness methods and
filters are the supported locator API; internal classes and component DOM structure are not
application-facing contracts.

## Generators and diagnostics

Kern can scaffold the repetitive, contract-sensitive parts of common enterprise features:

```bash
ng generate @kern-ui/angular:typed-form profile --project my-app
ng generate @kern-ui/angular:data-grid accounts --project my-app --mode controlled
ng generate @kern-ui/angular:crud customers --project my-app
```

`doctor --json` emits a versioned machine-readable report; `doctor --strict` is suitable for CI.
`ng update @kern-ui/angular` applies only deterministic migrations. Dynamic provider expressions
and ambiguous deprecated inputs remain explicit manual review items.

## Agent contract

The npm package distributes the same compiler-derived contract used by Kern's documentation and
CI:

- `@kern-ui/angular/agent/component-manifest.json`
- `@kern-ui/angular/agent/root-export-map.json`
- `@kern-ui/angular/agent/llms.txt` and `llms-full.txt`
- `@kern-ui/angular/agent/components/<component>.json`
- `@kern-ui/angular/agent/components/<component>.md`
- `@kern-ui/angular/agent/recipes/<recipe>.ts`

Each catalog component has canonical ownership, typed public API, lifecycle, accessibility and SSR
notes, mistakes, checklist, and a compile-verified example. The root export map is the
compiler-generated source of truth used by `ng update` to narrow compatibility imports. The
13 curated enterprise recipes are complete standalone sources verified through the same packed
strict-AOT consumer gate. The package exposes the read-only MCP server as
`npx --no-install kern-mcp`; it reads the manifest from the installed tarball, parses imports with
the TypeScript AST, and never evaluates consumer code. Angular compiler and TypeScript are optional
tooling peers, so runtime-only consumers do not install them through Kern. The documentation build
exposes the same files as `llms.txt`, `component-manifest.json`, and `agent/`
at its deployment root so web agents do not need repository knowledge to discover the contract.
Manifest artifact fields (`documentation.json`, `documentation.markdown`, example `source`, and
recipe `source`) are URLs relative to `component-manifest.json`; sources in
`examples/index.json` are relative to that index. `documentation.route` is instead an application
route relative to the documentation deployment mount. This distinction keeps the contract
self-contained at both the deployment root and its `/agent/` mirror, including versioned mounts.

Committed declaration baselines guard every runtime and testing entrypoint. The workspace also
installs the packed tarball into isolated root and direct-subpath Button, Form, Select, Grid, and
Charts applications to verify package exports, strict compilation, identity, tree-shaking, and
bundle budgets. See the
[consumer quality gates](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/CONSUMER_QUALITY_GATES.md).

Official releases are produced from a protected Git tag by an approval-gated GitHub environment
and npm trusted publishing. The exact tarball is linked to its source commit and tag by a release
manifest, SHA-256 checksums, npm provenance, and a CycloneDX SBOM. See the
[release policy](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/RELEASING.md).

See the workspace
[README](https://github.com/RunGuitarMan/kern-ui#readme) and
[component inventory](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/COMPONENTS.md) for
usage, lifecycle status, development, and coverage details. Compatibility and support are defined
in
[VERSIONING.md](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/VERSIONING.md) and
[BROWSER_SUPPORT.md](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/BROWSER_SUPPORT.md).
Complex adoption scenarios are covered in the
[enterprise cookbook](https://github.com/RunGuitarMan/kern-ui/blob/main/docs/COOKBOOK.md).

Security issues should follow the private process in the
[security policy](https://github.com/RunGuitarMan/kern-ui/blob/main/SECURITY.md). General help and
maintenance expectations are documented in
[SUPPORT.md](https://github.com/RunGuitarMan/kern-ui/blob/main/SUPPORT.md).
