# Scroll Area

- ID: `scroll-area`
- Selector: `krn-scroll-area`
- Import: `import { KrnScrollArea } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnScrollArea`
- Lifecycle: **stable**
- Category: Layout

Scroll Area. A composable spatial primitive that keeps product layouts predictable across containers.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Keyboard-accessible activity log
 *
 * Constrain a long activity stream without hiding keyboard access.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnScrollArea } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-scroll-area-agent-example',
  standalone: true,
  imports: [KrnScrollArea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-scroll-area
      axis="vertical"
      maxBlockSize="16rem"
      ariaLabel="Recent account activity"
      [keyboardAccessible]="true"
    >
      <ol>
        <li>Contract approved</li>
        <li>Risk review completed</li>
        <li>Renewal owner assigned</li>
      </ol>
    </krn-scroll-area>
  `,
})
export class KernScrollAreaAgentExample {}

void bootstrapApplication(KernScrollAreaAgentExample);
```

## API

| Name                 | Kind  | Type                                   | Required | Default                                      | Description                                                                    |
| -------------------- | ----- | -------------------------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `axis`               | input | `"horizontal" \| "vertical" \| "both"` | no       | `'vertical'`                                 | Chart axis represented by the data series and keyboard movement.               |
| `maxBlockSize`       | input | `KrnLayoutSpace`                       | no       | `'100%'`                                     | Upper or lower bound applied to the block size value.                          |
| `maxInlineSize`      | input | `KrnLayoutSpace`                       | no       | `'100%'`                                     | Upper or lower bound applied to the inline size value.                         |
| `keyboardAccessible` | input | `boolean`                              | no       | `true`                                       | Confirms that the custom rendered action participates in keyboard interaction. |
| `ariaLabel`          | input | `string \| null`                       | no       | `this.translations.layout.scrollableContent` | Accessible name used when visible content is not sufficient.                   |
| `scrollbar`          | input | `"hidden" \| "auto" \| "stable"`       | no       | `'auto'`                                     | Controls whether the scroll area uses native or visually hidden scrollbars.    |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- No custom keyboard behavior unless the composition is interactive
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

## Interactive playground

Route: `preview/scroll-area`

Scenarios: `default`.
Public API coverage: 5/6
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument             | Control | Default      | Test value     | Binding                               | Description                                           |
| -------------------- | ------- | ------------ | -------------- | ------------------------------------- | ----------------------------------------------------- |
| `axis`               | select  | `"vertical"` | `"horizontal"` | input `axis` (property)               | Chooses the axes that can scroll.                     |
| `maxBlockSize`       | text    | `"16rem"`    | `"20rem"`      | input `maxBlockSize` (property)       | Constrains the scrolling viewport.                    |
| `keyboardAccessible` | boolean | `true`       | `false`        | input `keyboardAccessible` (property) | Configures the component keyboardAccessible contract. |
| `maxInlineSize`      | text    | `"100%"`     | `"20rem"`      | input `maxInlineSize` (property)      | Configures the component maxInlineSize contract.      |
| `scrollbar`          | select  | `"auto"`     | `"hidden"`     | input `scrollbar` (property)          | Configures the component scrollbar contract.          |

Exact API exclusions:

| Public API  | Category           | Evidence                                                 | Reason                                                                                                                  |
| ----------- | ------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#scroll-area` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change. |

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
