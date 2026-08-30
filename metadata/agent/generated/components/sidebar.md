# Sidebar

- ID: `sidebar`
- Selector: `krn-sidebar`
- Import: `import { KrnSidebar } from '@kern-ui/angular/layout';`
- Canonical symbol: `KrnSidebar`
- Lifecycle: **stable**
- Category: Layout

Sidebar. Provides a collapsible complementary panel that can shrink to icons or hide completely.

## Use

Use Sidebar for this specific contract: Provides a collapsible complementary panel that can shrink to icons or hide completely.

Avoid: Do not choose Sidebar for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Collapsible workspace sidebar
 *
 * Keep sidebar collapse state application-owned.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSidebar } from '@kern-ui/angular/layout';

@Component({
  selector: 'app-kern-sidebar-agent-example',
  standalone: true,
  imports: [KrnSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-sidebar [(collapsed)]="collapsed" ariaLabel="Workspace navigation">
      <strong krnSidebarHeader>Workspace</strong>
      <nav aria-label="Sections">Overview · Members · Audit log</nav>
      <small krnSidebarFooter>Acme Europe</small>
    </krn-sidebar>
  `,
})
export class KernSidebarAgentExample {
  collapsed = false;
}

void bootstrapApplication(KernSidebarAgentExample);
```

## API

| Name              | Kind  | Type                         | Required | Default                                   | Description                                                                  |
| ----------------- | ----- | ---------------------------- | -------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `collapsed`       | model | `boolean`                    | no       | `false`                                   | Controlled collapsed state with a matching Angular model-change output.      |
| `collapsedMode`   | input | `"hidden" \| "icons"`        | no       | `'icons'`                                 | Controls whether the component applies the collapsed mode behavior.          |
| `width`           | input | `KrnLayoutSpace`             | no       | `'var(--krn-shell-sidebar-width, 17rem)'` | Explicit inline size of the rendered surface.                                |
| `collapsedWidth`  | input | `KrnLayoutSpace`             | no       | `'4rem'`                                  | Controls whether the component applies the collapsed width behavior.         |
| `ariaLabel`       | input | `string \| undefined`        | no       | `undefined`                               | Accessible name used when visible content is not sufficient.                 |
| `ariaLabelledBy`  | input | `string`                     | no       | `''`                                      | Space-separated element ids that name the native complementary landmark.     |
| `ariaDescribedBy` | input | `string`                     | no       | `''`                                      | Space-separated element ids that describe the native complementary landmark. |
| `side`            | input | `"auto" \| "end" \| "start"` | no       | `'auto'`                                  | Defines the component's side behavior or presentation.                       |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnSidebarHeader],header` — Projects content matching [krnSidebarHeader],header.
- `*` — Projects default component content.
- `[krnSidebarFooter],footer` — Projects content matching [krnSidebarFooter],footer.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Renders a complementary landmark with a stable accessible name and description relationship.
- Hidden collapse mode removes unavailable content from interaction as well as presentation.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.

Hydration evidence scope: `library-docs-route-smoke`; status:
`consumer-validation-required`.

## Acceptance states

- default
- overflow
- long text
- dark
- high contrast
- compact
- RTL
- mobile

## Interactive playground

Route: `preview/sidebar`

Scenarios: `default`.
Public API coverage: 5/8
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument         | Control | Default   | Test value | Binding                           | Description                                                          |
| ---------------- | ------- | --------- | ---------- | --------------------------------- | -------------------------------------------------------------------- |
| `collapsed`      | boolean | `false`   | `true`     | model `collapsed`                 | Collapses the sidebar to its configured compact mode.                |
| `width`          | text    | `"15rem"` | `"20rem"`  | input `width` (property)          | Sets the expanded sidebar width.                                     |
| `collapsedMode`  | select  | `"icons"` | `"hidden"` | input `collapsedMode` (property)  | Controls whether the component applies the collapsed mode behavior.  |
| `collapsedWidth` | text    | `"4rem"`  | `"20rem"`  | input `collapsedWidth` (property) | Controls whether the component applies the collapsed width behavior. |
| `side`           | select  | `"auto"`  | `"end"`    | input `side` (property)           | Defines the component's side behavior or presentation.               |

Exact API exclusions:

| Public API        | Category           | Evidence                                             | Reason                                                                                                                  |
| ----------------- | ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#sidebar` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#sidebar` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#sidebar` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.

## Related

- `app-shell`
- `header`
- `navigation-rail`
- `container`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
