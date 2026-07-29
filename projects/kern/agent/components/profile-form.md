# Profile Form

- ID: `profile-form`
- Selector: `krn-profile-form`
- Import: `import { KrnProfileForm } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnProfileForm`
- Lifecycle: **recipe**
- Category: Patterns

Profile Form. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed editable profile form
 *
 * Supply typed initial profile state and consume typed save output.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnProfileForm, type KrnProfileValue } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-profile-form-agent-example',
  standalone: true,
  imports: [KrnProfileForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-profile-form
      [value]="profile"
      [timezones]="timezones"
      [saving]="saving"
      (saved)="save($event)"
    />
  `,
})
export class KernProfileFormAgentExample {
  profile: KrnProfileValue = {
    name: 'Ada Lovelace',
    role: 'Platform administrator',
    bio: 'Owns customer-platform operations.',
    timezone: 'Europe/London',
  };

  readonly timezones: readonly { readonly value: string; readonly label: string }[] = [
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Berlin', label: 'Berlin' },
  ];

  saving = false;

  save(value: KrnProfileValue): void {
    this.profile = value;
    this.saving = true;
  }
}

void bootstrapApplication(KernProfileFormAgentExample);
```

## API

| Name             | Kind   | Type                                                                 | Required | Default                                            | Description                                                          |
| ---------------- | ------ | -------------------------------------------------------------------- | -------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `value`          | input  | `KrnProfileValue`                                                    | no       | `{ name: '', role: '', bio: '', timezone: 'UTC' }` | Controlled component value.                                          |
| `timezones`      | input  | `ReadonlyArray<{ readonly value: string; readonly label: string; }>` | no       | `this.translations.patterns.profileTimezones`      | Ordered domain values supplied to the timezone collection.           |
| `saving`         | input  | `boolean`                                                            | no       | `false`                                            | Exposes an in-progress save state and prevents duplicate submission. |
| `dirtyMessage`   | input  | `string`                                                             | no       | `this.translations.patterns.unsavedChanges`        | Human-readable copy for the dirty state or control.                  |
| `nameLabel`      | input  | `string`                                                             | no       | `this.translations.patterns.displayName`           | Human-readable copy for the name state or control.                   |
| `nameErrorLabel` | input  | `string`                                                             | no       | `this.translations.patterns.displayNameRequired`   | Human-readable copy for the name error state or control.             |
| `roleLabel`      | input  | `string`                                                             | no       | `this.translations.patterns.role`                  | Human-readable copy for the role state or control.                   |
| `bioLabel`       | input  | `string`                                                             | no       | `this.translations.patterns.bio`                   | Human-readable copy for the bio state or control.                    |
| `bioMaxLength`   | input  | `number`                                                             | no       | `280`                                              | Maximum biography length enforced by the profile form pattern.       |
| `timezoneLabel`  | input  | `string`                                                             | no       | `this.translations.patterns.timezone`              | Human-readable copy for the timezone state or control.               |
| `savingLabel`    | input  | `string`                                                             | no       | `this.translations.patterns.saving`                | Human-readable copy for the saving state or control.                 |
| `saveLabel`      | input  | `string`                                                             | no       | `this.translations.patterns.saveProfile`           | Human-readable copy for the save state or control.                   |
| `saved`          | output | `KrnProfileValue`                                                    | no       | `undefined`                                        | Notifies the consumer after the saved interaction completes.         |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- No custom keyboard behavior unless the composition is interactive
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.
- Uses the shared deterministic KERN id service.

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
- loading
- empty
- error
- success

## Related

- `user-menu`
- `notification-center`
- `global-search`
- `filter-bar`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
