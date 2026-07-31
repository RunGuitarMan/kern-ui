# Icon Button

- ID: `icon-button`
- Selector: `button[krnIconButton]`
- Import: `import { KrnIconButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnIconButton`
- Lifecycle: **stable**
- Category: Actions

Icon Button. Enhances a native button with a compact square action target, visual defaults, and a focus-preserving loading state.

## Use

Use <button krnIconButton type="button"> with a native accessible name and native events or form attributes.

Avoid: Do not add role="button", proxy native attributes through component inputs, or use Icon Button for managed toggle state; use Toggle Button.

## Compile-verified standalone Angular example

```ts
/**
 * Accessible icon-only action
 *
 * Keep the accessible name and native action semantics on the icon-only button host.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnIconButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-icon-button-agent-example',
  standalone: true,
  imports: [KrnIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <button krnIconButton type="button" aria-label="Add team member">+</button> `,
})
export class KernIconButtonAgentExample {}

void bootstrapApplication(KernIconButtonAgentExample);
```

## API

| Name           | Kind  | Type               | Required | Default                    | Description                                                                                                                        |
| -------------- | ----- | ------------------ | -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `size`         | input | `KrnSize`          | no       | `this.options.size`        | Named semantic size resolved through KERN density and sizing tokens.                                                               |
| `variant`      | input | `KrnActionVariant` | no       | `this.options.variant`     | Named visual hierarchy treatment that preserves the component semantics.                                                           |
| `tone`         | input | `KrnTone`          | no       | `this.options.tone`        | Semantic intent that selects coordinated text, icon, border, and surface tokens.                                                   |
| `loading`      | input | `boolean`          | no       | `false`                    | Suppresses duplicate activation and owns `aria-disabled` while retaining focus. Use native `disabled` for ordinary unavailability. |
| `loadingLabel` | input | `string`           | no       | `this.defaultLoadingLabel` | Accessible loading copy; defaults to the application or closest scoped option.                                                     |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses the native button
- Enter and Space dispatch the native click behavior
- A loading icon button retains focus but suppresses click and form submission
- Every icon-only action has a native aria-label or aria-labelledby on the host button.
- Native type, disabled, name, value, form, and aria-describedby relationships stay on the host button.
- Loading uses a persistent polite status and aria-disabled without removing the action from focus order.
- aria-disabled is reserved for the derived loading state; use native disabled for ordinary unavailability.

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
- hover
- focus-visible
- active
- disabled
- loading

## Interactive playground

Route: `preview/icon-button`

Scenarios: `default`.
Public API coverage: 4/5
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default     | Test value | Binding                    | Description                                                        |
| ---------- | ------- | ----------- | ---------- | -------------------------- | ------------------------------------------------------------------ |
| `variant`  | select  | `"ghost"`   | `"solid"`  | input `variant` (property) | Changes icon-action emphasis.                                      |
| `tone`     | select  | `"neutral"` | `"brand"`  | input `tone` (property)    | Changes the semantic action tone.                                  |
| `size`     | select  | `"md"`      | `"sm"`     | input `size` (property)    | Changes the action target and label size.                          |
| `loading`  | boolean | `false`     | `true`     | input `loading` (property) | Shows progress and disables activation.                            |
| `disabled` | boolean | `false`     | `true`     | fixture interaction        | Binds the native disabled attribute and prevents user interaction. |

Exact API exclusions:

| Public API     | Category           | Evidence                                                 | Reason                                                                                                                                                               |
| -------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadingLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#icon-button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `loading` — Loading; scenario `default`; `loading=true`.

## Related

- `button`
- `toggle-button`
- `button-group`
- `floating-action-button`
- `split-button`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use button[krnIconButton] with a native aria-label or aria-labelledby; keep type, disabled, name, value, form, aria-describedby relationships, and click on the native host.
- Use provideKrnIconButtonOptions for inheritable visual and loading-copy defaults, and prefer Toggle Button when the component must own managed pressed state.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
