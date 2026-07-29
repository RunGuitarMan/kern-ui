# Combobox

- ID: `combobox`
- Selector: `krn-combobox`
- Import: `import { KrnCombobox } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCombobox`
- Lifecycle: **beta**
- Category: Forms

Combobox. Filters a defined option set and commits the value of one explicit selection.

## Use

Use Combobox when typing should filter options and the committed value must come from an authoritative list.

Avoid: Use Autocomplete when unmatched free text is valid, or Select when filtering adds no value.

## Compile-verified standalone Angular example

```ts
/**
 * Typed editable owner combobox
 *
 * Offer typed suggestions for an application-owned text value.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCombobox, type KrnSelectOption } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-combobox-agent-example',
  standalone: true,
  imports: [KrnCombobox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-combobox
      ariaLabel="Escalation owner"
      [options]="ownerOptions"
      [formControl]="control"
      [(open)]="open"
    />
  `,
})
export class KernComboboxAgentExample {
  readonly control = new FormControl<string>('Platform team', { nonNullable: true });

  readonly ownerOptions: readonly KrnSelectOption<string>[] = [
    { value: 'Platform team', label: 'Platform team' },
    { value: 'Security team', label: 'Security team' },
  ];

  open = false;
}

void bootstrapApplication(KernComboboxAgentExample);
```

## API

| Name          | Kind  | Type     | Required | Default                                                                                         | Description                                                       |
| ------------- | ----- | -------- | -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `id`          | input | `string` | no       | `''`                                                                                            | Stable identifier value used by the id contract.                  |
| `placeholder` | input | `string` | no       | `this.translations.forms.startTyping`                                                           | Short input hint shown only while no value is present.            |
| `emptyText`   | input | `string` | no       | `this.translations.forms.noMatches`                                                             | Visible and announced copy when the data collection has no items. |
| `loadingText` | input | `string` | no       | `this.translations.forms.loadingOptions ?? KRN_ENGLISH_TRANSLATIONS.forms.loadingOptions ?? ''` | Visible and announced copy while asynchronous data is loading.    |
| `errorText`   | input | `string` | no       | `this.translations.forms.optionsLoadFailed ??                                                   |

      KRN_ENGLISH_TRANSLATIONS.forms.optionsLoadFailed ??
      ''` | Visible and announced copy when loading the data collection fails. |

| `ariaLabel` | input | `string` | no | `''` | Accessible name used when visible content is not sufficient. |
| `toggleLabel` | input | `string` | no | `this.translations.forms.showOptions` | Human-readable copy for the toggle state or control. |
| `options` | input | `ReadonlyArray<KrnSelectOption<string>>` | yes | `required` | Authoritative option collection presented by the selection control. |
| `optionsState` | input | `KrnOptionsState` | no | `'ready'` | Controls whether options are interactive or replaced by an announced loading/error state. |
| `filterLocally` | input | `boolean` | no | `true` | Set to false when the consumer filters options remotely in response to queryChange. |
| `optionFilter` | input | `KrnOptionFilter<string> \| null` | no | `null` | Overrides the default case-insensitive local option filter. |
| `disabled` | input | `boolean` | no | `false` | Prevents user interaction and participates in the disabled-state contract. |
| `readonly` | input | `boolean` | no | `false` | Keeps the value perceivable while preventing user edits. |
| `required` | input | `boolean` | no | `false` | Marks the value as required and participates in Angular Forms validation. |
| `invalid` | input | `boolean` | no | `false` | Exposes an externally controlled invalid presentation state. |
| `open` | model | `boolean` | no | `false` | Controls whether the disclosure or overlay surface is visible. |
| `valueChange` | output | `string` | no | `undefined` | Notifies the consumer after the value change interaction completes. |
| `queryChange` | output | `string` | no | `undefined` | Emits every user query so remote option sources can load and replace options. |
| `optionSelected` | output | `KrnSelectOption<string>` | no | `undefined` | Notifies the consumer after the option selected interaction completes. |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `string`.

## Accessibility

- Typing filters options; Arrow Down and Arrow Up move the active option.
- Enter commits the active option.
- Escape closes the popup without inventing or changing a value.
- The input exposes combobox, expanded, controls, and active-descendant state.
- A committed value resolves back to its option label after asynchronous options arrive.
- Loading, empty, and error option states are announced without stealing focus.

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

- `select`
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
- Combobox commits only a known option; do not treat unmatched text as a value.
- Keep option identity stable across async refreshes.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify reactive-form value, touched, disabled, required and invalid state.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
