# Tags Input

- ID: `tags-input`
- Selector: `krn-tags-input`
- Import: `import { KrnTagsInput } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTagsInput`
- Lifecycle: **stable**
- Category: Forms

Tags Input. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed account tags
 *
 * Bind an immutable tag array and provide an explicit creation label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTagsInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-tags-input-agent-example',
  standalone: true,
  imports: [KrnTagsInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-tags-input label="Account tags" placeholder="Add a tag" [formControl]="control" />
  `,
})
export class KernTagsInputAgentExample {
  readonly control = new FormControl<readonly string[]>(['enterprise', 'renewal-q3'], {
    nonNullable: true,
  });
}

void bootstrapApplication(KernTagsInputAgentExample);
```

## API

| Name              | Kind   | Type                                 | Required | Default                                     | Description                                                                                      |
| ----------------- | ------ | ------------------------------------ | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`                             | no       | `''`                                        | Stable identifier value used by the id contract.                                                 |
| `ariaLabel`       | input  | `string`                             | no       | `this.translations.forms.tags`              | Accessible name used when visible content is not sufficient.                                     |
| `inputLabel`      | input  | `string`                             | no       | `this.translations.forms.addTag`            | Human-readable copy for the input state or control.                                              |
| `placeholder`     | input  | `string`                             | no       | `this.translations.forms.addTagPlaceholder` | Short input hint shown only while no value is present.                                           |
| `ariaLabelledBy`  | input  | `string`                             | no       | `''`                                        | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`                             | no       | `''`                                        | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `autocomplete`    | input  | `string`                             | no       | `'off'`                                     | Native autocomplete purpose forwarded to the editable control.                                   |
| `tabindex`        | input  | `number`                             | no       | `0`                                         | Native sequential-focus order forwarded to the owned interactive element.                        |
| `separatorKeys`   | input  | `ReadonlyArray<string>`              | no       | `['Enter', ',']`                            | Stable identifier value used by the separator contract.                                          |
| `separator`       | input  | `RegExp \| string`                   | no       | `/[,\n]+/`                                  | Delimiter or pattern used to split committed draft text into tags.                               |
| `maxTags`         | input  | `number`                             | no       | `Number.POSITIVE_INFINITY`                  | Upper or lower bound applied to the tags value.                                                  |
| `allowDuplicates` | input  | `boolean`                            | no       | `false`                                     | Controls whether the component applies the allow duplicates behavior.                            |
| `addOnBlur`       | input  | `boolean`                            | no       | `true`                                      | Commits a valid draft tag when the text input loses focus.                                       |
| `disabled`        | input  | `boolean`                            | no       | `false`                                     | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`                            | no       | `false`                                     | Keeps the value perceivable while preventing user edits.                                         |
| `required`        | input  | `boolean`                            | no       | `false`                                     | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`         | input  | `boolean`                            | no       | `false`                                     | Exposes an externally controlled invalid presentation state.                                     |
| `value`           | input  | `ReadonlyArray<string> \| undefined` | no       | `undefined`                                 | Controlled component value.                                                                      |
| `valueChange`     | output | `ReadonlyArray<string>`              | no       | `undefined`                                 | Notifies the consumer after the value change interaction completes.                              |
| `tagAdded`        | output | `string`                             | no       | `undefined`                                 | Notifies the consumer after the tag added interaction completes.                                 |
| `tagRemoved`      | output | `string`                             | no       | `undefined`                                 | Notifies the consumer after the tag removed interaction completes.                               |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `ReadonlyArray<string>`.

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
- hover
- focus-visible
- active
- disabled
- filled
- empty
- readonly
- required
- invalid

## Interactive playground

Route: `preview/tags-input`

Scenarios: `default`.
Public API coverage: 11/18
directly controlled; 7 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument          | Control | Default       | Test value                | Binding                            | Description                                                               |
| ----------------- | ------- | ------------- | ------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `disabled`        | boolean | `false`       | `true`                    | input `disabled` (property)        | Prevents user interaction.                                                |
| `autocomplete`    | select  | `"off"`       | `"on"`                    | input `autocomplete` (property)    | Controls native browser autocomplete for the tag editor.                  |
| `tabindex`        | number  | `0`           | `-1`                      | input `tabindex` (property)        | Includes or removes the tag editor from sequential keyboard focus.        |
| `addOnBlur`       | boolean | `true`        | `false`                   | input `addOnBlur` (property)       | Configures the component addOnBlur contract.                              |
| `allowDuplicates` | boolean | `false`       | `true`                    | input `allowDuplicates` (property) | Configures the component allowDuplicates contract.                        |
| `id`              | text    | `""`          | `"Alternate value"`       | input `id` (property)              | Configures the component id contract.                                     |
| `invalid`         | boolean | `false`       | `true`                    | input `invalid` (property)         | Exposes an externally controlled invalid presentation state.              |
| `maxTags`         | number  | `6`           | `7`                       | input `maxTags` (property)         | Configures the component maxTags contract.                                |
| `placeholder`     | text    | `"Add a tag"` | `"Add a tag · alternate"` | input `placeholder` (property)     | Configures the component placeholder contract.                            |
| `readonly`        | boolean | `false`       | `true`                    | input `readonly` (property)        | Configures the component readonly contract.                               |
| `required`        | boolean | `false`       | `true`                    | input `required` (property)        | Marks the value as required and participates in Angular Forms validation. |

Exact API exclusions:

| Public API        | Category           | Evidence                                                | Reason                                                                                                                                                               |
| ----------------- | ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tags-input` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tags-input` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tags-input` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `inputLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#tags-input` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `separator`       | complex-data       | `specimen-fixture:preview/tags-input?state=default`     | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                     |
| `separatorKeys`   | complex-data       | `specimen-fixture:preview/tags-input?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |
| `value`           | complex-data       | `specimen-fixture:preview/tags-input?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |

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
- `filled` — filled; scenario `default`; fixture effect `content/filled` — filled: The component is composed with a representative populated value..
- `empty` — empty; scenario `default`; fixture effect `content/empty` — empty: The component is composed with intentionally empty content..
- `readonly` — readonly; scenario `default`; fixture effect `status/neutral` — readonly: The fixture exposes the readonly status without claiming a public component input..
- `required` — Required; scenario `default`; `required=true`.
- `invalid` — Invalid; scenario `default`; `invalid=true`.

## Related

- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
