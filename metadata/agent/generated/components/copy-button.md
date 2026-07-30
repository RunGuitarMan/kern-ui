# Copy Button

- ID: `copy-button`
- Selector: `krn-copy-button`
- Import: `import { KrnCopyButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCopyButton`
- Lifecycle: **stable**
- Category: Actions

Copy Button. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Copy immutable record id
 *
 * Copy a visible domain identifier with explicit accessible feedback.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCopyButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-copy-button-agent-example',
  standalone: true,
  imports: [KrnCopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-copy-button value="CUS-2048" ariaLabel="Copy customer id"> CUS-2048 </krn-copy-button>
  `,
})
export class KernCopyButtonAgentExample {}

void bootstrapApplication(KernCopyButtonAgentExample);
```

## API

| Name          | Kind   | Type      | Required | Default                                     | Description                                                                |
| ------------- | ------ | --------- | -------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `value`       | input  | `string`  | yes      | `required`                                  | Controlled component value.                                                |
| `ariaLabel`   | input  | `string`  | no       | `this.translations.actions.copyToClipboard` | Accessible name used when visible content is not sufficient.               |
| `copiedLabel` | input  | `string`  | no       | `this.translations.actions.copied`          | Human-readable copy for the copied state or control.                       |
| `errorLabel`  | input  | `string`  | no       | `this.translations.actions.copyFailed`      | Human-readable copy for the error state or control.                        |
| `size`        | input  | `KrnSize` | no       | `'md'`                                      | Named semantic size resolved through KERN density and sizing tokens.       |
| `disabled`    | input  | `boolean` | no       | `false`                                     | Prevents user interaction and participates in the disabled-state contract. |
| `copied`      | output | `string`  | no       | `undefined`                                 | Notifies the consumer after the copied interaction completes.              |
| `copyError`   | output | `unknown` | no       | `undefined`                                 | Notifies the consumer after the copy error interaction completes.          |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Enter / Space activates
- Tab follows document order
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.
- Browser capabilities are nullable or become available only after hydration.

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
- hover
- focus-visible
- active
- disabled

## Interactive playground

Route: `preview/copy-button`

Scenarios: `default`.
Public API coverage: 3/6
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default                    | Test value                             | Binding                     | Description                 |
| ---------- | ------- | -------------------------- | -------------------------------------- | --------------------------- | --------------------------- |
| `disabled` | boolean | `false`                    | `true`                                 | input `disabled` (property) | Prevents user interaction.  |
| `size`     | select  | `"md"`                     | `"sm"`                                 | input `size` (property)     | Semantic component size.    |
| `value`    | text    | `"npm i @kern-ui/angular"` | `"npm i @kern-ui/angular · alternate"` | input `value` (property)    | Controlled component value. |

Exact API exclusions:

| Public API    | Category           | Evidence                                                 | Reason                                                                                                                                                              |
| ------------- | ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`   | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                             |
| `copiedLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `errorLabel`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.

## Related

- `button`
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `value`.
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
