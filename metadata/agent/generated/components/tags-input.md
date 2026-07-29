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

| Name              | Kind   | Type                    | Required | Default                                     | Description                                                                |
| ----------------- | ------ | ----------------------- | -------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `id`              | input  | `string`                | no       | `''`                                        | Stable identifier value used by the id contract.                           |
| `ariaLabel`       | input  | `string`                | no       | `this.translations.forms.tags`              | Accessible name used when visible content is not sufficient.               |
| `inputLabel`      | input  | `string`                | no       | `this.translations.forms.addTag`            | Human-readable copy for the input state or control.                        |
| `placeholder`     | input  | `string`                | no       | `this.translations.forms.addTagPlaceholder` | Short input hint shown only while no value is present.                     |
| `separatorKeys`   | input  | `ReadonlyArray<string>` | no       | `['Enter', ',']`                            | Stable identifier value used by the separator contract.                    |
| `maxTags`         | input  | `number`                | no       | `Number.POSITIVE_INFINITY`                  | Upper or lower bound applied to the tags value.                            |
| `allowDuplicates` | input  | `boolean`               | no       | `false`                                     | Controls whether the component applies the allow duplicates behavior.      |
| `addOnBlur`       | input  | `boolean`               | no       | `true`                                      | Commits a valid draft tag when the text input loses focus.                 |
| `disabled`        | input  | `boolean`               | no       | `false`                                     | Prevents user interaction and participates in the disabled-state contract. |
| `readonly`        | input  | `boolean`               | no       | `false`                                     | Keeps the value perceivable while preventing user edits.                   |
| `required`        | input  | `boolean`               | no       | `false`                                     | Marks the value as required and participates in Angular Forms validation.  |
| `invalid`         | input  | `boolean`               | no       | `false`                                     | Exposes an externally controlled invalid presentation state.               |
| `valueChange`     | output | `ReadonlyArray<string>` | no       | `undefined`                                 | Notifies the consumer after the value change interaction completes.        |
| `tagAdded`        | output | `string`                | no       | `undefined`                                 | Notifies the consumer after the tag added interaction completes.           |
| `tagRemoved`      | output | `string`                | no       | `undefined`                                 | Notifies the consumer after the tag removed interaction completes.         |

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
