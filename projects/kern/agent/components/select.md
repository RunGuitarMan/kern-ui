# Select

- ID: `select`
- Selector: `krn-select`
- Import: `import { KrnSelect } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSelect`
- Lifecycle: **beta**
- Category: Forms

Select. Opens a styled list and commits exactly one value from a predefined option set.

## Use

Use Select when exactly one value must be chosen from a bounded authoritative option set.

Avoid: Use Native Select for platform selection, Combobox for searchable options, or Autocomplete for valid free text.

## Compile-verified standalone Angular example

```ts
/**
 * Typed owner select
 *
 * Supply stable typed options and controlled overlay state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSelect, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-select-agent-example',
  standalone: true,
  imports: [KrnSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-select
      ariaLabel="Account owner"
      [options]="ownerOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernSelectAgentExample {
  readonly control = new FormControl<string | null>('owner-ada', { nonNullable: true });

  readonly ownerOptions: readonly KrnSelectOption<string>[] = [
    { value: 'owner-ada', label: 'Ada Lovelace' },
    { value: 'owner-grace', label: 'Grace Hopper' },
  ];

  open = false;
}

void bootstrapApplication(KernSelectAgentExample);
```

## API

| Name          | Kind  | Type     | Required | Default                                                                                         | Description                                                       |
| ------------- | ----- | -------- | -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `id`          | input | `string` | no       | `''`                                                                                            | Stable identifier value used by the id contract.                  |
| `placeholder` | input | `string` | no       | `this.translations.forms.selectOption`                                                          | Short input hint shown only while no value is present.            |
| `emptyText`   | input | `string` | no       | `this.translations.forms.noOptions`                                                             | Visible and announced copy when the data collection has no items. |
| `loadingText` | input | `string` | no       | `this.translations.forms.loadingOptions ?? KRN_ENGLISH_TRANSLATIONS.forms.loadingOptions ?? ''` | Visible and announced copy while asynchronous data is loading.    |
| `errorText`   | input | `string` | no       | `this.translations.forms.optionsLoadFailed ??                                                   |

      KRN_ENGLISH_TRANSLATIONS.forms.optionsLoadFailed ??
      ''` | Visible and announced copy when loading the data collection fails. |

| `ariaLabel` | input | `string` | no | `''` | Accessible name used when visible content is not sufficient. |
| `options` | input | `ReadonlyArray<KrnSelectOption<T>>` | yes | `required` | Authoritative option collection presented by the selection control. |
| `optionsState` | input | `KrnOptionsState` | no | `'ready'` | Controls whether options are interactive or replaced by an announced loading/error state. |
| `identityMatcher` | input | `KrnIdentityMatcher<T>` | no | `Object.is` | Compares option values when object identity is not stable across refreshes. |
| `trackBy` | input | `KrnOptionTrackBy<T>` | no | `(option) => option.value` | Returns the stable identity used to retain rendered items across updates. |
| `stringify` | input | `KrnOptionStringifier<T>` | no | `(option) => option.label` | Converts a domain value into the human-readable label shown to users. |
| `disabledHandler` | input | `KrnOptionDisabledHandler<T>` | no | `(option) => option.disabled ?? false` | Determines whether an individual option or item is unavailable. |
| `optionTemplate` | input | `TemplateRef<KrnSelectOptionContext<T>> \| null` | no | `null` | Template used to render one option with its typed context. |
| `selectedTemplate` | input | `TemplateRef<KrnSelectOptionContext<T>> \| null` | no | `null` | Template used to render the committed selection. |
| `disabled` | input | `boolean` | no | `false` | Prevents user interaction and participates in the disabled-state contract. |
| `readonly` | input | `boolean` | no | `false` | Keeps the value perceivable while preventing user edits. |
| `required` | input | `boolean` | no | `false` | Marks the value as required and participates in Angular Forms validation. |
| `invalid` | input | `boolean` | no | `false` | Exposes an externally controlled invalid presentation state. |
| `open` | model | `boolean` | no | `false` | Controls whether the disclosure or overlay surface is visible. |
| `valueChange` | output | `T \| null` | no | `undefined` | Notifies the consumer after the value change interaction completes. |
| `selectionChange` | output | `KrnSelectOption<T> \| null` | no | `undefined` | Notifies the consumer after the selection change interaction completes. |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `T | null`.

## Accessibility

- Enter or Space opens the list; Arrow keys move the active option.
- Enter commits the active option.
- Escape closes without changing the committed value.
- The trigger exposes expansion, list ownership, and active descendant.
- The selected option label remains the visible source of truth.
- Loading, empty, and error states remain perceivable without moving focus.

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

Route: `preview/select`

Scenarios: `default`, `stress`.
Public API coverage: 11/19
directly controlled; 8 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default                    | Test value                             | Binding                         | Description                                                          |
| -------------- | ------- | -------------------------- | -------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `placeholder`  | text    | `"Choose a plan"`          | `"Choose a plan · alternate"`          | input `placeholder` (property)  | Sets the empty selection prompt.                                     |
| `optionsState` | select  | `"ready"`                  | `"loading"`                            | input `optionsState` (property) | Shows ready, loading, or error option content.                       |
| `emptyText`    | text    | `"No options"`             | `"No options · alternate"`             | input `emptyText` (property)    | Uses locale-aware empty-options copy until explicitly changed.       |
| `errorText`    | text    | `"Could not load options"` | `"Could not load options · alternate"` | input `errorText` (property)    | Uses locale-aware option-load failure copy until explicitly changed. |
| `loadingText`  | text    | `"Loading options…"`       | `"Loading options… · alternate"`       | input `loadingText` (property)  | Uses locale-aware loading copy until explicitly changed.             |
| `open`         | boolean | `false`                    | `true`                                 | model `open`                    | Opens the listbox.                                                   |
| `disabled`     | boolean | `false`                    | `true`                                 | input `disabled` (property)     | Prevents user interaction.                                           |
| `readOnly`     | boolean | `false`                    | `true`                                 | input `readonly` (property)     | Keeps the value focusable while preventing edits.                    |
| `required`     | boolean | `false`                    | `true`                                 | input `required` (property)     | Marks the control as required.                                       |
| `invalid`      | boolean | `false`                    | `true`                                 | input `invalid` (property)      | Exposes the invalid visual and ARIA state.                           |
| `id`           | text    | `""`                       | `"Alternate value"`                    | input `id` (property)           | Configures the component id contract.                                |

Exact API exclusions:

| Public API         | Category           | Evidence                                                     | Reason                                                                                                                  |
| ------------------ | ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`        | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#select`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `disabledHandler`  | callback           | `component-example:agent/components/select.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `identityMatcher`  | callback           | `component-example:agent/components/select.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `options`          | complex-data       | `specimen-fixture:preview/select?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `optionTemplate`   | template           | `component-example:agent/components/select.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.              |
| `selectedTemplate` | template           | `component-example:agent/components/select.json#/examples/0` | Template inputs require a compiled Angular fixture and cannot be represented by a scalar URL-safe control.              |
| `stringify`        | complex-data       | `specimen-fixture:preview/select?state=default`              | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                        |
| `trackBy`          | callback           | `component-example:agent/components/select.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |

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

- `native-select`
- `combobox`
- `autocomplete`
- `multi-select`
- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not bind object options without a stable identityMatcher and trackBy contract.
- Do not use Select when arbitrary free text is valid; use Autocomplete.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
