# Multi Step Form

- ID: `multi-step-form`
- Selector: `krn-multi-step-form`
- Import: `import { KrnMultiStepForm } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnMultiStepForm`
- Lifecycle: **recipe**
- Category: Patterns

Multi Step Form. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled typed onboarding form
 *
 * Supply required typed steps and own current and furthest progress.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMultiStepForm, type KrnFormStep } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-multi-step-form-agent-example',
  standalone: true,
  imports: [KrnMultiStepForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-multi-step-form
      ariaLabel="Customer onboarding"
      [steps]="steps"
      [(current)]="currentStep"
      [(furthestStep)]="furthestStep"
    >
      <p>Complete the current onboarding section.</p>
    </krn-multi-step-form>
  `,
})
export class KernMultiStepFormAgentExample {
  readonly steps: readonly KrnFormStep[] = [
    { id: 'company', label: 'Company', valid: true },
    { id: 'owners', label: 'Owners', valid: false },
    { id: 'review', label: 'Review', optional: true },
  ];

  currentStep = 1;

  furthestStep = 1;
}

void bootstrapApplication(KernMultiStepFormAgentExample);
```

## API

| Name                  | Kind   | Type                                         | Required | Default                                   | Description                                                                 |
| --------------------- | ------ | -------------------------------------------- | -------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `steps`               | input  | `ReadonlyArray<KrnFormStep>`                 | yes      | `required`                                | Ordered domain values supplied to the step collection.                      |
| `current`             | model  | `number`                                     | no       | `0`                                       | Controlled current state with a matching Angular model-change output.       |
| `furthestStep`        | model  | `number`                                     | no       | `0`                                       | Controlled furthest step state with a matching Angular model-change output. |
| `allowStepNavigation` | input  | `boolean`                                    | no       | `true`                                    | Controls whether the component applies the allow step navigation behavior.  |
| `orientation`         | input  | `"horizontal" \| "vertical"`                 | no       | `'horizontal'`                            | Defines the logical axis used by layout and keyboard navigation.            |
| `completeLabel`       | input  | `string`                                     | no       | `this.translations.patterns.complete`     | Human-readable copy for the complete state or control.                      |
| `ariaLabel`           | input  | `string`                                     | no       | `this.translations.patterns.formProgress` | Accessible name used when visible content is not sufficient.                |
| `optionalLabel`       | input  | `string`                                     | no       | `this.translations.patterns.optional`     | Human-readable copy for the optional state or control.                      |
| `backLabel`           | input  | `string`                                     | no       | `this.translations.patterns.back`         | Human-readable copy for the back state or control.                          |
| `continueLabel`       | input  | `string`                                     | no       | `this.translations.patterns.continue`     | Human-readable copy for the continue state or control.                      |
| `emptyStepLabel`      | input  | `string`                                     | no       | `this.translations.patterns.step`         | Human-readable copy for the empty step state or control.                    |
| `stepCounterLabel`    | input  | `(current: number, total: number) => string` | no       | `this.translations.patterns.stepCounter`  | Human-readable copy for the step counter state or control.                  |
| `completed`           | output | `void`                                       | no       | `undefined`                               | Notifies the consumer after the completed interaction completes.            |

## Content slots

- `*` — Projects default component content.

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

- Do not omit required inputs: `steps`.
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
