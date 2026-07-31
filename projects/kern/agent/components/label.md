# Label

- ID: `label`
- Selector: `krn-label`
- Import: `import { KrnLabel } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnLabel`
- Lifecycle: **stable**
- Category: Forms

Label. Gives a form control its visible accessible name without owning a value, list, or popup.

## Use

Use it to name an input, select, textarea, or other labelable form control.

Avoid: Do not use Label as a picker; it has no selection behavior of its own.

## Compile-verified standalone Angular example

```ts
/**
 * Visible required field label
 *
 * Associate visible copy with its native control.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLabel } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-label-agent-example',
  standalone: true,
  imports: [KrnLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-label for="department" [required]="true">Department</krn-label>
    <input id="department" name="department" required />
  `,
})
export class KernLabelAgentExample {}

void bootstrapApplication(KernLabelAgentExample);
```

## API

| Name       | Kind  | Type      | Required | Default | Description                                                               |
| ---------- | ----- | --------- | -------- | ------- | ------------------------------------------------------------------------- |
| `for`      | input | `string`  | no       | `''`    | Id of the labelable control associated with this label.                   |
| `required` | input | `boolean` | no       | `false` | Marks the value as required and participates in Angular Forms validation. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Click moves focus to the associated control
- The label itself is not a tab stop
- The for value resolves to exactly one control id.
- Required state is visible but is not communicated by color alone.
- Use a fieldset and legend instead when naming a group of related controls.

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
- required

## Interactive playground

Route: `preview/label`

Scenarios: `default`.
Public API coverage: 1/2
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default | Test value | Binding                     | Description                    |
| ---------- | ------- | ------- | ---------- | --------------------------- | ------------------------------ |
| `required` | boolean | `true`  | `false`    | input `required` (property) | Marks the control as required. |

Exact API exclusions:

| Public API | Category   | Evidence                                           | Reason                                                                                                        |
| ---------- | ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `for`      | dom-wiring | `a11y-test:tests/a11y/accessibility.spec.ts#label` | DOM identity/focus wiring must stay deterministic so labels, overlays, and hydration references remain valid. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `required` — required; scenario `default`; `required=true`; fixture effect `status/neutral` — required: The fixture exposes the required status without claiming a public component input..
- `optional` — Optional; scenario `default`; `required=false`.

## Related

- `form-field`
- `hint`
- `validation-message`
- `text-input`

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
