# Button Group

- ID: `button-group`
- Selector: `div[krnButtonGroup]`
- Import: `import { KrnButtonGroup } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnButtonGroup`
- Lifecycle: **stable**
- Category: Actions

Button Group. Labels and arranges independent native actions without owning their focus, activation, disabled, loading, or selection state.

## Use

Use <div krnButtonGroup aria-label="Review actions"> for a small set of related, independent native actions.

Avoid: Do not add Arrow-key navigation, selected state, or group-level disabled/loading behavior; use Toggle Group or Segmented Control when the group must own a choice.

## Compile-verified standalone Angular example

```ts
/**
 * Grouped review actions
 *
 * Present independent native actions as one labeled visual group.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnButton, KrnButtonGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-button-group-agent-example',
  standalone: true,
  imports: [KrnButtonGroup, KrnButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div krnButtonGroup aria-label="Review actions">
      <button krnButton type="button" variant="outline">Request changes</button>
      <button krnButton type="button">Approve</button>
    </div>
  `,
})
export class KernButtonGroupAgentExample {}

void bootstrapApplication(KernButtonGroupAgentExample);
```

## API

| Name          | Kind  | Type             | Required | Default                    | Description                                                                              |
| ------------- | ----- | ---------------- | -------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| `orientation` | input | `KrnOrientation` | no       | `this.options.orientation` | Changes the visual layout axis without altering native document-order keyboard behavior. |
| `connected`   | input | `boolean`        | no       | `this.options.connected`   | Joins adjacent action borders and radii without coordinating child state or activation.  |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab visits each enabled native action in document order
- Enter and Space activate the focused native button
- Orientation and connected styling do not add Arrow-key navigation or a roving tab stop
- The canonical <div krnButtonGroup> host exposes role="group" and uses native aria-label or aria-labelledby for its accessible name.
- Each child action owns its native accessible name, disabled, loading, form, and activation semantics.
- Button Group does not expose selection; use Toggle Group or Segmented Control for a managed choice.

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
- connected

## Interactive playground

Route: `preview/button-group`

Scenarios: `default`.
Public API coverage: 2/2
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default        | Test value   | Binding                        | Description                                                                             |
| ------------- | ------- | -------------- | ------------ | ------------------------------ | --------------------------------------------------------------------------------------- |
| `orientation` | select  | `"horizontal"` | `"vertical"` | input `orientation` (property) | Changes only the visual layout; native actions keep document-order keyboard navigation. |
| `connected`   | boolean | `false`        | `true`       | input `connected` (property)   | Joins adjacent action borders without changing their semantics or keyboard order.       |

Exact API exclusions:

_No excluded public API members._

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `connected` — Connected; scenario `default`; `connected=true`.

## Related

- `button`
- `icon-button`
- `toggle-group`
- `segmented-control`
- `split-button`
- `floating-action-button`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use div[krnButtonGroup] with a native aria-label or aria-labelledby; orientation and connected change layout only, while each child action keeps its own native semantics and Tab stop.
- Do not add group-level disabled, loading, selection, or Arrow-key behavior; use Toggle Group or Segmented Control when the composition must own a managed choice.
- Use provideKrnButtonGroupOptions for inheritable orientation or connected defaults; keep accessible naming and child interaction state explicit at the call site.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
