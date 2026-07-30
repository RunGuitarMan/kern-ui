# Validation Message

- ID: `validation-message`
- Selector: `krn-validation-message`
- Import: `import { KrnValidationMessage } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnValidationMessage`
- Lifecycle: **stable**
- Category: Forms

Validation Message. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Actionable validation message
 *
 * Explain how to correct an invalid form value.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnValidationMessage } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-validation-message-agent-example',
  standalone: true,
  imports: [KrnValidationMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-validation-message id="email-error">
      Enter a complete business email address.
    </krn-validation-message>
  `,
})
export class KernValidationMessageAgentExample {}

void bootstrapApplication(KernValidationMessageAgentExample);
```

## API

| Name | Kind  | Type     | Required | Default | Description                                          |
| ---- | ----- | -------- | -------- | ------- | ---------------------------------------------------- |
| `id` | input | `string` | no       | `''`    | Stable identifier value used by the custom contract. |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses
- Arrow keys operate grouped controls
- Escape cancels transient UI
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

## Interactive playground

Route: `preview/validation-message`

Scenarios: `default`.
Public API coverage: 1/1
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument  | Control | Default                  | Test value                           | Binding               | Description                               |
| --------- | ------- | ------------------------ | ------------------------------------ | --------------------- | ----------------------------------------- |
| `content` | text    | `"Use 3–48 characters."` | `"Use 3–48 characters. · alternate"` | fixture content       | Changes the projected validation message. |
| `id`      | text    | `""`                     | `"Alternate value"`                  | input `id` (property) | Configures the component id contract.     |

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

## Related

- `form-field`
- `label`
- `hint`
- `text-input`

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
