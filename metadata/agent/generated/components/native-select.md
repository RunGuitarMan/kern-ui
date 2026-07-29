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

| Name              | Kind   | Type                                | Required | Default                                | Description                                                                 |
| ----------------- | ------ | ----------------------------------- | -------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `id`              | input  | `string`                            | no       | `''`                                   | Stable identifier value used by the id contract.                            |
| `name`            | input  | `string`                            | no       | `''`                                   | Required human-readable name for the represented person, item, or action.   |
| `placeholder`     | input  | `string`                            | no       | `''`                                   | Short input hint shown only while no value is present.                      |
| `ariaLabel`       | input  | `string`                            | no       | `''`                                   | Accessible name used when visible content is not sufficient.                |
| `options`         | input  | `ReadonlyArray<KrnSelectOption<T>>` | yes      | `required`                             | Authoritative option collection presented by the selection control.         |
| `identityMatcher` | input  | `KrnIdentityMatcher<T>`             | no       | `Object.is`                            | Compares option values when object identity is not stable across refreshes. |
| `trackBy`         | input  | `KrnOptionTrackBy<T>`               | no       | `(option) => option.value`             | Returns the stable identity used to retain rendered items across updates.   |
| `stringify`       | input  | `KrnOptionStringifier<T>`           | no       | `(option) => option.label`             | Converts a domain value into the human-readable label shown to users.       |
| `disabledHandler` | input  | `KrnOptionDisabledHandler<T>`       | no       | `(option) => option.disabled ?? false` | Determines whether an individual option or item is unavailable.             |
| `disabled`        | input  | `boolean`                           | no       | `false`                                | Prevents user interaction and participates in the disabled-state contract.  |
| `readonly`        | input  | `boolean`                           | no       | `false`                                | Keeps the value perceivable while preventing user edits.                    |
| `required`        | input  | `boolean`                           | no       | `false`                                | Marks the value as required and participates in Angular Forms validation.   |
| `invalid`         | input  | `boolean`                           | no       | `false`                                | Exposes an externally controlled invalid presentation state.                |
| `valueChange`     | output | `T \| null`                         | no       | `undefined`                            | Notifies the consumer after the value change interaction completes.         |

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
