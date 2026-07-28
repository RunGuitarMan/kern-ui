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

| Entrypoint                       | Contents                                              |
| -------------------------------- | ----------------------------------------------------- |
| `@kern-ui/angular/cdk`           | Platform, IDs, content, and overlay infrastructure    |
| `@kern-ui/angular/core`          | Tokens, icons, configuration, theming, and i18n       |
| `@kern-ui/angular/kit`           | Layout, actions, forms, navigation, feedback, display |
| `@kern-ui/angular/addon-grid`    | Virtualized enterprise data grid                      |
| `@kern-ui/angular/addon-charts`  | Accessible chart components                           |
| `@kern-ui/angular/patterns`      | Opinionated product compositions                      |
| `@kern-ui/angular/testing`       | Angular CDK component harnesses                       |

`@kern-ui/angular` remains a supported compatibility aggregator and preserves the same runtime
identities as direct imports. Deep source imports and undeclared family paths such as
`@kern-ui/angular/forms` are unsupported.

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

Locale, direction, and motion document attributes are written only when explicitly configured;
the theme provider manages its own theme and density attributes. Locale-aware formatting uses the
configured locale where a component exposes that behavior. `KRN_TRANSLATIONS` provides a complete
typed English default, and `createKrnTranslations` can build a full immutable dictionary from a
partial override. Kern does not ship additional language packs or application copy; component
label inputs remain available for one-off overrides.

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
  KrnButtonHarness,
  KrnDataGridHarness,
  KrnDialogHarness,
  KrnFormControlHarness,
  KrnFormFieldHarness,
  KrnSelectHarness,
} from '@kern-ui/angular/testing';

const loader = TestbedHarnessEnvironment.loader(fixture);
const save = await loader.getHarness(KrnButtonHarness.with({ text: 'Save', disabled: false }));
await save.click();
```

`@kern-ui/angular/testing` is a physical, test-only secondary entry point. Its bundle imports no
Kern runtime entry point and ships in lockstep with the component package. Harness methods and
filters are the supported locator API; internal classes and component DOM structure are not
application-facing contracts.

Committed declaration baselines guard every runtime and testing entrypoint. The workspace also
installs the packed tarball into isolated root and direct-subpath Button, Form, Select, Grid, and
Charts applications to verify package exports, strict compilation, identity, tree-shaking, and
bundle budgets. See
[consumer quality gates](../../docs/CONSUMER_QUALITY_GATES.md).

See the workspace [README](../../README.md) and
[component inventory](../../docs/COMPONENTS.md) for usage, lifecycle status, development, and
coverage details. Compatibility and support are defined in
[VERSIONING.md](../../docs/VERSIONING.md) and
[BROWSER_SUPPORT.md](../../docs/BROWSER_SUPPORT.md).
