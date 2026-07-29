# Login Form

- ID: `login-form`
- Selector: `krn-login-form`
- Import: `import { KrnLoginForm } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnLoginForm`
- Lifecycle: **recipe**
- Category: Patterns

Login Form. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed enterprise sign-in form
 *
 * Handle typed submitted credentials and loading state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLoginForm, type KrnLoginCredentials } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-login-form-agent-example',
  standalone: true,
  imports: [KrnLoginForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-login-form
      recoveryHref="/recover-access"
      [loading]="submitting"
      (submitted)="submit($event)"
    />
  `,
})
export class KernLoginFormAgentExample {
  submitting = false;

  lastSubmission: KrnLoginCredentials | null = null;

  submit(credentials: KrnLoginCredentials): void {
    this.lastSubmission = credentials;
    this.submitting = true;
  }
}

void bootstrapApplication(KernLoginFormAgentExample);
```

## API

| Name                    | Kind   | Type                                | Required | Default                                            | Description                                                      |
| ----------------------- | ------ | ----------------------------------- | -------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `loading`               | input  | `boolean`                           | no       | `false`                                            | Prevents duplicate actions and exposes accessible busy state.    |
| `errorMessage`          | input  | `string`                            | no       | `''`                                               | Human-readable copy for the error state or control.              |
| `recoveryHref`          | input  | `string`                            | no       | `''`                                               | Destination URL for the error-state recovery action.             |
| `submitLabel`           | input  | `string`                            | no       | `this.translations.patterns.signIn`                | Human-readable copy for the submit state or control.             |
| `emailLabel`            | input  | `string`                            | no       | `this.translations.patterns.email`                 | Human-readable copy for the email state or control.              |
| `emailErrorLabel`       | input  | `string`                            | no       | `this.translations.patterns.invalidEmail`          | Human-readable copy for the email error state or control.        |
| `passwordLabel`         | input  | `string`                            | no       | `this.translations.patterns.password`              | Human-readable copy for the password state or control.           |
| `passwordErrorLabel`    | input  | `(minimumLength: number) => string` | no       | `this.translations.patterns.minimumPasswordLength` | Human-readable copy for the password error state or control.     |
| `rememberLabel`         | input  | `string`                            | no       | `this.translations.patterns.rememberMe`            | Human-readable copy for the remember state or control.           |
| `recoveryLabel`         | input  | `string`                            | no       | `this.translations.patterns.forgotPassword`        | Human-readable copy for the recovery state or control.           |
| `loadingLabel`          | input  | `string`                            | no       | `this.translations.patterns.signingIn`             | Human-readable copy for the loading state or control.            |
| `minimumPasswordLength` | input  | `number`                            | no       | `8`                                                | Upper or lower bound applied to the password length value.       |
| `submitted`             | output | `KrnLoginCredentials`               | no       | `undefined`                                        | Notifies the consumer after the submitted interaction completes. |

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
