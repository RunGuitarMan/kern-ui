# Copy Button

- ID: `copy-button`
- Selector: `krn-copy-button`
- Import: `import { KrnCopyButton } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnCopyButton`
- Lifecycle: **stable**
- Category: Actions

Copy Button. Copies one explicit string through an injectable clipboard capability and exposes deterministic pending, copied, and error feedback without removing its native button from focus order.

## Use

Pass the exact value, provide a context-specific visible action label, and handle copied or copyError when product behavior depends on the result.

Avoid: Do not scrape projected DOM text, mutate navigator.clipboard in tests, or trigger another operation while data-pending="true".

## Compile-verified standalone Angular example

```ts
/**
 * Copy immutable record id
 *
 * Copy an explicit domain identifier, localize its accessible context, and consume confirmed outcomes.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnCopyButton, provideKrnCopyButtonOptions } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-copy-button-agent-example',
  standalone: true,
  imports: [KrnCopyButton],
  providers: [
    provideKrnCopyButtonOptions({
      size: 'sm',
      feedbackDuration: 2400,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-copy-button
      [value]="customerId"
      (copied)="lastResult = 'Copied ' + $event"
      (copyError)="lastResult = 'Customer id copy failed'"
    >
      Copy customer id {{ customerId }}
    </krn-copy-button>
    <output>{{ lastResult }}</output>
  `,
})
export class KernCopyButtonAgentExample {
  readonly customerId = 'CUS-2048';

  lastResult = '';
}

void bootstrapApplication(KernCopyButtonAgentExample);
```

## API

| Name               | Kind   | Type               | Required | Default                         | Description                                                                                                                                                                        |
| ------------------ | ------ | ------------------ | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | input  | `string`           | yes      | `required`                      | Exact text captured once at activation and written to the clipboard.                                                                                                               |
| `ariaLabel`        | input  | `string`           | no       | `''`                            | Optional accessible-name override for the inner native button. Leave empty to derive the name from the visible action label. When set, include that visible label in the override. |
| `copyLabel`        | input  | `string`           | no       | `this.labels.copy`              | Localized visible fallback used only when no action label is projected.                                                                                                            |
| `copyingLabel`     | input  | `string`           | no       | `this.labels.copying`           | Loading announcement while the asynchronous write is in flight.                                                                                                                    |
| `copiedLabel`      | input  | `string`           | no       | `this.labels.copied`            | Success announcement paired with the visible success indicator.                                                                                                                    |
| `errorLabel`       | input  | `string`           | no       | `this.labels.failed`            | Failure announcement paired with the visible error indicator.                                                                                                                      |
| `size`             | input  | `KrnSize`          | no       | `this.options.size`             | Named semantic size resolved through KERN density and sizing tokens.                                                                                                               |
| `variant`          | input  | `KrnActionVariant` | no       | `this.options.variant`          | Named visual hierarchy treatment that preserves the component semantics.                                                                                                           |
| `tone`             | input  | `KrnTone`          | no       | `this.options.tone`             | Semantic intent that selects coordinated text, icon, border, and surface tokens.                                                                                                   |
| `feedbackDuration` | input  | `number`           | no       | `this.options.feedbackDuration` | Milliseconds before settled feedback returns to idle. Invalid or negative values fall back to the library default.                                                                 |
| `disabled`         | input  | `boolean`          | no       | `false`                         | Prevents user interaction and participates in the disabled-state contract.                                                                                                         |
| `copied`           | output | `string`           | no       | `undefined`                     | Emits the exact captured value only after the clipboard writer confirms success.                                                                                                   |
| `copyError`        | output | `unknown`          | no       | `undefined`                     | Emits the original writer failure without masking or replacing its identity.                                                                                                       |

## Deprecated selectors

_No deprecated selectors._

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Tab focuses the inner native button
- Enter and Space start one clipboard operation
- A pending operation retains focus and suppresses duplicate activation
- The visible action label supplies a stable accessible name; an explicit ariaLabel override must include that visible label.
- One persistent polite sibling status announces pending, copied, and error copy without relying on descendants of the native button.
- The inner native button defaults to type="button" and disabled uses native button semantics.

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
- hover
- focus-visible
- active
- idle
- pending
- copied
- error
- disabled

## Interactive playground

Route: `preview/copy-button`

Scenarios: `default`.
Public API coverage: 6/11
directly controlled; 5 exact exclusions; 0 unclassified.
Use `arg.<key>` query parameters for controls. Controls tagged `fixture` or `composition`
configure the deterministic documentation specimen and are not public component inputs.
Preset fixture effects are documentation-only rendering metadata; never serialize them as
component inputs or models.

| Argument           | Control | Default                    | Test value                             | Binding                             | Description                                                                             |
| ------------------ | ------- | -------------------------- | -------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `variant`          | select  | `"outline"`                | `"solid"`                              | input `variant` (property)          | Changes visual emphasis without changing clipboard behavior.                            |
| `tone`             | select  | `"neutral"`                | `"brand"`                              | input `tone` (property)             | Changes semantic action emphasis without becoming copy-result feedback.                 |
| `size`             | select  | `"md"`                     | `"sm"`                                 | input `size` (property)             | Changes the action target and label size.                                               |
| `feedbackDuration` | number  | `1800`                     | `1900`                                 | input `feedbackDuration` (property) | Keeps copied or error feedback visible for this many milliseconds.                      |
| `disabled`         | boolean | `false`                    | `true`                                 | input `disabled` (property)         | Prevents user interaction.                                                              |
| `value`            | text    | `"npm i @kern-ui/angular"` | `"npm i @kern-ui/angular · alternate"` | input `value` (property)            | Supplies the exact immutable string sent to the clipboard writer.                       |
| `copyState`        | select  | `"live"`                   | `"idle"`                               | fixture interaction                 | Uses the live clipboard by default or a deterministic specimen writer for async states. |

Exact API exclusions:

| Public API     | Category           | Evidence                                                 | Reason                                                                                                                                                               |
| -------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | Low-value duplicate accessibility copy is validated by the a11y fixture and kept stable while visual parameters change.                                              |
| `copiedLabel`  | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `copyingLabel` | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `copyLabel`    | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |
| `errorLabel`   | accessibility-copy | `a11y-test:tests/a11y/accessibility.spec.ts#copy-button` | This localizable action label is stable accessibility copy; interaction/state controls exercise the same component behavior without duplicating every locale string. |

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
- `idle` — Idle; scenario `default`; `copyState="idle"`.
- `pending` — Pending; scenario `default`; `copyState="pending"`.
- `copied` — Copied; scenario `default`; `copyState="copied"`; `feedbackDuration=60000`.
- `error` — Error; scenario `default`; `copyState="error"`; `feedbackDuration=60000`.
- `disabled` — Disabled; scenario `default`; `disabled=true`.

## Related

- `button`
- `icon-button`
- `code-block`
- `button-group`
- `split-button`

## Common mistakes

- Do not omit required inputs: `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Pass the exact immutable value to copy; do not derive clipboard data from formatted or visually hidden DOM text.
- Let the visible action label provide the accessible name. If ariaLabel is necessary, keep the complete visible label inside that override.
- Treat copied and copyError as terminal operation results. While data-pending="true", Copy Button retains focus and suppresses duplicate activation.
- Use provideKrnCopyButtonOptions for inheritable visual and feedback-duration defaults, and use KRN_COPY_LABELS only for a narrow locale boundary.
- Override KRN_CLIPBOARD_WRITER for tests or a platform bridge; do not mutate navigator.clipboard or add document-wide copy listeners.

## Ship checklist

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.
