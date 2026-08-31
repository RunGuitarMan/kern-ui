# Loading Overlay

- ID: `loading-overlay`
- Selector: `krn-loading-overlay`
- Import: `import { KrnLoadingOverlay } from '@kern-ui/angular/feedback';`
- Canonical symbol: `KrnLoadingOverlay`
- Lifecycle: **stable**
- Category: Feedback

Loading Overlay. Marks a region as busy and optionally blocks interaction while work is in progress.

## Use

Use Loading Overlay for this specific contract: Marks a region as busy and optionally blocks interaction while work is in progress.

Avoid: Do not choose Loading Overlay for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled blocking save state
 *
 * Keep existing content perceivable while a blocking operation is active.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLoadingOverlay } from '@kern-ui/angular/feedback';

@Component({
  selector: 'app-kern-loading-overlay-agent-example',
  standalone: true,
  imports: [KrnLoadingOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-loading-overlay [active]="saving" [blocking]="true" label="Saving customer">
      <section>
        <h2>Customer profile</h2>
        <button type="button" (click)="saving = !saving">Toggle save state</button>
      </section>
    </krn-loading-overlay>
  `,
})
export class KernLoadingOverlayAgentExample {
  saving = false;
}

void bootstrapApplication(KernLoadingOverlayAgentExample);
```

## API

| Name       | Kind  | Type                  | Required | Default     | Description                                                |
| ---------- | ----- | --------------------- | -------- | ----------- | ---------------------------------------------------------- |
| `active`   | input | `boolean`             | no       | `false`     | Defines the component's active behavior or presentation.   |
| `blocking` | input | `boolean`             | no       | `true`      | Defines the component's blocking behavior or presentation. |
| `label`    | input | `string \| undefined` | no       | `undefined` | Visible text that names the control or data value.         |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- The owned region exposes busy state while visible.
- Blocking mode prevents interaction without removing the region or its status from perception.

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
- loading

## Interactive playground

Route: `preview/loading-overlay`

Scenarios: `default`.
Public API coverage: 3/3
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default                         | Test value                                  | Binding                     | Description                                                |
| ---------- | ------- | ------------------------------- | ------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| `active`   | boolean | `true`                          | `false`                                     | input `active` (property)   | Shows or hides the blocking loading layer.                 |
| `label`    | text    | `"Importing customer records…"` | `"Importing customer records… · alternate"` | input `label` (property)    | Names the loading operation for assistive technology.      |
| `blocking` | boolean | `true`                          | `false`                                     | input `blocking` (property) | Defines the component's blocking behavior or presentation. |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `loading` — loading; scenario `default`; fixture effect `status/info` — loading: The fixture exposes the loading status without claiming a public component input..
- `inactive-overlay` — Inactive Overlay; scenario `default`; `active=false`.

## Related

- `alert`
- `banner`
- `toast`
- `tooltip`

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
