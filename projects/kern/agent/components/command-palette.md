# Command Palette

- ID: `command-palette`
- Selector: `krn-command-palette`
- Import: `import { KrnCommandPalette } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCommandPalette`
- Lifecycle: **beta**
- Category: Navigation

Command Palette. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use Command Palette for a searchable, temporary launcher over a bounded set of application commands.

Avoid: Use Menu for a small contextual action set and Global Search for content discovery with a results page.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled command palette
 *
 * Own query and open state while supplying typed commands.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCommandPalette, type KrnCommandItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-command-palette-agent-example',
  standalone: true,
  imports: [KrnCommandPalette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open = true">Open commands</button>
    <krn-command-palette [items]="commands" [(query)]="query" [(open)]="open" />
  `,
})
export class KernCommandPaletteAgentExample {
  readonly commands: readonly KrnCommandItem[] = [
    {
      id: 'create-customer',
      label: 'Create customer',
      group: 'Customers',
      shortcut: 'C',
      keywords: ['new', 'account'],
    },
    {
      id: 'open-audit-log',
      label: 'Open audit log',
      group: 'Security',
      shortcut: 'A',
    },
  ];

  query = '';

  open = false;
}

void bootstrapApplication(KernCommandPaletteAgentExample);
```

## API

| Name            | Kind   | Type                                   | Required | Default                                                  | Description                                                                 |
| --------------- | ------ | -------------------------------------- | -------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `items`         | input  | `ReadonlyArray<KrnCommandItem>`        | no       | `[]`                                                     | Ordered item collection rendered by the composite widget.                   |
| `open`          | model  | `boolean`                              | no       | `false`                                                  | Controls whether the disclosure or overlay surface is visible.              |
| `query`         | model  | `string`                               | no       | `''`                                                     | Current controlled search text used to derive visible results.              |
| `title`         | input  | `string`                               | no       | `this.translations.navigation.commandPalette`            | Visible title that also names the component surface or data view.           |
| `description`   | input  | `string`                               | no       | `''`                                                     | Visible supporting description for the component content.                   |
| `placeholder`   | input  | `string`                               | no       | `this.translations.navigation.searchCommandsPlaceholder` | Short input hint shown only while no value is present.                      |
| `resultsLabel`  | input  | `string`                               | no       | `this.translations.navigation.commands`                  | Human-readable copy for the results state or control.                       |
| `closeShortcut` | input  | `string`                               | no       | `this.translations.navigation.escapeShortcut`            | Controls whether the component applies the close shortcut behavior.         |
| `locale`        | input  | `string \| Array<string>`              | no       | `inject(KRN_LOCALE)`                                     | Locale identifier used for collation, formatting, and component-owned copy. |
| `labels`        | input  | `Partial<KrnCommandPaletteLabels>`     | no       | `{}`                                                     | Localized copy overrides for the component-owned interface text.            |
| `selected`      | output | `KrnCommandItem`                       | no       | `undefined`                                              | Controlled selected state, distinct from keyboard focus.                    |
| `closed`        | output | `"selection" \| "escape" \| "outside"` | no       | `undefined`                                              | Notifies the consumer after the closed interaction completes.               |

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow Down and Arrow Up move through enabled results.
- Enter invokes the active command.
- Escape closes the palette and restores focus to its opener.
- The modal surface has a visible heading and labelled combobox/listbox relationship.
- The active result is exposed through aria-activedescendant.
- Empty results and command execution remain perceivable without adding duplicate tab stops.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.
- Uses the shared deterministic KERN id service.

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
- closed
- open
- nested
- dismissed
- selected
- unselected

## Interactive playground

Route: `preview/command-palette`

Scenarios: `default`.
Public API coverage: 6/10
directly controlled; 4 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument        | Control | Default              | Test value                       | Binding                          | Description                                                     |
| --------------- | ------- | -------------------- | -------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| `open`          | boolean | `false`              | `true`                           | model `open`                     | Opens the command palette.                                      |
| `query`         | text    | `""`                 | `"Alternate value"`              | model `query`                    | Changes the active command query.                               |
| `placeholder`   | text    | `"Search commands…"` | `"Search commands… · alternate"` | input `placeholder` (property)   | Uses locale-aware command search copy until explicitly changed. |
| `closeShortcut` | text    | `"Esc"`              | `"Esc · alternate"`              | input `closeShortcut` (property) | Uses the locale-aware close shortcut until explicitly changed.  |
| `description`   | text    | `""`                 | `"Alternate value"`              | input `description` (property)   | Configures the component description contract.                  |
| `title`         | text    | `"Jump to…"`         | `"Jump to… · alternate"`         | input `title` (property)         | Configures the component title contract.                        |

Exact API exclusions:

| Public API     | Category           | Evidence                                                     | Reason                                                                                                                                                              |
| -------------- | ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`        | complex-data       | `specimen-fixture:preview/command-palette?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `labels`       | translation-object | `locale-preview:preview/command-palette?locale=ru-RU`        | Structured translation overrides are exercised through locale providers, not lossy scalar controls.                                                                 |
| `locale`       | complex-data       | `specimen-fixture:preview/command-palette?state=default`     | Collection and data-source inputs require typed identities and deterministic fixtures rather than scalar serialization.                                             |
| `resultsLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#command-palette` | This translated action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `closed` — closed; scenario `default`; `open=false`; fixture effect `status/neutral` — closed: The fixture exposes the closed status without claiming a public component input..
- `open` — Open; scenario `default`; `open=true`.
- `nested` — nested; scenario `default`; fixture effect `status/neutral` — nested: The fixture exposes the nested status without claiming a public component input..
- `dismissed` — dismissed; scenario `default`; `open=false`; fixture effect `status/neutral` — dismissed: The fixture exposes the dismissed status without claiming a public component input..
- `selected` — selected; scenario `default`; fixture effect `status/neutral` — selected: The fixture exposes the selected status without claiming a public component input..
- `unselected` — unselected; scenario `default`; fixture effect `status/neutral` — unselected: The fixture exposes the unselected status without claiming a public component input..

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
