# Confirmation Pattern

- ID: `confirmation-pattern`
- Selector: `krn-confirmation-pattern`
- Import: `import { KrnConfirmationPattern } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnConfirmation`
- Lifecycle: **stable**
- Category: Feedback

Confirmation Pattern. A perceivable feedback primitive with focus, announcement, and reduced-motion behavior.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Inline archive confirmation
 *
 * Use a reversible inline confirmation for a local record action.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnConfirmationPattern } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-confirmation-pattern-agent-example',
  standalone: true,
  imports: [KrnConfirmationPattern],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-confirmation-pattern
      requestLabel="Archive customer"
      prompt="Archive Acme Europe?"
      confirmLabel="Archive"
      [(confirming)]="confirming"
    />
  `,
})
export class KernConfirmationPatternAgentExample {
  confirming = false;
}

void bootstrapApplication(KernConfirmationPatternAgentExample);
```

## API

| Name           | Kind   | Type      | Required | Default                                    | Description                                                              |
| -------------- | ------ | --------- | -------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `confirming`   | model  | `boolean` | no       | `false`                                    | Controlled confirming state with a matching Angular model-change output. |
| `requestLabel` | input  | `string`  | no       | `this.translations.feedback.delete`        | Human-readable copy for the request state or control.                    |
| `prompt`       | input  | `string`  | no       | `this.translations.feedback.confirmPrompt` | Human-readable copy for the prompt state or control.                     |
| `confirmLabel` | input  | `string`  | no       | `this.translations.feedback.confirm`       | Human-readable copy for the confirm state or control.                    |
| `cancelLabel`  | input  | `string`  | no       | `this.translations.feedback.cancel`        | Human-readable copy for the cancel state or control.                     |
| `confirmed`    | output | `void`    | no       | `undefined`                                | Notifies the consumer after the confirmed interaction completes.         |
| `cancelled`    | output | `void`    | no       | `undefined`                                | Notifies the consumer after the cancelled interaction completes.         |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

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

## Interactive playground

Route: `preview/confirmation-pattern`

Scenarios: `default`.
Public API coverage: 2/5
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument     | Control | Default                                          | Test value                                                   | Binding                   | Description                               |
| ------------ | ------- | ------------------------------------------------ | ------------------------------------------------------------ | ------------------------- | ----------------------------------------- |
| `confirming` | boolean | `false`                                          | `true`                                                       | model `confirming`        | Opens the confirmation surface.           |
| `prompt`     | text    | `"Archive Northstar and pause all automations?"` | `"Archive Northstar and pause all automations? · alternate"` | input `prompt` (property) | Configures the component prompt contract. |

Exact API exclusions:

| Public API     | Category           | Evidence                                                          | Reason                                                                                                                                                               |
| -------------- | ------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cancelLabel`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#confirmation-pattern` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `confirmLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#confirmation-pattern` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `requestLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#confirmation-pattern` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
