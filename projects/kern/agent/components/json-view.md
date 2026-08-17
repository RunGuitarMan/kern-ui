# JSON View

- ID: `json-view`
- Selector: `krn-json-view`
- Import: `import { KrnJsonView } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnJsonView`
- Lifecycle: **beta**
- Category: Data display

JSON View. Renders structured JSON as a collapsible, searchable tree with typed syntax color and selectable text.

## Use

Use JSON View when users need to inspect structured application data while preserving hierarchy, value types, and copyable text.

Avoid: Use Code Block for an immutable source excerpt, and a purpose-built detail view when users must edit or act on individual fields.

## Compile-verified standalone Angular example

```ts
/**
 * Inspectable deployment payload
 *
 * Render structured JSON with accessible tree navigation and a highlighted field.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnJsonView } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-json-view-agent-example',
  standalone: true,
  imports: [KrnJsonView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-json-view
      ariaLabel="Deployment payload"
      [data]="payload"
      [defaultExpandDepth]="2"
      highlightPattern="active"
    />
  `,
})
export class KernJsonViewAgentExample {
  readonly payload = {
    deployment: { id: 'dep_01KERN', active: true, replicas: 3 },
    region: 'eu-central',
    error: null,
  } as const;
}

void bootstrapApplication(KernJsonViewAgentExample);
```

## API

| Name                 | Kind  | Type                            | Required | Default    | Description                                                                  |
| -------------------- | ----- | ------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `data`               | input | `KrnJsonValue`                  | yes      | `required` | JSON-compatible value rendered as an inspectable hierarchy.                  |
| `ariaLabel`          | input | `string`                        | no       | `'JSON'`   | Accessible name announced for the JSON tree.                                 |
| `defaultExpandDepth` | input | `number`                        | no       | `2`        | Number of hierarchy levels expanded when data first renders.                 |
| `expandedPaths`      | model | `ReadonlyArray<string> \| null` | no       | `null`     | Controlled JSON-pointer paths, or null to keep expansion state internal.     |
| `highlightPattern`   | input | `RegExp \| string \| null`      | no       | `null`     | Text or regular expression highlighted in visible keys and primitive values. |
| `sortKeys`           | input | `boolean`                       | no       | `false`    | Sorts object keys with locale-aware comparison while preserving array order. |
| `wrap`               | input | `boolean`                       | no       | `true`     | Allows long keys and values to wrap inside the viewport.                     |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow Up and Arrow Down move the single roving focus through visible properties.
- Arrow Right expands or enters a branch; Arrow Left collapses it or returns to its parent.
- Home and End move to the first and last visible property; Enter or Space toggles a branch.
- The tree exposes each visible property's hierarchy, sibling position, and expansion state.
- Keys and typed primitive values remain text, so syntax color is never the only representation.
- Highlighting uses a visible mark treatment without replacing the underlying accessible text.

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
- collapsed
- expanded
- highlighted
- wrapped

## Interactive playground

Route: `preview/json-view`

Scenarios: `default`.
Public API coverage: 4/7
directly controlled; 3 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument             | Control | Default | Test value          | Binding                               | Description                                                        |
| -------------------- | ------- | ------- | ------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `defaultExpandDepth` | number  | `2`     | `3`                 | input `defaultExpandDepth` (property) | Sets how many JSON hierarchy levels open initially.                |
| `highlightPattern`   | text    | `""`    | `"Alternate value"` | input `highlightPattern` (property)   | Highlights matching text; an empty value leaves the JSON unmarked. |
| `sortKeys`           | boolean | `false` | `true`              | input `sortKeys` (property)           | Sorts object keys alphabetically.                                  |
| `wrap`               | boolean | `true`  | `false`             | input `wrap` (property)               | Wraps long keys and values inside the viewport.                    |

Exact API exclusions:

| Public API      | Category           | Evidence                                               | Reason                                                                                                                  |
| --------------- | ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`     | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#json-view` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `data`          | complex-data       | `specimen-fixture:preview/json-view?state=default`     | The public type is not a lossless scalar/literal contract and requires a typed specimen fixture.                        |
| `expandedPaths` | complex-data       | `specimen-fixture:preview/json-view?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

Presets:

- `default` — Default; scenario `default`.
- `overflow` — overflow; scenario `default`; fixture effect `layout/overflow` — overflow: The fixture deliberately exceeds its normal inline size to expose overflow behavior..
- `long-text` — long text; scenario `default`; fixture effect `content/long-text` — long text: Northstar enterprise workspace policy configuration with deliberately extended content for wrapping and truncation verification..
- `dark` — Dark; scenario `default`; theme `dark`.
- `high-contrast` — High contrast; scenario `default`; theme `high-contrast`.
- `compact` — Compact; scenario `default`; density `compact`.
- `rtl` — RTL; scenario `default`; direction `rtl`.
- `mobile` — Mobile; scenario `default`; viewport `phone`.
- `hover` — hover; scenario `default`; fixture effect `status/neutral` — hover: The fixture exposes the hover status without claiming a public component input..
- `focus-visible` — focus-visible; scenario `default`; fixture effect `status/neutral` — focus-visible: The fixture exposes the focus visible status without claiming a public component input..
- `active` — active; scenario `default`; fixture effect `status/neutral` — active: The fixture exposes the active status without claiming a public component input..
- `disabled` — disabled; scenario `default`; fixture effect `status/neutral` — disabled: The fixture exposes the disabled status without claiming a public component input..
- `collapsed` — collapsed; scenario `default`; fixture effect `layout/constrained` — collapsed: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `expanded` — expanded; scenario `default`; fixture effect `layout/expanded` — expanded: The fixture uses an alternate deterministic boundary to expose layout behavior..
- `highlighted` — highlighted; scenario `default`; fixture effect `status/neutral` — highlighted: The fixture exposes the highlighted status without claiming a public component input..
- `wrapped` — wrapped; scenario `default`; fixture effect `status/neutral` — wrapped: The fixture exposes the wrapped status without claiming a public component input..

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `data`.
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
