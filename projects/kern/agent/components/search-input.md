# Search Input

- ID: `search-input`
- Selector: `krn-search-input`
- Import: `import { KrnSearchInput } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSearchInput`
- Lifecycle: **stable**
- Category: Forms

Search Input. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed customer search
 *
 * Own search query state in a non-nullable reactive form control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSearchInput } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-search-input-agent-example',
  standalone: true,
  imports: [KrnSearchInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-search-input
      id="customer-search"
      ariaLabel="Search customers"
      placeholder="Name, owner or account id"
      [formControl]="control"
    />
  `,
})
export class KernSearchInputAgentExample {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

void bootstrapApplication(KernSearchInputAgentExample);
```

## API

| Name              | Kind   | Type                  | Required | Default     | Description                                                                                      |
| ----------------- | ------ | --------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `id`              | input  | `string`              | no       | `''`        | Stable identifier value used by the id contract.                                                 |
| `name`            | input  | `string`              | no       | `''`        | Required human-readable name for the represented person, item, or action.                        |
| `placeholder`     | input  | `string \| undefined` | no       | `undefined` | Short input hint shown only while no value is present.                                           |
| `ariaLabel`       | input  | `string \| undefined` | no       | `undefined` | Accessible name used when visible content is not sufficient.                                     |
| `ariaLabelledBy`  | input  | `string`              | no       | `''`        | Space-separated element ids that provide the accessible name and take precedence over ariaLabel. |
| `ariaDescribedBy` | input  | `string`              | no       | `''`        | Space-separated element ids composed with Form Field hints and validation descriptions.          |
| `clearLabel`      | input  | `string \| undefined` | no       | `undefined` | Human-readable copy for the clear state or control.                                              |
| `autocomplete`    | input  | `string`              | no       | `'off'`     | Native autocomplete purpose forwarded to the editable control.                                   |
| `enterKeyHint`    | input  | `string`              | no       | `'search'`  | Native virtual-keyboard action hint forwarded to the editable control.                           |
| `value`           | input  | `string \| undefined` | no       | `undefined` | Controlled component value.                                                                      |
| `minLength`       | input  | `number \| undefined` | no       | `undefined` | Upper or lower bound applied to the length value.                                                |
| `maxLength`       | input  | `number \| undefined` | no       | `undefined` | Upper or lower bound applied to the length value.                                                |
| `spellcheck`      | input  | `boolean`             | no       | `true`      | Native spell-checking preference forwarded to the editable control.                              |
| `disabled`        | input  | `boolean`             | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.                       |
| `readonly`        | input  | `boolean`             | no       | `false`     | Keeps the value perceivable while preventing user edits.                                         |
| `required`        | input  | `boolean`             | no       | `false`     | Marks the value as required and participates in Angular Forms validation.                        |
| `invalid`         | input  | `boolean`             | no       | `false`     | Exposes an externally controlled invalid presentation state.                                     |
| `valueChange`     | output | `string`              | no       | `undefined` | Notifies the consumer after the value change interaction completes.                              |
| `searchSubmitted` | output | `string`              | no       | `undefined` | Notifies the consumer after the search submitted interaction completes.                          |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

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

Route: `preview/search-input`

Scenarios: `default`.
Public API coverage: 12/17
directly controlled; 5 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument       | Control | Default                    | Test value                             | Binding                         | Description                                                               |
| -------------- | ------- | -------------------------- | -------------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| `placeholder`  | text    | `"Search 248 workspaces…"` | `"Search 248 workspaces… · alternate"` | input `placeholder` (property)  | Sets the empty search prompt.                                             |
| `disabled`     | boolean | `false`                    | `true`                                 | input `disabled` (property)     | Prevents user interaction.                                                |
| `readOnly`     | boolean | `false`                    | `true`                                 | input `readonly` (property)     | Keeps the value focusable while preventing edits.                         |
| `invalid`      | boolean | `false`                    | `true`                                 | input `invalid` (property)      | Exposes the invalid visual and ARIA state.                                |
| `autocomplete` | text    | `"off"`                    | `"off · alternate"`                    | input `autocomplete` (property) | Configures the component autocomplete contract.                           |
| `enterKeyHint` | text    | `"search"`                 | `"search · alternate"`                 | input `enterKeyHint` (property) | Configures the component enterKeyHint contract.                           |
| `id`           | text    | `""`                       | `"Alternate value"`                    | input `id` (property)           | Configures the component id contract.                                     |
| `maxLength`    | number  | `100`                      | `101`                                  | input `maxLength` (property)    | Configures the component maxLength contract.                              |
| `minLength`    | number  | `0`                        | `1`                                    | input `minLength` (property)    | Configures the component minLength contract.                              |
| `required`     | boolean | `false`                    | `true`                                 | input `required` (property)     | Marks the value as required and participates in Angular Forms validation. |
| `spellcheck`   | boolean | `true`                     | `false`                                | input `spellcheck` (property)   | Configures the component spellcheck contract.                             |
| `value`        | text    | `""`                       | `"Alternate value"`                    | input `value` (property)        | Controlled component value.                                               |

Exact API exclusions:

| Public API        | Category           | Evidence                                                                 | Reason                                                                                                                                                               |
| ----------------- | ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaDescribedBy` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#search-input`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabel`       | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#search-input`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `ariaLabelledBy`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#search-input`                | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `clearLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#search-input`                | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `name`            | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#search-input` | Form submission field names do not alter the rendered component and are covered by forms integration tests.                                                          |

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
- `readonly` — Readonly; scenario `default`; `readOnly=true`.
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
