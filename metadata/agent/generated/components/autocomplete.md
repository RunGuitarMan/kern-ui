# Autocomplete

- ID: `autocomplete`
- Selector: `krn-autocomplete`
- Import: `import { KrnAutocomplete } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnAutocomplete`
- Lifecycle: **beta**
- Category: Forms

Autocomplete. Offers known suggestions while preserving valid free text as the final value.

## Use

Use Autocomplete when suggestions accelerate text entry but a value outside the suggestion set remains valid.

Avoid: Use Combobox or Select when the submitted value must match an authoritative option identifier.

## Compile-verified standalone Angular example

```ts
/**
 * Typed account autocomplete
 *
 * Provide explicit suggestions and controlled popup state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAutocomplete, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-autocomplete-agent-example',
  standalone: true,
  imports: [KrnAutocomplete, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-autocomplete
      ariaLabel="Customer account"
      [options]="accountOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernAutocompleteAgentExample {
  readonly control = new FormControl<string>('Acme Europe', { nonNullable: true });

  readonly accountOptions: readonly KrnSelectOption<string>[] = [
    { value: 'Acme Europe', label: 'Acme Europe' },
    { value: 'Acme North America', label: 'Acme North America' },
  ];

  open = false;
}

void bootstrapApplication(KernAutocompleteAgentExample);
```

## API

| Name               | Kind   | Type                                     | Required | Default     | Description                                                                                      |
| ------------------ | ------ | ---------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `autocompleteMode` | input  | `KrnAutocompleteMode \| undefined`       | no       | `undefined` | Controls whether the component applies the autocomplete mode input behavior.                     |
| `allowCustomValue` | input  | `boolean \| undefined`                   | no       | `undefined` | Controls whether the component applies the allow custom value input behavior.                    |
| `id`               | input  | `string`                                 | no       | `''`        | Stable identifier value used by the id contract.                                                 |
| `placeholder`      | input  | `string \| undefined`                    | no       | `undefined` | Short input hint shown only while no value is present.                                           |
| `emptyText`        | input  | `string \| undefined`                    | no       | `undefined` | Visible and announced copy when the data collection has no items.                                |
| `loadingText`      | input  | `string \| undefined`                    | no       | `undefined` | Visible and announced copy while asynchronous data is loading.                                   |
| `errorText`        | input  | `string \| undefined`                    | no       | `undefined` | Visible and announced copy when loading the data collection fails.                               |
| `ariaLabel`        | input  | `string`                                 | no       | `''`        | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`   | input  | `string`                                 | no       | `''`        | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy`  | input  | `string`                                 | no       | `''`        | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `toggleLabel`      | input  | `string \| undefined`                    | no       | `undefined` | Human-readable copy for the toggle state or control.                                             |
| `name`             | input  | `string`                                 | no       | `''`        | Required human-readable name for the represented person, item, or action.                        |
| `options`          | input  | `ReadonlyArray<KrnSelectOption<string>>` | yes      | `required`  | Authoritative option collection presented by the selection control.                              |
| `optionsState`     | input  | `KrnOptionsState`                        | no       | `'ready'`   | Controls whether options are interactive or replaced by an announced loading/error state.        |
| `filterLocally`    | input  | `boolean`                                | no       | `true`      | Set to false when the consumer filters options remotely in response to queryChange.              |
| `optionFilter`     | input  | `KrnOptionFilter<string> \| null`        | no       | `null`      | Overrides the default case-insensitive local option filter.                                      |
| `disabled`         | input  | `boolean`                                | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`         | input  | `boolean`                                | no       | `false`     | Keeps the value perceivable while preventing user edits.                                         |
| `required`         | input  | `boolean`                                | no       | `false`     | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`          | input  | `boolean`                                | no       | `false`     | Exposes an externally controlled invalid presentation state.                                     |
| `tabindex`         | input  | `number`                                 | no       | `0`         | Native sequential-focus order forwarded to the owned interactive element.                        |
| `value`            | input  | `string \| undefined`                    | no       | `undefined` | Controlled component value.                                                                      |
| `open`             | model  | `boolean`                                | no       | `false`     | Controls whether the disclosure or overlay surface is visible.                                   |
| `valueChange`      | output | `string`                                 | no       | `undefined` | Notifies the consumer after the value change interaction completes.                              |
| `queryChange`      | output | `string`                                 | no       | `undefined` | Emits every user query so remote option sources can load and replace options.                    |
| `optionSelected`   | output | `KrnSelectOption<string>`                | no       | `undefined` | Notifies the consumer after the option selected interaction completes.                           |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Typing changes the free-text value and filters suggestions.
- Arrow Down and Arrow Up move the active suggestion.
- Enter accepts the active suggestion; Escape dismisses suggestions without clearing text.
- The editable value remains the source of truth even when no suggestion matches.
- The combobox exposes expansion, controls, autocomplete mode, and active descendant.
- Loading, empty, and error result states remain perceivable without moving focus.

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
- closed
- open
- empty results
- async loading

