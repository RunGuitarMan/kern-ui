# Split Layout

- ID: `split-layout`
- Selector: `krn-split-layout`
- Import: `import { KrnSplitLayout } from '@kern-ui/angular/layout';`
- Canonical symbol: `KrnSplitLayout`
- Lifecycle: **stable**
- Category: Layout

Split Layout. Places two panels in a configurable ratio and stacks them below a container breakpoint.

## Use

Use Split Layout for this specific contract: Places two panels in a configurable ratio and stacks them below a container breakpoint.

Avoid: Do not choose Split Layout for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Master and supporting content
 *
 * Compose a responsive primary and secondary column.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnSplitLayout } from '@kern-ui/angular/layout';

@Component({
  selector: 'app-kern-split-layout-agent-example',
  standalone: true,
  imports: [KrnSplitLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-split-layout ratio="2fr 1fr" collapseAt="md">
      <main krnSplitPrimary>
        <h1>Account health</h1>
        <p>Primary analysis and recent activity.</p>
      </main>
      <aside krnSplitSecondary>Owner and renewal details</aside>
    </krn-split-layout>
  `,
})
export class KernSplitLayoutAgentExample {}

void bootstrapApplication(KernSplitLayoutAgentExample);
```

## API

| Name         | Kind  | Type                                        | Required | Default   | Description                                                                                   |
| ------------ | ----- | ------------------------------------------- | -------- | --------- | --------------------------------------------------------------------------------------------- |
| `ratio`      | input | `KrnSplitRatio`                             | no       | `'1:1'`   | Sets the relative primary-to-secondary track sizes. Accepts presets, `3:2`, or `3fr 2fr`.     |
| `gap`        | input | `KrnLayoutSpace`                            | no       | `'6'`     | Sets the space between the two panels using a spacing token, number of pixels, or CSS length. |
| `collapseAt` | input | `KrnResponsiveBreakpoint`                   | no       | `'md'`    | Stacks the panels when the split layout's inline size reaches the selected breakpoint.        |
| `align`      | input | `"center" \| "end" \| "start" \| "stretch"` | no       | `'start'` | Aligns the panels within the split layout's block axis.                                       |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `[krnSplitPrimary]` — Projects content matching [krnSplitPrimary].
- `[krnSplitSecondary]` — Projects content matching [krnSplitSecondary].

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- The component adds no keyboard interaction or tab stop of its own
- Projected content retains its document order and native semantics as layout changes.
- Logical sizing and placement work in both LTR and RTL without duplicating content.

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

Route: `preview/split-layout`

Scenarios: `default`.
Public API coverage: 4/4
directly controlled; 0 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument     | Control | Default   | Test value | Binding                       | Description                                                                            |
| ------------ | ------- | --------- | ---------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `ratio`      | select  | `"1:2"`   | `"1:1"`    | input `ratio` (property)      | Changes the primary-to-secondary pane ratio.                                           |
| `gap`        | text    | `"4"`     | `"20rem"`  | input `gap` (property)        | Sets the separation between panes.                                                     |
| `align`      | select  | `"start"` | `"center"` | input `align` (property)      | Aligns the panels within the split layout's block axis.                                |
| `collapseAt` | select  | `"md"`    | `"none"`   | input `collapseAt` (property) | Stacks the panels when the split layout's inline size reaches the selected breakpoint. |

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
