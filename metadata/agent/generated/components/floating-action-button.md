# Floating Action Button

- ID: `floating-action-button`
- Selector: `button[krnFab]`
- Import: `import { KrnFloatingActionButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnFloatingActionButton`
- Lifecycle: **stable**
- Category: Actions

Floating Action Button. Exposes one high-priority contextual action on a native button with extended or compact geometry.

## Use

Reserve <button krnFab> for one high-priority contextual action and keep its visible label meaningful.

Avoid: Do not use Floating Action Button for navigation, multiple equal-priority actions, or consumer-owned aria-disabled state.

## Compile-verified standalone Angular example

```ts
/**
 * Create-record floating action
 *
 * Expose a single high-priority creation action on compact layouts.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFloatingActionButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-floating-action-button-agent-example',
  standalone: true,
  imports: [KrnFloatingActionButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button krnFab type="button">
      <span krnFabIcon>+</span>
      Create customer
    </button>
  `,
})
export class KernFloatingActionButtonAgentExample {}

void bootstrapApplication(KernFloatingActionButtonAgentExample);
```

## API

| Name           | Kind  | Type               | Required | Default                    | Description                                                                                                                        |
| -------------- | ----- | ------------------ | -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `size`         | input | `KrnSize`          | no       | `this.options.size`        | Named semantic size resolved through KERN density and sizing tokens.                                                               |
| `variant`      | input | `KrnActionVariant` | no       | `this.options.variant`     | Named visual hierarchy treatment that preserves the component semantics.                                                           |
| `tone`         | input | `KrnTone`          | no       | `this.options.tone`        | Semantic intent that selects coordinated text, icon, border, and surface tokens.                                                   |
| `extended`     | input | `boolean`          | no       | `this.options.extended`    | Displays the floating action label in addition to its icon.                                                                        |
| `loading`      | input | `boolean`          | no       | `false`                    | Suppresses duplicate activation and owns `aria-disabled` while retaining focus. Use native `disabled` for ordinary unavailability. |
| `loadingLabel` | input | `string`           | no       | `this.defaultLoadingLabel` | Accessible loading copy; defaults to the application or closest scoped option.                                                     |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnFabIcon]` — Projects content matching [krnFabIcon].
- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses the native floating action
- Enter and Space dispatch the native click behavior
- A loading floating action retains focus but suppresses click and form submission
- The projected label remains the accessible name in both extended and visually compact modes.
- Native type, disabled, form, accessible naming, and description relationships stay on the host button.
- Loading owns aria-disabled and a persistent polite status; use native disabled for ordinary unavailability.

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

Route: `preview/floating-action-button`

Scenarios: `default`.
Public API coverage: 5/6
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default   | Test value  | Binding                     | Description                                                          |
| ---------- | ------- | --------- | ----------- | --------------------------- | -------------------------------------------------------------------- |
| `variant`  | select  | `"solid"` | `"soft"`    | input `variant` (property)  | Changes action emphasis without changing its semantics.              |
| `tone`     | select  | `"brand"` | `"neutral"` | input `tone` (property)     | Communicates neutral, branded, informational, or destructive intent. |
| `size`     | select  | `"lg"`    | `"sm"`      | input `size` (property)     | Changes the action target and label size.                            |
| `extended` | boolean | `true`    | `false`     | input `extended` (property) | Shows or hides the text label.                                       |
| `loading`  | boolean | `false`   | `true`      | input `loading` (property)  | Shows progress and disables activation.                              |
| `disabled` | boolean | `false`   | `true`      | fixture interaction         | Binds the native disabled attribute and prevents user interaction.   |

Exact API exclusions:

| Public API     | Category           | Evidence                                                            | Reason                                                                                                                                                               |
| -------------- | ------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadingLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#floating-action-button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use button[krnFab] with a persistent visible label; compact mode hides that label visually but keeps it as the native accessible name.
- Keep type, disabled, name, value, form, ARIA relationships, and click on the native host instead of recreating component proxy inputs or outputs.
- Use provideKrnFloatingActionButtonOptions for inheritable visual, extended, and loading-copy defaults; reserve a floating action for one high-priority contextual action.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
