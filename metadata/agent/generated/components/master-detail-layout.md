# Master Detail Layout

- ID: `master-detail-layout`
- Selector: `krn-master-detail-layout`
- Import: `import { KrnMasterDetailLayout } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnMasterDetailLayout`
- Lifecycle: **recipe**
- Category: Patterns

Master Detail Layout. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled customer master-detail layout
 *
 * Keep compact detail visibility synchronized with route or selection state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnMasterDetailLayout } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-master-detail-layout-agent-example',
  standalone: true,
  imports: [KrnMasterDetailLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-master-detail-layout
      masterLabel="Customers"
      detailLabel="Customer details"
      [(detailOpen)]="detailOpen"
    >
      <section krnMaster>
        <button type="button" (click)="detailOpen = true">Acme Europe</button>
      </section>
      <section krnDetail>
        <h2>Acme Europe</h2>
        <button type="button" (click)="detailOpen = false">Back to customers</button>
      </section>
    </krn-master-detail-layout>
  `,
})
export class KernMasterDetailLayoutAgentExample {
  detailOpen = false;
}

void bootstrapApplication(KernMasterDetailLayoutAgentExample);
```

## API

| Name          | Kind  | Type      | Required | Default                                 | Description                                                               |
| ------------- | ----- | --------- | -------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `masterLabel` | input | `string`  | no       | `this.translations.patterns.masterList` | Human-readable copy for the master state or control.                      |
| `detailLabel` | input | `string`  | no       | `this.translations.patterns.detail`     | Human-readable copy for the detail state or control.                      |
| `detailOpen`  | model | `boolean` | no       | `false`                                 | Controlled detail open state with a matching Angular model-change output. |

## Content slots

- `[krnMaster]` — Projects content matching [krnMaster].
- `[krnDetail]` — Projects content matching [krnDetail].

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
- loading
- empty
- error
- success

## Related

- `user-menu`
- `notification-center`
- `global-search`
- `filter-bar`

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
