# Toggle Group

- ID: `toggle-group`
- Selector: `div[krnToggleGroup]`
- Import: `import { KrnToggleGroup } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnToggleGroup`
- Lifecycle: **stable**
- Category: Actions

Toggle Group. Coordinates stable pressed values across native toggle buttons in a labelled, orientation-aware action toolbar.

## Use

Use <div krnToggleGroup aria-label="Formatting"> with direct native Toggle Button children and stable unique values.

Avoid: Do not use Toggle Group as an Angular form radio control or project arbitrary links and labels; use Radio Group or Segmented Control for a mandatory exclusive choice.

## Compile-verified standalone Angular example

```ts
/**
 * Multi-select view controls
 *
 * Control a set of pressed view options by stable string values.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnToggleButton, KrnToggleGroup } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-toggle-group-agent-example',
  standalone: true,
  imports: [KrnToggleGroup, KrnToggleButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      krnToggleGroup
      aria-label="Visible dashboard layers"
      [multiple]="true"
      [(values)]="visibleLayers"
    >
      <button krnToggleButton value="targets">Targets</button>
      <button krnToggleButton value="forecast">Forecast</button>
    </div>
  `,
})
export class KernToggleGroupAgentExample {
  visibleLayers: readonly string[] = ['targets'];
}

void bootstrapApplication(KernToggleGroupAgentExample);
```

## API

| Name          | Kind  | Type                    | Required | Default                    | Description                                                                         |
| ------------- | ----- | ----------------------- | -------- | -------------------------- | ----------------------------------------------------------------------------------- |
| `orientation` | input | `KrnOrientation`        | no       | `this.options.orientation` | Defines both the visual layout axis and the toolbar Arrow-key axis.                 |
| `size`        | input | `KrnSize`               | no       | `'sm'`                     | Controls the density of every direct toggle without repeating size on each item.    |
| `connected`   | input | `boolean`               | no       | `true`                     | Joins direct toggles into a single segmented control surface.                       |
| `multiple`    | input | `boolean`               | no       | `this.options.multiple`    | Allows multiple pressed values; false exposes at most one effective pressed value.  |
| `disabled`    | input | `boolean`               | no       | `false`                    | Disables every registered native toggle and all group-owned value transitions.      |
| `values`      | model | `ReadonlyArray<string>` | no       | `[]`                       | Controlled stable string values; user transitions always emit a fresh frozen array. |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab enters or leaves the toolbar through one remembered roving tab stop
- Arrow keys move focus on the configured axis without changing pressed state
- Home and End move focus to the first or last enabled toggle; navigation wraps and respects RTL
- Enter and Space activate only the focused native toggle button
- The canonical <div krnToggleGroup> host exposes role="toolbar", aria-orientation, and a native aria-label or aria-labelledby.
- Each direct <button krnToggleButton> retains its native accessible name, aria-pressed state, focus, and activation behavior.
- Group disabled state is reflected as aria-disabled on the toolbar and native disabled on every toggle button.
- Single mode exposes at most one effective pressed value; duplicate controlled values are canonicalized on the next user transition.

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
- selected
- unselected

## Interactive playground

Route: `preview/toggle-group`

Scenarios: `default`.
Public API coverage: 5/6
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default        | Test value   | Binding                        | Description                                                                         |
| ------------- | ------- | -------------- | ------------ | ------------------------------ | ----------------------------------------------------------------------------------- |
| `orientation` | select  | `"horizontal"` | `"vertical"` | input `orientation` (property) | Changes the visual layout and Arrow-key axis exposed by the toolbar.                |
| `size`        | select  | `"sm"`         | `"md"`       | input `size` (property)        | Changes the segmented control density.                                              |
| `connected`   | boolean | `true`         | `false`      | input `connected` (property)   | Joins toggles into one segmented surface.                                           |
| `multiple`    | boolean | `false`        | `true`       | input `multiple` (property)    | Allows more than one toggle to be selected.                                         |
| `disabled`    | boolean | `false`        | `true`       | input `disabled` (property)    | Disables every native toggle button while preserving perceivable toolbar semantics. |

Exact API exclusions:

| Public API | Category     | Evidence                                              | Reason                                                                                                                  |
| ---------- | ------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `values`   | complex-data | `specimen-fixture:preview/toggle-group?state=default` | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

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
- `selected` — selected; scenario `default`; fixture effect `status/neutral` — selected: The fixture exposes the selected status without claiming a public component input..
- `unselected` — unselected; scenario `default`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..
- `separated` — Separated; scenario `default`; `connected=false`.

## Related

- `toggle-button`
- `button-group`
- `radio-group`
- `segmented-control`
- `button`
- `icon-button`
- `split-button`

## Common mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use div[krnToggleGroup] with a native aria-label or aria-labelledby and direct button[krnToggleButton] children whose values are stable and unique.
- Arrow, Home, and End move focus without changing selection; activate the focused native button with Enter or Space.
- Use provideKrnToggleGroupOptions only for inheritable orientation and multiple defaults. Keep disabled and controlled values explicit at the instance.
- Use Radio Group or Segmented Control instead when an Angular form requires exactly one selected value.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