## Interactive playground

Route: `preview/autocomplete`

Scenarios: `default`, `stress`.
Public API coverage: 15/23
directly controlled; 8 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument           | Control | Default                     | Test value                              | Binding                             | Description                                                          |
| ------------------ | ------- | --------------------------- | --------------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `placeholder`      | text    | `"Type a workspace alias…"` | `"Type a workspace alias… · alternate"` | input `placeholder` (property)      | Sets the empty input prompt.                                         |
| `optionsState`     | select  | `"ready"`                   | `"loading"`                             | input `optionsState` (property)     | Shows ready, loading, or error suggestions.                          |
| `emptyText`        | text    | `"No options"`              | `"No options · alternate"`              | input `emptyText` (property)        | Uses locale-aware empty-options copy until explicitly changed.       |
| `errorText`        | text    | `"Could not load options"`  | `"Could not load options · alternate"`  | input `errorText` (property)        | Uses locale-aware option-load failure copy until explicitly changed. |
| `loadingText`      | text    | `"Loading options…"`        | `"Loading options… · alternate"`        | input `loadingText` (property)      | Uses locale-aware loading copy until explicitly changed.             |
| `open`             | boolean | `false`                     | `true`                                  | model `open`                        | Opens the suggestions listbox.                                       |
| `disabled`         | boolean | `false`                     | `true`                                  | input `disabled` (property)         | Prevents user interaction.                                           |
| `readOnly`         | boolean | `false`                     | `true`                                  | input `readonly` (property)         | Keeps the value focusable while preventing edits.                    |
| `required`         | boolean | `false`                     | `true`                                  | input `required` (property)         | Marks the control as required.                                       |
| `invalid`          | boolean | `false`                     | `true`                                  | input `invalid` (property)          | Exposes the invalid visual and ARIA state.                           |
| `allowCustomValue` | boolean | `false`                     | `true`                                  | input `allowCustomValue` (property) | Configures the component allowCustomValue contract.                  |
| `filterLocally`    | boolean | `true`                      | `false`                                 | input `filterLocally` (property)    | Configures the component filterLocally contract.                     |
| `id`               | text    | `""`                        | `"Alternate value"`                     | input `id` (property)               | Configures the component id contract.                                |
| `tabindex`         | number  | `0`                         | `1`                                     | input `tabindex` (property)         | Configures the component tabindex contract.                          |
| `value`            | text    | `""`                        | `"Alternate value"`                     | input `value` (property)            | Controlled component value.                                          |

Exact API exclusions:

| Public API         | Category           | Evidence                                                                 | Reason                                                                                                                                                               |
| ------------------ | ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#autocomplete`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabel`        | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#autocomplete`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabelledBy`   | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#autocomplete`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `autocompleteMode` | complex-data       | `specimen-fixture:preview/autocomplete?state=default`                    | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                     |
| `name`             | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#autocomplete` | Form submission field names do not alter the rendered component and are covered by forms integration tests.                                                          |
| `optionFilter`     | complex-data       | `specimen-fixture:preview/autocomplete?state=default`                    | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                     |
| `options`          | complex-data       | `specimen-fixture:preview/autocomplete?state=default`                    | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |
| `toggleLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#autocomplete`                | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `stress`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `stress`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
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
- `readonly` — Readonly; scenario `default`; `readOnly=true`.
- `required` — Required; scenario `default`; `required=true`.
- `invalid` — Invalid; scenario `default`; `invalid=true`.
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `empty-results` — empty results; scenario `default`; fixture effect `data/empty` — empty results: The fixture data source returned no records..
- `async-loading` — Async loading; scenario `default`; `optionsState="loading"`.
- `error` — Error; scenario `default`; `optionsState="error"`.
- `stress` — Stress data; scenario `stress`.

## Related

- `combobox`
- `select`
- `search-input`
- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Autocomplete preserves valid free text; use Combobox when a known identifier is required.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
