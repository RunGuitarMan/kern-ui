# Stepper

- ID: `stepper`
- Selector: `krn-stepper`
- Import: `import { KrnStepper } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnStepper`
- Lifecycle: **stable**
- Category: Navigation

Stepper. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled onboarding progress
 *
 * Drive a linear multi-step flow with typed immutable steps.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnStepper, type KrnStepItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-stepper-agent-example',
  standalone: true,
  imports: [KrnStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-stepper
      ariaLabel="Customer onboarding progress"
      [steps]="steps"
      [linear]="true"
      [completedSteps]="completedSteps"
      [(activeStep)]="activeStep"
    />
  `,
})
export class KernStepperAgentExample {
  readonly steps: readonly KrnStepItem[] = [
    { id: 'company', label: 'Company' },
    { id: 'owners', label: 'Owners' },
    { id: 'review', label: 'Review' },
  ];

  completedSteps: readonly number[] = [0];

  activeStep = 1;
}

void bootstrapApplication(KernStepperAgentExample);
```

## API

| Name             | Kind  | Type                         | Required | Default                                 | Description                                                               |
| ---------------- | ----- | ---------------------------- | -------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `steps`          | input | `ReadonlyArray<KrnStepItem>` | no       | `[]`                                    | Ordered domain values supplied to the step collection.                    |
| `activeStep`     | model | `number`                     | no       | `0`                                     | Controlled active step state with a matching Angular model-change output. |
| `completedSteps` | input | `ReadonlyArray<number>`      | no       | `[]`                                    | Ordered domain values supplied to the completed step collection.          |
| `linear`         | input | `boolean`                    | no       | `false`                                 | Requires step completion in order and prevents skipping incomplete steps. |
| `orientation`    | input | `KrnNavigationOrientation`   | no       | `'horizontal'`                          | Defines the logical axis used by layout and keyboard navigation.          |
| `ariaLabel`      | input | `string`                     | no       | `this.translations.navigation.progress` | Accessible name used when visible content is not sufficient.              |
| `optionalLabel`  | input | `string`                     | no       | `this.translations.navigation.optional` | Human-readable copy for the optional state or control.                    |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys move within composites
- Home / End jump
- Enter activates
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
- current

## Related

- `breadcrumbs`
- `tabs`
- `vertical-tabs`
- `pagination`

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
