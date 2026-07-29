# File Upload

- ID: `file-upload`
- Selector: `krn-file-upload`
- Import: `import { KrnFileUpload } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnFileUpload`
- Lifecycle: **stable**
- Category: Forms

File Upload. A typed form control with visible state, reliable labeling, and Angular Forms semantics.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed contract upload
 *
 * Bind an immutable file list with accepted document formats.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnFileUpload } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-file-upload-agent-example',
  standalone: true,
  imports: [KrnFileUpload, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-file-upload
      label="Signed contract"
      description="PDF, up to 10 MB"
      accept=".pdf,application/pdf"
      [maxSize]="10485760"
      [formControl]="control"
    />
  `,
})
export class KernFileUploadAgentExample {
  readonly control = new FormControl<readonly File[]>([], { nonNullable: true });
}

void bootstrapApplication(KernFileUploadAgentExample);
```

## API

| Name          | Kind   | Type                                | Required | Default                               | Description                                                                 |
| ------------- | ------ | ----------------------------------- | -------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `id`          | input  | `string`                            | no       | `''`                                  | Stable identifier value used by the id contract.                            |
| `label`       | input  | `string`                            | no       | `this.translations.forms.chooseFiles` | Visible text that names the control or data value.                          |
| `locale`      | input  | `string`                            | no       | `inject(KRN_LOCALE)`                  | Locale identifier used for collation, formatting, and component-owned copy. |
| `description` | input  | `string`                            | no       | `''`                                  | Visible supporting description for the component content.                   |
| `accept`      | input  | `string`                            | no       | `''`                                  | Comma-separated file types accepted by the upload control.                  |
| `multiple`    | input  | `boolean`                           | no       | `false`                               | Allows more than one value or file to be selected in one interaction.       |
| `maxSize`     | input  | `number`                            | no       | `Number.POSITIVE_INFINITY`            | Upper or lower bound applied to the size value.                             |
| `maxFiles`    | input  | `number`                            | no       | `Number.POSITIVE_INFINITY`            | Upper or lower bound applied to the files value.                            |
| `disabled`    | input  | `boolean`                           | no       | `false`                               | Prevents user interaction and participates in the disabled-state contract.  |
| `readonly`    | input  | `boolean`                           | no       | `false`                               | Keeps the value perceivable while preventing user edits.                    |
| `required`    | input  | `boolean`                           | no       | `false`                               | Marks the value as required and participates in Angular Forms validation.   |
| `invalid`     | input  | `boolean`                           | no       | `false`                               | Exposes an externally controlled invalid presentation state.                |
| `filesChange` | output | `ReadonlyArray<File>`               | no       | `undefined`                           | Notifies the consumer after the files change interaction completes.         |
| `rejected`    | output | `ReadonlyArray<KrnUploadRejection>` | no       | `undefined`                           | Notifies the consumer after the rejected interaction completes.             |

## Content slots

_No projected content slots._

## Angular Forms

Angular Forms control with value type `ReadonlyArray<File>`.

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
