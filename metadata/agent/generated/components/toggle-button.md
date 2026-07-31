# Toggle Button

- ID: `toggle-button`
- Selector: `button[krnToggleButton]`
- Import: `import { KrnToggleButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnToggleButton`
- Lifecycle: **stable**
- Category: Actions

Toggle Button. Enhances one native button with controlled pressed state, deterministic aria-pressed semantics, and scoped state appearances.

## Use

Use <button krnToggleButton> with a stable value and bind [(pressed)] for standalone controlled state.

Avoid: Do not nest a button, link, or other interactive control inside Toggle Button, and do not bind aria-pressed independently.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled formatting toggle
 *
 * Keep formatting state controlled while native button semantics remain intact.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toggle-button-agent-example',
  standalone: true,
  imports: [KrnToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button krnToggleButton type="button" value="bold" [(pressed)]="boldEnabled">Bold</button>
  `,
})
export class KernToggleButtonAgentExample {
  boldEnabled = false;
}

void bootstrapApplication(KernToggleButtonAgentExample);
```

## API

| Name               | Kind  | Type               | Required | Default                         | Description                                                                                                                                                                                                         |
| ------------------ | ----- | ------------------ | -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | input | `string`           | yes      | `required`                      | Stable native value used by `KrnToggleGroup` as the selection identity. It remains required because group selection is represented by serializable string values rather than child indices or component identities. |
| `size`             | input | `KrnSize`          | no       | `this.options.size`             | Named semantic size resolved through KERN density and sizing tokens.                                                                                                                                                |
| `pressedVariant`   | input | `KrnActionVariant` | no       | `this.options.pressedVariant`   | Visual emphasis rendered while Toggle Button is pressed.                                                                                                                                                            |
| `pressedTone`      | input | `KrnTone`          | no       | `this.options.pressedTone`      | Semantic tone rendered while Toggle Button is pressed.                                                                                                                                                              |
| `unpressedVariant` | input | `KrnActionVariant` | no       | `this.options.unpressedVariant` | Visual emphasis rendered while Toggle Button is not pressed.                                                                                                                                                        |
| `unpressedTone`    | input | `KrnTone`          | no       | `this.options.unpressedTone`    | Semantic tone rendered while Toggle Button is not pressed.                                                                                                                                                          |
| `disabled`         | input | `boolean`          | no       | `false`                         | Prevents user interaction and participates in the disabled-state contract.                                                                                                                                          |
| `pressed`          | model | `boolean`          | no       | `false`                         | Standalone state model. Inside a Toggle Group, the group values are authoritative.                                                                                                                                  |

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
- Activation toggles standalone pressed state or delegates to the owning Toggle Group
- The native button retains form ownership, accessible naming, descriptions, focus, and click behavior.
- aria-pressed is always derived from effective standalone or group state and must not be consumer-authored.
- Native disabled state prevents activation; visible text supplies the accessible name unless native ARIA naming is provided.
- Pressed state is communicated through aria-pressed and appearance, not color alone.

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
- selected
- unselected

## Interactive playground

Route: `preview/toggle-button`

Scenarios: `default`.
Public API coverage: 8/8
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument           | Control | Default     | Test value            | Binding                             | Description                                           |
| ------------------ | ------- | ----------- | --------------------- | ----------------------------------- | ----------------------------------------------------- |
| `disabled`         | boolean | `false`     | `true`                | input `disabled` (property)         | Prevents user interaction.                            |
| `selected`         | boolean | `false`     | `true`                | model `pressed`                     | Selects the action.                                   |
| `pressedTone`      | select  | `"brand"`   | `"neutral"`           | input `pressedTone` (property)      | Semantic tone used while the toggle is pressed.       |
| `pressedVariant`   | select  | `"soft"`    | `"solid"`             | input `pressedVariant` (property)   | Visual emphasis used while the toggle is pressed.     |
| `size`             | select  | `"md"`      | `"sm"`                | input `size` (property)             | Semantic component size.                              |
| `unpressedTone`    | select  | `"neutral"` | `"brand"`             | input `unpressedTone` (property)    | Semantic tone used while the toggle is not pressed.   |
| `unpressedVariant` | select  | `"ghost"`   | `"solid"`             | input `unpressedVariant` (property) | Visual emphasis used while the toggle is not pressed. |
| `value`            | text    | `"watch"`   | `"watch · alternate"` | input `value` (property)            | Controlled component value.                           |

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
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `selected` — Selected; scenario `default`; `selected=true`.
- `unselected` — unselected; scenario `default`; `selected=false`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..

## Related

- `button`
- `icon-button`
- `toggle-group`
- `segmented-control`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use button[krnToggleButton] with a stable value and visible or native ARIA accessible name; do not nest another interactive element inside it.
- Treat aria-pressed as component-owned derived state. Bind [(pressed)] for standalone controlled state and bind [(values)] on KrnToggleGroup for grouped state.
- Use provideKrnToggleButtonOptions for inheritable pressed and unpressed appearance defaults; use native form, name, description, and click attributes on the same button.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
