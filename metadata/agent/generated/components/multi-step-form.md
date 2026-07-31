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
| `stepCounterLabel`    | input  | `(current: number, total: number) => string` | no       | `this.translations.patterns.stepCounter`  | Human-readable copy for the step counter state or control.                  |
| `completed`           | output | `void`                                       | no       | `undefined`                               | Notifies the consumer after the completed interaction completes.            |

## Deprecated selectors

_No deprecated selectors._

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

## Interactive playground

Route: `preview/multi-step-form`

Scenarios: `default`.
Public API coverage: 4/11
directly controlled; 7 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument              | Control | Default        | Test value   | Binding                                | Description                                                                               |
| --------------------- | ------- | -------------- | ------------ | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `current`             | number  | `0`            | `1`          | model `current`                        | Changes the current form step.                                                            |
| `furthestStep`        | number  | `0`            | `1`          | model `furthestStep`                   | Changes the furthest completed or visited step.                                           |
| `allowStepNavigation` | boolean | `true`         | `false`      | input `allowStepNavigation` (property) | Configures the component allowStepNavigation contract.                                    |
| `orientation`         | select  | `"horizontal"` | `"vertical"` | input `orientation` (property)         | Logical axis exposed by the component; behavior follows its documented keyboard contract. |

Exact API exclusions:

| Public API         | Category           | Evidence                                                              | Reason                                                                                                                                                               |
| ------------------ | ------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`        | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#multi-step-form`          | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `backLabel`        | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#multi-step-form`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `completeLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#multi-step-form`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `continueLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#multi-step-form`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `optionalLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#multi-step-form`          | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `stepCounterLabel` | callback           | `component-example:agent/components/multi-step-form.json#/examples/0` | Callback inputs require executable application code and are covered by the typed specimen fixture.                                                                   |
| `steps`            | complex-data       | `specimen-fixture:preview/multi-step-form?state=default`              | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                              |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `data/alternate` — overflow: The fixture data projection is changed for this acceptance state..
- `long-text` — long text; scenario `default`; fixture effect `data/alternate` — long text: The fixture data projection is changed for this acceptance state..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `loading` — loading; scenario `default`; fixture effect `data/loading` — loading: The fixture is waiting for enterprise data..
- `empty` — empty; scenario `default`; fixture effect `data/empty` — empty: The fixture data source returned no records..
- `error` — error; scenario `default`; fixture effect `data/error` — error: The fixture data request failed and can be retried..
- `success` — success; scenario `default`; fixture effect `data/success` — success: The fixture operation completed successfully..

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
