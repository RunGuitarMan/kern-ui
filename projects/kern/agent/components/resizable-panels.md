# Resizable Panels

- ID: `resizable-panels`
- Selector: `krn-resizable-panels`
- Import: `import { KrnResizablePanels } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnResizablePanels`
- Lifecycle: **experimental**
- Category: Layout

Resizable Panels. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use Resizable Panels when adjacent workspace regions need a persisted user-adjustable size within explicit minimum and maximum bounds.

Avoid: Use Split Layout when regions should follow responsive rules without direct manipulation.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled resizable workspace
 *
 * Compose panels and a keyboard-operable resize handle with owned sizes.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnResizablePanel, KrnResizablePanels, KrnResizeHandle } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-resizable-panels-agent-example',
  standalone: true,
  imports: [KrnResizablePanels, KrnResizablePanel, KrnResizeHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-resizable-panels [(sizes)]="panelSizes" orientation="horizontal">
      <krn-resizable-panel id="customer-list" ariaLabel="Customer list">
        Customer list
      </krn-resizable-panel>
      <krn-resize-handle ariaLabel="Resize customer list and details" />
      <krn-resizable-panel id="customer-detail" ariaLabel="Customer details">
        Customer details
      </krn-resizable-panel>
    </krn-resizable-panels>
  `,
})
export class KernResizablePanelsAgentExample {
  panelSizes: readonly number[] = [38, 62];
}

void bootstrapApplication(KernResizablePanelsAgentExample);
```

## API

| Name          | Kind   | Type                    | Required | Default        | Description                                                                |
| ------------- | ------ | ----------------------- | -------- | -------------- | -------------------------------------------------------------------------- |
| `orientation` | input  | `KrnLayoutAxis`         | no       | `'horizontal'` | Defines the logical axis used by layout and keyboard navigation.           |
| `sizes`       | model  | `ReadonlyArray<number>` | no       | `[]`           | Controlled sizes state with a matching Angular model-change output.        |
| `step`        | input  | `number`                | no       | `2`            | Increment applied by keyboard and pointer value adjustments.               |
| `disabled`    | input  | `boolean`               | no       | `false`        | Prevents user interaction and participates in the disabled-state contract. |
| `resizeEnd`   | output | `ReadonlyArray<number>` | no       | `undefined`    | Notifies the consumer after the resize end interaction completes.          |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys adjust the focused separator by the configured step and respect orientation and RTL.
- Home and End move to the minimum and maximum allowed size.
- Enter or Space toggles the documented collapsed size when collapse is enabled.
- The handle exposes separator orientation, value minimum, maximum, current value, and disabled state.
- The separator has an explicit localized accessible name.
- Pointer and keyboard changes use the same clamped size model.

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
- disabled
- handle hover
- handle focus-visible
- minimum size
- maximum size
- collapsed
- expanded

## Interactive playground

Route: `preview/resizable-panels`

Scenarios: `default`.
Public API coverage: 3/4
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument      | Control | Default        | Test value   | Binding                        | Description                                    |
| ------------- | ------- | -------------- | ------------ | ------------------------------ | ---------------------------------------------- |
| `disabled`    | boolean | `false`        | `true`       | input `disabled` (property)    | Disables pointer and keyboard resizing.        |
| `step`        | number  | `5`            | `6`          | input `step` (property)        | Sets the keyboard resize increment.            |
| `orientation` | select  | `"horizontal"` | `"vertical"` | input `orientation` (property) | Configures the component orientation contract. |

Exact API exclusions:

| Public API | Category     | Evidence                                                  | Reason                                                                                                                  |
| ---------- | ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `sizes`    | complex-data | `specimen-fixture:preview/resizable-panels?state=default` | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.
- `handle-hover` — handle hover; scenario `default`; fixture effect `layout/constrained` — handle hover: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `handle-focus-visible` — handle focus-visible; scenario `default`; fixture effect `layout/constrained` — handle focus-visible: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `minimum-size` — minimum size; scenario `default`; fixture effect `layout/constrained` — minimum size: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `maximum-size` — maximum size; scenario `default`; fixture effect `layout/expanded` — maximum size: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `collapsed` — collapsed; scenario `default`; fixture effect `layout/constrained` — collapsed: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `expanded` — expanded; scenario `default`; fixture effect `layout/expanded` — expanded: The fixture uses an alternate deterministic boundary to expose layout behavior..

## Related

- `app-shell`
- `header`
- `sidebar`
- `navigation-rail`

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
