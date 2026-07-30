# Link

- ID: `link`
- Selector: `krn-link`
- Import: `import { KrnLink } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnLink`
- Lifecycle: **stable**
- Category: Actions

Link. A deliberate action primitive with a consistent hierarchy, loading behavior, and keyboard contract.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * External audit documentation link
 *
 * Render a semantic link with safe external navigation metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnLink } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-link-agent-example',
  standalone: true,
  imports: [KrnLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-link href="https://example.com/audit-policy" target="_blank" rel="noopener noreferrer">
      Audit policy
    </krn-link>
  `,
})
export class KernLinkAgentExample {}

void bootstrapApplication(KernLinkAgentExample);
```

## API

| Name        | Kind   | Type            | Required | Default     | Description                                                                       |
| ----------- | ------ | --------------- | -------- | ----------- | --------------------------------------------------------------------------------- |
| `href`      | input  | `string`        | yes      | `required`  | Required destination URL used by the semantic link element.                       |
| `target`    | input  | `KrnLinkTarget` | no       | `'_self'`   | Native browsing-context target used when activating the link.                     |
| `rel`       | input  | `string`        | no       | `''`        | Native link relationship tokens applied to the destination.                       |
| `download`  | input  | `string`        | no       | `''`        | Enables native download behavior and optionally provides the downloaded filename. |
| `ariaLabel` | input  | `string`        | no       | `''`        | Accessible name used when visible content is not sufficient.                      |
| `disabled`  | input  | `boolean`       | no       | `false`     | Prevents user interaction and participates in the disabled-state contract.        |
| `activated` | output | `MouseEvent`    | no       | `undefined` | Notifies the consumer after the activated interaction completes.                  |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Enter / Space activates
- Tab follows document order
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

Route: `preview/link`

Scenarios: `default`.
Public API coverage: 5/6
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default          | Test value             | Binding                     | Description                                 |
| ---------- | ------- | ---------------- | ---------------------- | --------------------------- | ------------------------------------------- |
| `disabled` | boolean | `false`          | `true`                 | input `disabled` (property) | Prevents user interaction.                  |
| `download` | text    | `""`             | `"Alternate value"`    | input `download` (property) | Configures the component download contract. |
| `href`     | text    | `"/foundations"` | `"#specimen-overview"` | input `href` (property)     | Configures the component href contract.     |
| `rel`      | text    | `""`             | `"Alternate value"`    | input `rel` (property)      | Configures the component rel contract.      |
| `target`   | select  | `"_self"`        | `"_blank"`             | input `target` (property)   | Configures the component target contract.   |

Exact API exclusions:

| Public API  | Category           | Evidence                                          | Reason                                                                                                                  |
| ----------- | ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#link` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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
- `disabled` — Disabled; scenario `default`; `disabled=true`.

## Related

- `button`
- `icon-button`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `href`.
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
