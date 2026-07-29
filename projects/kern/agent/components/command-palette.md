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
