# Button

- ID: `button`
- Selector: `button[krnButton]`
- Import: `import { KrnButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnButton`
- Lifecycle: **stable**
- Category: Actions

Button. Enhances a native button with Kern hierarchy, visual defaults, and a focus-preserving loading state.

## Use

Use <button krnButton> and keep native form and event semantics explicit at the call site.

Avoid: Do not add role="button", proxy click through a custom output, or use Button as a pressed-state toggle.

## Compile-verified standalone Angular example

```ts
/**
 * Primary save action
 *
 * Render an explicit form action with scoped visual and loading-copy defaults.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton, provideKrnButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-button-agent-example',
  standalone: true,
  imports: [KrnButton],
  providers: [
    provideKrnButtonOptions({
      size: 'lg',
      loadingLabel: 'Saving workspace…',
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="saving = true; $event.preventDefault()">
      <button krnButton type="submit" [loading]="saving">Save changes</button>
    </form>
  `,
})
export class KernButtonAgentExample {
  saving = false;
}

void bootstrapApplication(KernButtonAgentExample);
```

## API

| Name           | Kind  | Type               | Required | Default                    | Description                                                                                                                                         |
| -------------- | ----- | ------------------ | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`         | input | `KrnSize`          | no       | `this.options.size`        | Named semantic size resolved through KERN density and sizing tokens.                                                                                |
| `variant`      | input | `KrnActionVariant` | no       | `this.options.variant`     | Named visual hierarchy treatment that preserves the component semantics.                                                                            |
| `tone`         | input | `KrnTone`          | no       | `this.options.tone`        | Semantic intent that selects coordinated text, icon, border, and surface tokens.                                                                    |
| `loading`      | input | `boolean`          | no       | `false`                    | Suppresses duplicate activation, owns `aria-disabled`, and updates the persistent polite status. Use native `disabled` for ordinary unavailability. |
| `loadingLabel` | input | `string`           | no       | `this.defaultLoadingLabel` | Accessible loading copy; defaults to the application or closest scoped option.                                                                      |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnLeadingIcon]` — Projects content matching [krnLeadingIcon].
- `*` — Projects default component content.
- `[krnTrailingIcon]` — Projects content matching [krnTrailingIcon].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses the native button
- Enter and Space dispatch the native click behavior
- A loading button retains focus but suppresses click and form submission
- Native type, disabled, name, value, form, accessible naming, descriptions, and pressed state stay on the host button.
- Loading uses a persistent polite status and aria-disabled without removing the action from focus order.
- aria-disabled is reserved for the derived loading state; use native disabled for ordinary unavailability.
- Visible text supplies the accessible name unless the consumer provides a native aria-label.

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

Route: `preview/button`

Scenarios: `default`.
Public API coverage: 4/5
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument  | Control | Default   | Test value  | Binding                    | Description                                                          |
| --------- | ------- | --------- | ----------- | -------------------------- | -------------------------------------------------------------------- |
| `variant` | select  | `"solid"` | `"soft"`    | input `variant` (property) | Changes action emphasis without changing its semantics.              |
| `tone`    | select  | `"brand"` | `"neutral"` | input `tone` (property)    | Communicates neutral, branded, informational, or destructive intent. |
| `size`    | select  | `"md"`    | `"sm"`      | input `size` (property)    | Changes the action target and label size.                            |
| `loading` | boolean | `false`   | `true`      | input `loading` (property) | Shows progress and disables activation.                              |

Exact API exclusions:

| Public API     | Category           | Evidence                                            | Reason                                                                                                                                                               |
| -------------- | ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadingLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `loading` — Loading; scenario `default`; `loading=true`.

## Related

- `icon-button`
- `button-group`
- `split-button`
- `floating-action-button`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Configure inheritable visual defaults with provideKrnButtonOptions; keep type, disabled, name, value, form, and ARIA attributes on the native host.
- Use provideKrn translations for application-wide loading copy, a scoped loadingLabel option for a subtree, and the input only for a one-off override.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
