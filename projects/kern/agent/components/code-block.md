# Code Block

- ID: `code-block`
- Selector: `krn-code-block`
- Import: `import { KrnCodeBlock } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCodeBlock`
- Lifecycle: **stable**
- Category: Data display

Code Block. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Copyable API request example
 *
 * Render a complete short code sample with language metadata.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCodeBlock } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-code-block-agent-example',
  standalone: true,
  imports: [KrnCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-code-block
      language="typescript"
      languageLabel="TypeScript"
      [code]="sourceCode"
      [(copied)]="copied"
    />
  `,
})
export class KernCodeBlockAgentExample {
  readonly sourceCode = "const customer = await client.customers.get('cus-2048');";

  copied = false;
}

void bootstrapApplication(KernCodeBlockAgentExample);
```

## API

| Name            | Kind  | Type      | Required | Default    | Description                                                                   |
| --------------- | ----- | --------- | -------- | ---------- | ----------------------------------------------------------------------------- |
| `code`          | input | `string`  | yes      | `required` | Required source text rendered by the syntax-aware code presentation.          |
| `language`      | input | `string`  | no       | `'text'`   | Language identifier used by syntax highlighting and accessible code metadata. |
| `languageLabel` | input | `string`  | no       | `''`       | Human-readable copy for the language state or control.                        |
| `copied`        | model | `boolean` | no       | `false`    | Controlled copied state with a matching Angular model-change output.          |

## Deprecated selectors

_No deprecated selectors._

## Content slots

_No projected content slots._

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys navigate interactive data
- Enter expands or selects
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

Manual assistive-technology validation remains required in the consuming application.

## SSR and hydration

- KERN avoids ambient browser globals in reusable runtime infrastructure.
- Validate the consuming SSR/hydration route, locale, ids and overlay host.
- Browser capabilities are nullable or become available only after hydration.

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

Route: `preview/code-block`

Scenarios: `default`.
Public API coverage: 3/4
directly controlled; 1 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument   | Control | Default               | Test value            | Binding                     | Description                                          |
| ---------- | ------- | --------------------- | --------------------- | --------------------------- | ---------------------------------------------------- |
| `language` | select  | `"typescript"`        | `"html"`              | input `language` (property) | Changes the displayed language label.                |
| `copied`   | boolean | `false`               | `true`                | model `copied`              | Changes the public copied acknowledgement state.     |
| `code`     | text    | `"const status = 1;"` | `"const status = 2;"` | input `code` (property)     | Overrides the production-like runnable code fixture. |

Exact API exclusions:

| Public API      | Category           | Evidence                                                | Reason                                                                                                                                                               |
| --------------- | ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `languageLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#code-block` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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

- `badge`
- `status-badge`
- `chip`
- `tag`

## Common mistakes

- Do not omit required inputs: `code`.
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
