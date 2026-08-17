# Empty State

- ID: `empty-state`
- Selector: `krn-empty-state`
- Import: `import { KrnEmptyState } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnEmptyState`
- Lifecycle: **stable**
- Category: Feedback

Empty State. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Empty customer portfolio
 *
 * Explain the absence of records and provide a next action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnEmptyState } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-empty-state-agent-example',
  standalone: true,
  imports: [KrnEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-empty-state
      title="No customers yet"
      description="Create the first customer to start tracking renewals."
    >
      <button type="button">Create customer</button>
    </krn-empty-state>
  `,
})
export class KernEmptyStateAgentExample {}

void bootstrapApplication(KernEmptyStateAgentExample);
```

## API

| Name          | Kind  | Type                  | Required | Default     | Description                                                                      |
| ------------- | ----- | --------------------- | -------- | ----------- | -------------------------------------------------------------------------------- |
| `title`       | input | `string \| undefined` | no       | `undefined` | Visible title that also names the component surface or data view.                |
| `description` | input | `string`              | no       | `''`        | Visible supporting description for the component content.                        |
| `tone`        | input | `KrnFeedbackTone`     | no       | `'neutral'` | Semantic intent that selects coordinated text, icon, border, and surface tokens. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnStateVisual]` — Projects content matching [krnStateVisual].
- `*` — Projects default component content.
- `[krnStateAction]` — Projects content matching [krnStateAction].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Escape closes modal layers
- Focus returns to the trigger
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

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
- with action
- without action

## Interactive playground

Route: `preview/empty-state`

Scenarios: `default`.
Public API coverage: 3/3
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                                                             | Test value                                                                      | Binding                        | Description                                    |
| ------------- | ------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `tone`        | select  | `"neutral"`                                                         | `"info"`                                                                        | input `tone` (property)        | Changes the state illustration tone.           |
| `description` | text    | `"Create an automation to connect events with repeatable actions."` | `"Create an automation to connect events with repeatable actions. · alternate"` | input `description` (property) | Configures the component description contract. |
| `title`       | text    | `"No automations yet"`                                              | `"No automations yet · alternate"`                                              | input `title` (property)       | Configures the component title contract.       |

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
- `with-action` — with action; scenario `default`; fixture effect `content/with-action` — with action: The projected content composition is changed for this acceptance state..
- `without-action` — without action; scenario `default`; fixture effect `content/without-action` — without action: The projected content composition is changed for this acceptance state..

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
