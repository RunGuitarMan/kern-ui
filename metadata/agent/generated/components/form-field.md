# Form Field

- ID: `form-field`
- Selector: `krn-form-field`
- Import: `import { KrnFormField } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnFormField`
- Lifecycle: **stable**
- Category: Forms

Form Field. Coordinates one projected control with its visible label, optional copy, hints, errors, and Angular state without owning the control value.

## Use

Keep identity and state on the projected control, and disable reactive controls through their FormControl.

Avoid: Do not project multiple controls or proxy id, required, disabled, readonly, or state through Form Field.

## Compile-verified standalone Angular example

```ts
/**
 * Labeled reactive form field
 *
 * Compose visible label, control and hint around one typed FormControl.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFormField, KrnHint, KrnLabel, KrnTextInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-form-field-agent-example',
  standalone: true,
  imports: [KrnFormField, ReactiveFormsModule, KrnHint, KrnLabel, KrnTextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-form-field>
      <krn-label for="account-name">Account name</krn-label>
      <krn-text-input id="account-name" [formControl]="control" />
      <krn-hint>Use the legal customer name.</krn-hint>
    </krn-form-field>
  `,
})
export class KernFormFieldAgentExample {
  readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });
}

void bootstrapApplication(KernFormFieldAgentExample);
```

## API

| Name           | Kind  | Type     | Required | Default | Description                                                             |
| -------------- | ----- | -------- | -------- | ------- | ----------------------------------------------------------------------- |
| `label`        | input | `string` | no       | `''`    | Visible text that names the control or data value.                      |
| `hint`         | input | `string` | no       | `''`    | Supporting guidance displayed with a form control or product action.    |
| `error`        | input | `string` | no       | `''`    | Current failure message or error state exposed by asynchronous content. |
| `optionalText` | input | `string` | no       | `''`    | Human-readable copy for the optional state or control.                  |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `krn-label` — Projects content matching krn-label.
- `*` — Projects default component content.
- `krn-hint, krn-validation-message` — Projects content matching krn-hint, krn-validation-message.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The projected control owns focus and keyboard behavior
- Clicking the associated visible label moves focus to the projected control
- Form Field itself does not add a tab stop or intercept control events
- Exactly one registered control supplies the field identity and required, disabled, readonly, pending, valid, and invalid state.
- A projected KrnLabel replaces the shorthand label so the field never renders two competing visible labels.
- aria-describedby references only hints and errors that are currently mounted in the DOM.
- Inline errors use a polite live region; the projected control remains the source of truth for Angular Forms state.

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

Route: `preview/form-field`

Scenarios: `default`, `stress`.
Public API coverage: 4/4
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default                        | Test value                                 | Binding                         | Description                                                                            |
| -------------- | ------- | ------------------------------ | ------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------- |
| `state`        | select  | `"default"`                    | `"valid"`                                  | fixture interaction             | Drives a real projected FormControl through default, valid, pending, or invalid state. |
| `label`        | text    | `""`                           | `"Alternate value"`                        | input `label` (property)        | Changes the visible field label.                                                       |
| `disabled`     | boolean | `false`                        | `true`                                     | fixture interaction             | Disables the projected FormControl.                                                    |
| `readonly`     | boolean | `false`                        | `true`                                     | fixture interaction             | Keeps the projected control focusable while preventing edits.                          |
| `required`     | boolean | `true`                         | `false`                                    | fixture interaction             | Marks the projected control as required.                                               |
| `error`        | text    | `""`                           | `"Alternate value"`                        | input `error` (property)        | Configures the component error contract.                                               |
| `hint`         | text    | `"Required enterprise value."` | `"Required enterprise value. · alternate"` | input `hint` (property)         | Configures the component hint contract.                                                |
| `optionalText` | text    | `""`                           | `"Alternate value"`                        | input `optionalText` (property) | Configures the component optionalText contract.                                        |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `stress`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `stress`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `optional` — Optional; scenario `default`; `required=false`.
- `stress` — Stress data; scenario `stress`.

## Related

- `label`
- `hint`
- `validation-message`
- `text-input`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Keep id, required, disabled, readonly, and Angular Forms bindings on the projected control. Form Field derives presentation and relationships from that control instead of proxying its state.
- Disable a reactive control through FormControl.disable(); do not create a DOM-disabled control whose Angular model remains enabled.
- Use either the label input or one projected KrnLabel. A projected label is the canonical rich-content option and replaces the shorthand label instead of creating a second label.
- Register exactly one control per Form Field. For Checkbox Group, Radio Group, Segmented Control, Verification Code, or Range Slider, project the group component itself; Form Field names its composite root with aria-labelledby and delegates label clicks to its first enabled member.
- Angular validation becomes visually invalid only after the control is touched or dirty. Use mounted error content when a server or cross-field error must be announced before local interaction.
- Use the error input for one inline message or project KrnValidationMessage for controlled validation content. Form Field only references description ids that are mounted in the DOM.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
