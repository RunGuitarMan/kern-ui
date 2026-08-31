# Table of Contents

- ID: `table-of-contents`
- Selector: `krn-table-of-contents`
- Import: `import { KrnTableOfContents } from '@kern-ui/angular/navigation';`
- Canonical symbol: `KrnTableOfContents`
- Lifecycle: **stable**
- Category: Navigation

Table of Contents. Lists page headings and tracks the section currently active in the reading viewport.

## Use

Use Table of Contents for this specific contract: Lists page headings and tracks the section currently active in the reading viewport.

Avoid: Do not choose Table of Contents for visual similarity alone; its semantics and interaction model must match the product task.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled document contents
 *
 * Track the active heading against stable document ids.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTableOfContents, type KrnTocItem } from '@kern-ui/angular/navigation';

@Component({
  selector: 'app-kern-table-of-contents-agent-example',
  standalone: true,
  imports: [KrnTableOfContents],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-table-of-contents
      title="Onboarding guide"
      [items]="items"
      [observe]="false"
      [(activeId)]="activeId"
    />
  `,
})
export class KernTableOfContentsAgentExample {
  readonly items: readonly KrnTocItem[] = [
    { id: 'company', label: 'Company', level: 2 },
    { id: 'owners', label: 'Owners', level: 2 },
    { id: 'permissions', label: 'Permissions', level: 3 },
  ];

  activeId: string | null = 'company';
}

void bootstrapApplication(KernTableOfContentsAgentExample);
```

## API

| Name            | Kind   | Type                        | Required | Default     | Description                                                             |
| --------------- | ------ | --------------------------- | -------- | ----------- | ----------------------------------------------------------------------- |
| `items`         | input  | `ReadonlyArray<KrnTocItem>` | no       | `[]`        | Ordered item collection rendered by the composite widget.               |
| `activeId`      | model  | `string \| null`            | no       | `null`      | Controlled active id state with a matching Angular model-change output. |
| `observe`       | input  | `boolean`                   | no       | `true`      | Defines the component's observe behavior or presentation.               |
| `title`         | input  | `string \| undefined`       | no       | `undefined` | Visible title that also names the component surface or data view.       |
| `ariaLabel`     | input  | `string \| undefined`       | no       | `undefined` | Accessible name used when visible content is not sufficient.            |
| `itemActivated` | output | `KrnTocItem`                | no       | `undefined` | Notifies the consumer after the item activated interaction completes.   |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab visits heading links in document order; Enter follows the focused link
- Destinations retain native link semantics and expose current location where applicable.
- Composite navigation uses one documented focus model without changing reading order.

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
- current

## Interactive playground

Route: `preview/table-of-contents`

Scenarios: `default`.
Public API coverage: 3/5
directly controlled; 2 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument  | Control | Default               | Test value                   | Binding                    | Description                                                       |
| --------- | ------- | --------------------- | ---------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `active`  | select  | `"specimen-overview"` | `"specimen-api"`             | model `activeId`           | Changes the active table-of-contents entry.                       |
| `observe` | boolean | `true`                | `false`                      | input `observe` (property) | Defines the component's observe behavior or presentation.         |
| `title`   | text    | `"On this page"`      | `"On this page · alternate"` | input `title` (property)   | Visible title that also names the component surface or data view. |

Exact API exclusions:

| Public API  | Category           | Evidence                                                       | Reason                                                                                                                  |
| ----------- | ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#table-of-contents` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |
| `items`     | complex-data       | `specimen-fixture:preview/table-of-contents?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization. |

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
- `current` — current; scenario `default`; fixture effect `status/neutral` — current: The fixture exposes the current status without claiming a public component input..

## Related

- `breadcrumbs`
- `tabs`
- `vertical-tabs`
- `pagination`

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
