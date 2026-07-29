# Segmented Control

- ID: `segmented-control`
- Selector: `krn-segmented-control`
- Import: `import { KrnSegmentedControl } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnSegmentedControl`
- Lifecycle: **stable**
- Category: Forms

Segmented Control. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed report period
 *
 * Select one typed period from stable segment options.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSegmentedControl, type KrnSegmentOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-segmented-control-agent-example',
  standalone: true,
  imports: [KrnSegmentedControl, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-segmented-control
      ariaLabel="Report period"
      [options]="periodOptions"
      [formControl]="control"
    />
  `,
})
export class KernSegmentedControlAgentExample {
  readonly control = new FormControl<string | null>('quarter', { nonNullable: true });

  readonly periodOptions: readonly KrnSegmentOption<string>[] = [
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];
}

void bootstrapApplication(KernSegmentedControlAgentExample);
```

## API

| Name              | Kind   | Type                                              | Required | Default                                | Description                                                                 |
| ----------------- | ------ | ------------------------------------------------- | -------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `id`              | input  | `string`                                          | no       | `''`                                   | Stable identifier value used by the id contract.                            |
| `options`         | input  | `ReadonlyArray<KrnSegmentOption<T>>`              | yes      | `required`                             | Authoritative option collection presented by the selection control.         |
| `identityMatcher` | input  | `KrnIdentityMatcher<T>`                           | no       | `Object.is`                            | Compares option values when object identity is not stable across refreshes. |
| `trackBy`         | input  | `KrnSegmentTrackBy<T>`                            | no       | `(option) => option.value`             | Returns the stable identity used to retain rendered items across updates.   |
| `disabledHandler` | input  | `KrnSegmentDisabledHandler<T>`                    | no       | `(option) => option.disabled ?? false` | Determines whether an individual option or item is unavailable.             |
| `optionTemplate`  | input  | `TemplateRef<KrnSegmentOptionContext<T>> \| null` | no       | `null`                                 | Template used to render one option with its typed context.                  |
| `ariaLabel`       | input  | `string`                                          | no       | `this.translations.forms.chooseOption` | Accessible name used when visible content is not sufficient.                |
| `disabled`        | input  | `boolean`                                         | no       | `false`                                | Prevents user interaction and participates in the disabled-state contract.  |
| `readonly`        | input  | `boolean`                                         | no       | `false`                                | Keeps the value perceivable while preventing user edits.                    |
| `required`        | input  | `boolean`                                         | no       | `false`                                | Marks the value as required and participates in Angular Forms validation.   |
| `invalid`         | input  | `boolean`                                         | no       | `false`                                | Exposes an externally controlled invalid presentation state.                |
| `valueChange`     | output | `T \| null`                                       | no       | `undefined`                            | Notifies the consumer after the value change interaction completes.         |

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

- `form-field`
- `label`
- `hint`
- `validation-message`

## Common mistakes

- Do not omit required inputs: `options`.
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
