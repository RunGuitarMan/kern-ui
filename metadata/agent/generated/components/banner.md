# Banner

- ID: `banner`
- Selector: `krn-banner`
- Import: `import { KrnBanner } from '@kern-ui/angular/feedback';`
- Canonical symbol: `KrnBanner`
- Lifecycle: **stable**
- Category: Feedback

Banner. Shows an Alert across the page as a banner. For new work, use Alert with banner placement.

## Use

Use Banner for this specific contract: Shows an Alert across the page as a banner. For new work, use Alert with banner placement.

Avoid: Do not choose Banner for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Dismissible system banner
 *
 * Present a page-wide operational message with explicit tone.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnBanner } from '@kern-ui/angular/feedback';

@Component({
  selector: 'app-kern-banner-agent-example',
  standalone: true,
  imports: [KrnBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-banner tone="info" title="Scheduled maintenance" [dismissible]="true">
      Reporting will be read-only from 22:00 to 23:00 UTC.
    </krn-banner>
  `,
})
export class KernBannerAgentExample {}

void bootstrapApplication(KernBannerAgentExample);
```

## API

| Name           | Kind   | Type                  | Required | Default     | Description                                                                      |
| -------------- | ------ | --------------------- | -------- | ----------- | -------------------------------------------------------------------------------- |
| `tone`         | input  | `KrnFeedbackTone`     | no       | `'info'`    | Semantic intent that selects coordinated text, icon, border, and surface tokens. |
| `appearance`   | input  | `KrnAlertAppearance`  | no       | `'subtle'`  | Selects the alert surface treatment without changing its semantic tone.          |
| `placement`    | input  | `KrnAlertPlacement`   | no       | `'banner'`  | Places the message inline or stretches it into a page-level banner treatment.    |
| `title`        | input  | `string`              | no       | `''`        | Visible title that also names the component surface or data view.                |
| `icon`         | input  | `string`              | no       | `''`        | Defines the component's icon behavior or presentation.                           |
| `dismissible`  | input  | `boolean`             | no       | `false`     | Defines the component's dismissible behavior or presentation.                    |
| `dismissLabel` | input  | `string \| undefined` | no       | `undefined` | Human-readable copy for the dismiss state or control.                            |
| `closed`       | output | `void`                | no       | `undefined` | Notifies the consumer after the closed interaction completes.                    |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnAlertIcon]` — Projects content matching [krnAlertIcon].
- `*` — Projects default component content.
- `[krnAlertAction]` — Projects content matching [krnAlertAction].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Visible copy and semantic role communicate feedback independently of color or motion.
- Announcements use only the urgency required by the message.

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

## Interactive playground

Route: `preview/banner`

Scenarios: `default`.
Public API coverage: 4/7
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default                   | Test value                            | Binding                        | Description                                                                      |
| ------------- | ------- | ------------------------- | ------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `dismissible` | boolean | `false`                   | `true`                                | input `dismissible` (property) | Shows the dismiss action.                                                        |
| `icon`        | text    | `""`                      | `"Alternate value"`                   | input `icon` (property)        | Defines the component's icon behavior or presentation.                           |
| `title`       | text    | `"Scheduled maintenance"` | `"Scheduled maintenance · alternate"` | input `title` (property)       | Visible title that also names the component surface or data view.                |
| `tone`        | select  | `"info"`                  | `"neutral"`                           | input `tone` (property)        | Semantic intent that selects coordinated text, icon, border, and surface tokens. |

Exact API exclusions:

| Public API     | Category           | Evidence                                            | Reason                                                                                                                                                               |
| -------------- | ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appearance`   | complex-data       | `specimen-fixture:preview/banner?state=default`     | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                     |
| `dismissLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#banner` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `placement`    | complex-data       | `specimen-fixture:preview/banner?state=default`     | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                                                                     |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `dismissible` — Dismissible; scenario `default`; `dismissible=true`.

## Related

- `alert`
- `toast`
- `tooltip`
- `popover`

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
