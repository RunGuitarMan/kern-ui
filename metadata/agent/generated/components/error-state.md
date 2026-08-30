# Error State

- ID: `error-state`
- Selector: `krn-error-state`
- Import: `import { KrnErrorState } from '@kern-ui/angular/feedback';`
- Canonical symbol: `KrnErrorState`
- Lifecycle: **stable**
- Category: Feedback

Error State. Presents Empty State for a failed outcome. For new work, use Empty State with the error kind.

## Use

Use Error State for this specific contract: Presents Empty State for a failed outcome. For new work, use Empty State with the error kind.

Avoid: Do not choose Error State for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Recoverable report error
 *
 * Describe a failed load and expose a recovery action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnErrorState } from '@kern-ui/angular/feedback';

@Component({
  selector: 'app-kern-error-state-agent-example',
  standalone: true,
  imports: [KrnErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-error-state
      title="Report unavailable"
      description="The latest report could not be loaded."
    >
      <button type="button">Try again</button>
    </krn-error-state>
  `,
})
export class KernErrorStateAgentExample {}

void bootstrapApplication(KernErrorStateAgentExample);
```

## API

| Name          | Kind  | Type                           | Required | Default     | Description                                                                          |
| ------------- | ----- | ------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------ |
| `kind`        | input | `KrnStateKind`                 | no       | `'error'`   | Selects the state meaning, default visual, status role, title, and recommended tone. |
| `title`       | input | `string \| undefined`          | no       | `undefined` | Visible title that also names the component surface or data view.                    |
| `description` | input | `string`                       | no       | `''`        | Visible supporting description for the component content.                            |
| `tone`        | input | `KrnFeedbackTone \| undefined` | no       | `'danger'`  | Semantic intent that selects coordinated text, icon, border, and surface tokens.     |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnStateVisual]` — Projects content matching [krnStateVisual].
- `*` — Projects default component content.
- `[krnStateAction]` — Projects content matching [krnStateAction].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Keeps the failure message visible and associates recovery actions with clear labels.

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
- recoverable
- terminal
- with retry

## Interactive playground

Route: `preview/error-state`

Scenarios: `default`.
Public API coverage: 3/4
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                                                 | Test value                                                          | Binding                        | Description                                                       |
| ------------- | ------- | ------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `tone`        | select  | `"danger"`                                              | `"neutral"`                                                         | input `tone` (property)        | Changes the state illustration tone.                              |
| `description` | text    | `"The service did not respond. Your changes are safe."` | `"The service did not respond. Your changes are safe. · alternate"` | input `description` (property) | Visible supporting description for the component content.         |
| `title`       | text    | `"Could not load workspaces"`                           | `"Could not load workspaces · alternate"`                           | input `title` (property)       | Visible title that also names the component surface or data view. |

Exact API exclusions:

| Public API | Category     | Evidence                                             | Reason                                                                                           |
| ---------- | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `kind`     | complex-data | `specimen-fixture:preview/error-state?state=default` | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `recoverable` — recoverable; scenario `default`; fixture effect `status/neutral` — recoverable: The fixture exposes the recoverable status without claiming a public component input..
- `terminal` — terminal; scenario `default`; fixture effect `status/danger` — terminal: The fixture exposes the terminal status without claiming a public component input..
- `with-retry` — with retry; scenario `default`; fixture effect `content/with-action` — with retry: The projected content composition is changed for this acceptance state..

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
