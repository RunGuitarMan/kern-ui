# Notification Center

- ID: `notification-center`
- Selector: `krn-notification-center`
- Import: `import { KrnNotificationCenter } from '@kern-ui/angular/patterns';`
- Canonical symbol: `KrnNotificationCenter`
- Lifecycle: **recipe**
- Category: Patterns

Notification Center. A product pattern composed from Kern primitives, intended as a starting point rather than a sealed widget.

## Use

Use the smallest semantic primitive that communicates the intended relationship.

Avoid: Do not remove labels, focus indicators, or overflow behavior to make a demo look cleaner.

## Compile-verified standalone Angular example

```ts
/**
 * Typed notification center
 *
 * Render immutable notification records with stable ids and read state.
 *
 * Compile-verified against the packed @kern-ui/angular package by the KERN agent DX gate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { KrnNotificationCenter, type KrnNotification } from '@kern-ui/angular/patterns';

@Component({
  selector: 'app-kern-notification-center-agent-example',
  standalone: true,
  imports: [KrnNotificationCenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <krn-notification-center
      heading="Account notifications"
      [notifications]="notifications"
      (markAllRead)="markAllRead()"
    />
  `,
})
export class KernNotificationCenterAgentExample {
  notifications: readonly KrnNotification[] = [
    {
      id: 'notification-renewal',
      title: 'Renewal review due',
      detail: 'Acme Europe requires review before 15 October.',
      timestamp: '10 minutes ago',
      read: false,
      tone: 'warning',
    },
  ];

  markAllRead(): void {
    this.notifications = this.notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
  }
}

void bootstrapApplication(KernNotificationCenterAgentExample);
```

## API

| Name                   | Kind   | Type                             | Required | Default                                         | Description                                                                  |
| ---------------------- | ------ | -------------------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `heading`              | input  | `string`                         | no       | `this.translations.patterns.notifications`      | Human-readable copy for the heading state or control.                        |
| `ariaLabel`            | input  | `string`                         | no       | `this.translations.patterns.notificationCenter` | Accessible name used when visible content is not sufficient.                 |
| `unreadLabel`          | input  | `(count: number) => string`      | no       | `this.translations.patterns.unreadCount`        | Human-readable copy for the unread state or control.                         |
| `unreadStateLabel`     | input  | `string`                         | no       | `this.translations.patterns.unread`             | Human-readable copy for the unread state state or control.                   |
| `markAllReadLabel`     | input  | `string`                         | no       | `this.translations.patterns.markAllRead`        | Human-readable copy for the mark all read state or control.                  |
| `emptyLabel`           | input  | `string`                         | no       | `this.translations.patterns.notificationsEmpty` | Accessible copy that explains the empty state.                               |
| `notifications`        | input  | `ReadonlyArray<KrnNotification>` | no       | `[]`                                            | Ordered domain values supplied to the notification collection.               |
| `markAllRead`          | output | `void`                           | no       | `undefined`                                     | Notifies the consumer after the mark all read interaction completes.         |
| `notificationSelected` | output | `KrnNotification`                | no       | `undefined`                                     | Notifies the consumer after the notification selected interaction completes. |

## Content slots

_No projected content slots._

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
- `global-search`
- `filter-bar`
- `page-header`

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
