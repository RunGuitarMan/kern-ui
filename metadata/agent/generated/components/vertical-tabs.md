# Vertical Tabs

- ID: `vertical-tabs`
- Selector: `krn-vertical-tabs`
- Import: `import { KrnVerticalTabs } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTabs`
- Lifecycle: **stable**
- Category: Navigation

Vertical Tabs. A keyboard-first wayfinding primitive that preserves orientation and current location.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Controlled settings tabs
 *
 * Use vertical orientation for a stable settings subsection.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnVerticalTabs, type KrnTabItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-vertical-tabs-agent-example',
  standalone: true,
  imports: [KrnVerticalTabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-vertical-tabs ariaLabel="Settings sections" [items]="items" [(value)]="selectedTab">
      Selected settings section: {{ selectedTab }}
    </krn-vertical-tabs>
  `,
})
export class KernVerticalTabsAgentExample {
  readonly items: readonly KrnTabItem[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
  ];

  selectedTab: string | null = 'profile';
}

void bootstrapApplication(KernVerticalTabsAgentExample);
```

## API

| Name          | Kind  | Type                        | Required | Default                                                                                 | Description                                                      |
| ------------- | ----- | --------------------------- | -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `items`       | input | `ReadonlyArray<KrnTabItem>` | no       | `[]`                                                                                    | Ordered item collection rendered by the composite widget.        |
| `value`       | model | `string \| null`            | no       | `null`                                                                                  | Controlled component value.                                      |
| `orientation` | input | `KrnNavigationOrientation`  | no       | `this.host.nativeElement.localName === 'krn-vertical-tabs' ? 'vertical' : 'horizontal'` | Defines the logical axis used by layout and keyboard navigation. |
| `ariaLabel`   | input | `string`                    | no       | `this.translations.navigation.sections`                                                 | Accessible name used when visible content is not sufficient.     |

## Content slots

- `*` — Projects default component content.

## Angular Forms

Not an Angular Forms value accessor.

## Accessibility

- Arrow keys move within composites
- Home / End jump
- Enter activates
- Visible focus indicator with forced-colors support.
- Works at 200% text zoom and in narrow containers.
- State is communicated by text, shape, or icon in addition to color.

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

## Related

- `tabs`
- `breadcrumbs`
- `pagination`
- `stepper`

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
