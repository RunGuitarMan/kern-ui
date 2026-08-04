# Accordion

- ID: `accordion`
- Selector: `krn-accordion`
- Import: `import { KrnAccordion } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnAccordion`
- Lifecycle: **stable**
- Category: Data display

Accordion. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Account policy accordion
 *
 * Group independently controlled disclosures under one accessible label.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnAccordion, KrnDisclosure } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-accordion-agent-example',
  standalone: true,
  imports: [KrnAccordion, KrnDisclosure],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-accordion ariaLabel="Account policies">
      <krn-disclosure heading="Data residency" [(open)]="dataResidencyOpen">
        Customer data is stored in the EU Central region.
      </krn-disclosure>
      <krn-disclosure heading="Retention"
        >Audit records are retained for seven years.</krn-disclosure
      >
    </krn-accordion>
  `,
})
export class KernAccordionAgentExample {
  dataResidencyOpen = true;
}

void bootstrapApplication(KernAccordionAgentExample);
```

## API

| Name        | Kind  | Type                  | Required | Default     | Description                                                  |
| ----------- | ----- | --------------------- | -------- | ----------- | ------------------------------------------------------------ |
| `ariaLabel` | input | `string \| undefined` | no       | `undefined` | Accessible name used when visible content is not sufficient. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
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

## Interactive playground

Route: `preview/accordion`

Scenarios: `default`.
Public API coverage: 0/1
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default | Test value | Binding             | Description                                            |
| ---------- | ------- | ------- | ---------- | ------------------- | ------------------------------------------------------ |
| `expanded` | boolean | `false` | `true`     | fixture interaction | Expands the first disclosure in the accordion fixture. |

Exact API exclusions:

| Public API  | Category           | Evidence                                               | Reason                                                                                                                  |
| ----------- | ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#accordion` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

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
