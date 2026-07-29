# Timeline

- ID: `timeline`
- Selector: `krn-timeline`
- Import: `import { KrnTimeline } from '@kern-ui/angular/kit';`
- Canonical symbol: `KrnTimeline`
- Lifecycle: **stable**
- Category: Data display

Timeline. A dense, readable data primitive with semantic structure and resilient overflow.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Customer activity timeline
 *
 * Compose chronologically ordered typed timeline items.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnTimeline, KrnTimelineItem } from '@kern-ui/angular/kit';

@Component({
  selector: 'app-kern-timeline-agent-example',
  standalone: true,
  imports: [KrnTimeline, KrnTimelineItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-timeline ariaLabel="Recent customer activity">
      <krn-timeline-item heading="Contract approved" time="09:42">
        Legal review completed by Grace Hopper.
      </krn-timeline-item>
      <krn-timeline-item heading="Owner assigned" time="08:15">
        Ada Lovelace became the account owner.
      </krn-timeline-item>
    </krn-timeline>
  `,
})
export class KernTimelineAgentExample {}

void bootstrapApplication(KernTimelineAgentExample);
```

## API

| Name        | Kind  | Type     | Required | Default                                  | Description                                                  |
| ----------- | ----- | -------- | -------- | ---------------------------------------- | ------------------------------------------------------------ |
| `ariaLabel` | input | `string` | no       | `this.translations.dataDisplay.timeline` | Accessible name used when visible content is not sufficient. |

## Content slots

- `*` — Projects default component content.

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

## Related

- `badge`
- `status-badge`
- `chip`
- `tag`

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
