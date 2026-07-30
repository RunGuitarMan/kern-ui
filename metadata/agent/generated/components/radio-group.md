# Radio Group

- ID: `radio-group`
- Selector: `krn-radio-group`
- Import: `import { KrnRadioGroup } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnRadioGroup`
- Lifecycle: **stable**
- Category: Forms

Radio Group. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed billing-cycle choice
 *
 * Bind one selected value while composing visible radio options.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnRadio, KrnRadioGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-radio-group-agent-example',
  standalone: true,
  imports: [KrnRadioGroup, ReactiveFormsModule, KrnRadio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-radio-group label="Billing cycle" [formControl]="control">
      <krn-radio value="monthly">Monthly</krn-radio>
      <krn-radio value="annual">Annual</krn-radio>
    </krn-radio-group>
  `,
})
export class KernRadioGroupAgentExample {
  readonly control = new FormControl<string | null>('annual', { nonNullable: true });
}

void bootstrapApplication(KernRadioGroupAgentExample);
```

## API

| Name          | Kind   | Type             | Required | Default      | Description                                                                |
| ------------- | ------ | ---------------- | -------- | ------------ | -------------------------------------------------------------------------- |
| `id`          | input  | `string`         | no       | `''`         | Stable identifier value used by the id contract.                           |
| `label`       | input  | `string`         | no       | `''`         | Visible text that names the control or data value.                         |
| `name`        | input  | `string`         | no       | `''`         | Native form-control name shared by every radio option in the group.        |
| `orientation` | input  | `KrnOrientation` | no       | `'vertical'` | Defines the logical axis used by layout and keyboard navigation.           |
| `disabled`    | input  | `boolean`        | no       | `false`      | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`    | input  | `boolean`        | no       | `false`      | Keeps the value perceivable while preventing user edits.                   |
| `required`    | input  | `boolean`        | no       | `false`      | Marks the value as required and participates in Angular Forms validation.  |
| `invalid`     | input  | `boolean`        | no       | `false`      | Exposes an externally controlled invalid presentation state.               |
| `describedBy` | input  | `string`         | no       | `''`         | Space-separated element ids that provide the accessible description.       |
| `valueChange` | output | `string \| null` | no       | `undefined`  | Notifies the consumer after the value change interaction completes.        |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Angular Forms control with value type `string | null`.

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

Route: `preview/radio-group`

Scenarios: `default`.
Public API coverage: 7/9
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                | Test value                         | Binding                        | Description                                                               |
| ------------- | ------- | ---------------------- | ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `disabled`    | boolean | `false`                | `true`                             | input `disabled` (property)    | Prevents user interaction.                                                |
| `label`       | text    | `"Default visibility"` | `"Default visibility · alternate"` | input `label` (property)       | Names the radio group.                                                    |
| `orientation` | select  | `"horizontal"`         | `"vertical"`                       | input `orientation` (property) | Changes the choice layout axis.                                           |
| `id`          | text    | `""`                   | `"Alternate value"`                | input `id` (property)          | Configures the component id contract.                                     |
| `invalid`     | boolean | `false`                | `true`                             | input `invalid` (property)     | Exposes an externally controlled invalid presentation state.              |
| `readonly`    | boolean | `false`                | `true`                             | input `readonly` (property)    | Configures the component readonly contract.                               |
| `required`    | boolean | `false`                | `true`                             | input `required` (property)    | Marks the value as required and participates in Angular Forms validation. |

Exact API exclusions:

| Public API    | Category           | Evidence                                                                | Reason                                                                                                        |
| ------------- | ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `describedBy` | dom-wiring         | `a11y-test:tests/a11y/accessibility.spec.ts#radio-group`                | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid. |
| `name`        | form-serialization | `forms-integration:tests/e2e/enterprise-acceptance.spec.ts#radio-group` | Form submission field names do not alter the rendered component and are covered by forms integration tests.   |

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
