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

## Deprecated selectors

_No deprecated selectors._

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

## Interactive playground

Route: `preview/stepper`

Scenarios: `default`.
Public API coverage: 3/7
directly controlled; 4 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default        | Test value   | Binding                        | Description                                                                               |
| ------------- | ------- | -------------- | ------------ | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `activeStep`  | number  | `1`            | `2`          | model `activeStep`             | Changes the currently active step.                                                        |
| `linear`      | boolean | `false`        | `true`       | input `linear` (property)      | Configures the component linear contract.                                                 |
| `orientation` | select  | `"horizontal"` | `"vertical"` | input `orientation` (property) | Logical axis exposed by the component; behavior follows its documented keyboard contract. |

Exact API exclusions:

| Public API       | Category           | Evidence                                             | Reason                                                                                                                                                               |
| ---------------- | ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`      | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#stepper` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `completedSteps` | complex-data       | `specimen-fixture:preview/stepper?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |
| `optionalLabel`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#stepper` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `steps`          | complex-data       | `specimen-fixture:preview/stepper?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — Hover; scenario `default`; visual state `hover`.
- `focus-visible` — Focus visible; scenario `default`; visual state `focus-visible`.
- `active` — Active; scenario `default`; visual state `active`.
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `current` — current; scenario `default`; fixture effect `status/neutral` — current: The fixture exposes the current status without claiming a public component input..

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
