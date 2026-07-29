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
- closed
- open
- empty results
- async loading

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
