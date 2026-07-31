# Native Select

- ID: `native-select`
- Selector: `krn-native-select`
- Import: `import { KrnNativeSelect } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnNativeSelect`
- Lifecycle: **stable**
- Category: Forms

Native Select. Delegates a single predefined selection surface to the browser and operating system.

## Use

Use it when platform familiarity, compactness, or native mobile selection is the priority.

Avoid: Do not expect the option popup to inherit Kern surface styling across operating systems.

## Compile-verified standalone Angular example

```ts
/**
 * Typed native region select
 *
 * Use native select semantics with the same typed option contract.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNativeSelect, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-native-select-agent-example',
  standalone: true,
  imports: [KrnNativeSelect, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-native-select ariaLabel="Data region" [options]="regionOptions" [formControl]="control" />
  `,
})
export class KernNativeSelectAgentExample {
  readonly control = new FormControl<string | null>('eu-central', { nonNullable: true });

  readonly regionOptions: readonly KrnSelectOption<string>[] = [
    { value: 'eu-central', label: 'EU Central' },
    { value: 'us-east', label: 'US East' },
  ];
}

void bootstrapApplication(KernNativeSelectAgentExample);
```

## API

| Name              | Kind   | Type                                | Required | Default                                | Description                                                                                      |
| ----------------- | ------ | ----------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`                            | no       | `''`                                   | Stable identifier value used by the id contract.                                                 |
| `name`            | input  | `string`                            | no       | `''`                                   | Required human-readable name for the represented person, item, or action.                        |
| `placeholder`     | input  | `string`                            | no       | `''`                                   | Short input hint shown only while no value is present.                                           |
| `ariaLabel`       | input  | `string`                            | no       | `''`                                   | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`  | input  | `string`                            | no       | `''`                                   | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`                            | no       | `''`                                   | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `options`         | input  | `ReadonlyArray<KrnSelectOption<T>>` | yes      | `required`                             | Authoritative option collection presented by the selection control.                              |
| `identityMatcher` | input  | `KrnIdentityMatcher<T>`             | no       | `Object.is`                            | Compares option values when object identity is not stable across refreshes.                      |
| `trackBy`         | input  | `KrnOptionTrackBy<T>`               | no       | `(option) => option.value`             | Returns the stable identity used to retain rendered items across updates.                        |
| `stringify`       | input  | `KrnOptionStringifier<T>`           | no       | `(option) => option.label`             | Converts a domain value into the human-readable label shown to users.                            |
| `disabledHandler` | input  | `KrnOptionDisabledHandler<T>`       | no       | `(option) => option.disabled ?? false` | Determines whether an individual option or item is unavailable.                                  |
| `disabled`        | input  | `boolean`                           | no       | `false`                                | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`                           | no       | `false`                                | Keeps the value perceivable while preventing user edits.                                         |
| `required`        | input  | `boolean`                           | no       | `false`                                | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`         | input  | `boolean`                           | no       | `false`                                | Exposes an externally controlled invalid presentation state.                                     |
| `tabindex`        | input  | `number`                            | no       | `0`                                    | Native sequential-focus order forwarded to the owned interactive element.                        |
| `value`           | input  | `T \| null \| undefined`            | no       | `undefined`                            | Controlled component value.                                                                      |
| `valueChange`     | output | `T \| null`                         | no       | `undefined`                            | Notifies the consumer after the value change interaction completes.                              |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `T | null`.

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

Route: `preview/native-select`

Scenarios: `default`, `stress`.
Public API coverage: 7/17
directly controlled; 10 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default             | Test value                      | Binding                        | Description                                       |
| ------------- | ------- | ------------------- | ------------------------------- | ------------------------------ | ------------------------------------------------- |
| `placeholder` | text    | `"Choose a region"` | `"Choose a region · alternate"` | input `placeholder` (property) | Sets the empty selection prompt.                  |
| `disabled`    | boolean | `false`             | `true`                          | input `disabled` (property)    | Prevents user interaction.                        |
| `readOnly`    | boolean | `false`             | `true`                          | input `readonly` (property)    | Keeps the value focusable while preventing edits. |
| `required`    | boolean | `false`             | `true`                          | input `required` (property)    | Marks the control as required.                    |
| `invalid`     | boolean | `false`             | `true`                          | input `invalid` (property)     | Exposes the invalid visual and ARIA state.        |
| `id`          | text    | `""`                | `"Alternate value"`             | input `id` (property)          | Configures the component id contract.             |
| `tabindex`    | number  | `0`                 | `1`                             | input `tabindex` (property)    | Configures the component tabindex contract.       |

Exact API exclusions:

| Public API        | Category           | Evidence                                                                  | Reason                                                                                                                  |
| ----------------- | ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#native-select`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#native-select`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#native-select`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `disabledHandler` | callback           | `component-example:agent/components/native-select.json#/examples/0`       | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `identityMatcher` | callback           | `component-example:agent/components/native-select.json#/examples/0`       | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `name`            | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#native-select` | Form submission field names do not alter the rendered component and are covered by forms integration tests.             |
| `options`         | complex-data       | `specimen-fixture:preview/native-select?state=default`                    | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |
| `stringify`       | complex-data       | `specimen-fixture:preview/native-select?state=default`                    | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                        |
| `trackBy`         | callback           | `component-example:agent/components/native-select.json#/examples/0`       | Callback inputs require executable application code and are covered by the typed specimen fixture.                      |
| `value`           | complex-data       | `specimen-fixture:preview/native-select?state=default`                    | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                        |

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
- `stress` — Stress data; scenario `stress`.

## Related

- `select`
- `combobox`
- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not expect the operating-system option popup to inherit KERN surface styling.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
