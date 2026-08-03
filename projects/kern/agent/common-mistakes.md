# Common KERN usage mistakes

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Button

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Configure inheritable visual defaults with provideKrnButtonOptions; keep type, disabled, name, value, form, and ARIA attributes on the native host.
- Use provideKrn translations for application-wide loading copy, a scoped loadingLabel option for a subtree, and the input only for a one-off override.

## Icon Button

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use button[krnIconButton] with a native aria-label or aria-labelledby; keep type, disabled, name, value, form, aria-describedby relationships, and click on the native host.
- Use provideKrnIconButtonOptions for inheritable visual and loading-copy defaults, and prefer Toggle Button when the component must own managed pressed state.

## Button Group

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use div[krnButtonGroup] with a native aria-label or aria-labelledby; orientation and connected change layout only, while each child action keeps its own native semantics and Tab stop.
- Do not add group-level disabled, loading, selection, or Arrow-key behavior; use Toggle Group or Segmented Control when the composition must own a managed choice.
- Use provideKrnButtonGroupOptions for inheritable orientation or connected defaults; keep accessible naming and child interaction state explicit at the call site.

## Floating Action Button

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use button[krnFab] with a persistent visible label; compact mode hides that label visually but keeps it as the native accessible name.
- Keep type, disabled, name, value, form, ARIA relationships, and click on the native host instead of recreating component proxy inputs or outputs.
- Use provideKrnFloatingActionButtonOptions for inheritable visual, extended, and loading-copy defaults; reserve a floating action for one high-priority contextual action.

## Toggle Button

- Do not omit required inputs: `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use button[krnToggleButton] with a stable value and visible or native ARIA accessible name; do not nest another interactive element inside it.
- Treat aria-pressed as component-owned derived state. Bind [(pressed)] for standalone controlled state and bind [(values)] on KrnToggleGroup for grouped state.
- Use provideKrnToggleButtonOptions for inheritable pressed and unpressed appearance defaults; use native form, name, description, and click attributes on the same button.

## Toggle Group

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use div[krnToggleGroup] with a native aria-label or aria-labelledby and direct button[krnToggleButton] children whose values are stable and unique.
- Arrow, Home, and End move focus without changing selection; activate the focused native button with Enter or Space.
- Use provideKrnToggleGroupOptions only for inheritable orientation and multiple defaults. Keep disabled and controlled values explicit at the instance.
- Use Radio Group or Segmented Control instead when an Angular form requires exactly one selected value.

## Copy Button

- Do not omit required inputs: `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Pass the exact immutable value to copy; do not derive clipboard data from formatted or visually hidden DOM text.
- Let the visible action label provide the accessible name. If ariaLabel is necessary, keep the complete visible label inside that override.
- Treat copied and copyError as terminal operation results. While data-pending="true", Copy Button retains focus and suppresses duplicate activation.
- Use provideKrnCopyButtonOptions for inheritable visual and feedback-duration defaults, and use KRN_COPY_LABELS only for a narrow locale boundary.
- Override KRN_CLIPBOARD_WRITER for tests or a platform bridge; do not mutate navigator.clipboard or add document-wide copy listeners.

## Link

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use a[krnLink] for navigation and keep href or RouterLink, target, rel, download, referrerpolicy, ARIA relationships, and click on that native anchor.
- Do not simulate a disabled link. Omit the unavailable navigation control or render non-interactive text; use a native button component for an action in the current context.
- For a privacy-hardened new browsing context, set target="_blank" and explicit rel="noopener noreferrer"; KrnLink never rewrites consumer-owned relationship or referrer policy.
- Named browsing contexts are valid native targets; do not narrow target to the former KrnLinkTarget alias.

## Form Field

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Keep id, required, disabled, readonly, and Angular Forms bindings on the projected control. Form Field derives presentation and relationships from that control instead of proxying its state.
- Disable a reactive control through FormControl.disable(); do not create a DOM-disabled control whose Angular model remains enabled.
- Use either the label input or one projected KrnLabel. A projected label is the canonical rich-content option and replaces the shorthand label instead of creating a second label.
- Register exactly one control per Form Field. For Checkbox Group, Radio Group, Segmented Control, Verification Code, or Range Slider, project the group component itself; Form Field names its composite root with aria-labelledby and delegates label clicks to its first enabled member.
- Angular validation becomes visually invalid only after the control is touched or dirty. Use mounted error content when a server or cross-field error must be announced before local interaction.
- Use the error input for one inline message or project KrnValidationMessage for controlled validation content. Form Field only references description ids that are mounted in the DOM.

## Text Input

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Textarea

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Password Input

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Search Input

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Number Input

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Checkbox

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Checkbox Group

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Radio

- Do not omit required inputs: `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Radio Group

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Switch

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Select

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not bind object options without a stable identityMatcher and trackBy contract.
- Do not use Select when arbitrary free text is valid; use Autocomplete.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Native Select

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not expect the operating-system option popup to inherit KERN surface styling.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Multi Select

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use stable option values and identityMatcher for object values.
- Use Tags Input instead when users may create an unbounded vocabulary.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Combobox

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Combobox commits only a known option; do not treat unmatched text as a value.
- Keep option identity stable across async refreshes.

## Autocomplete

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Autocomplete preserves valid free text; use Combobox when a known identifier is required.

## Slider

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Range Slider

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Segmented Control

- Do not omit required inputs: `options`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Date Picker

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Pass ISO plain-date values (YYYY-MM-DD), not locale-formatted display strings.
- Keep min, max, disabled dates, locale and deterministic today consistent between server and client.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Date Range Picker

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not submit an end date before the start date.
- Use stable ISO plain-date values rather than parsing visible localized labels.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Time Picker

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- The value is a 24-hour HH:mm string; timezone conversion remains an application concern.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Color Picker

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Verification Code

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Tags Input

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not manually duplicate value and disabled state when Angular Forms owns the control.

## Menu

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- The krnMenuTrigger slot is button label content; the Menu owns trigger semantics, focus, keyboard behavior, and ARIA state.

## Tree Navigation

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Every item id must be non-empty, unique and stable across updates.

## Tooltip

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Never place essential or interactive content only inside a Tooltip.

## Popover

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use Tooltip for a short label and Dialog for a modal workflow.
- The krnPopoverTrigger slot is button label content; the Popover owns trigger semantics, focus, keyboard behavior, and ARIA state.

## Hover Card

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- The krnHoverCardTrigger slot is button label content; the Hover Card owns trigger semantics, focus, keyboard behavior, and ARIA state.

## Dialog

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Keep the trigger available so focus can be restored after close.
- Register ownership when a custom CDK overlay opens from inside the dialog.

## Alert Dialog

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Use Alert Dialog only when an explicit decision is required before continuing.

## Drawer

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not use a modal Drawer for persistent page navigation.

## Stat

- Do not omit required inputs: `label`, `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Disclosure

- Do not omit required inputs: `heading`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Tree

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Every node id must be non-empty and unique across the complete tree.
- Do not derive persistent ids from mutable array indexes.

## Data Table

- Do not omit required inputs: `data`, `columns`, `rowIdentity`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Data Table is an alias of Data Grid; follow the same stable rowIdentity contract.

## Data Grid

- Do not omit required inputs: `data`, `columns`, `rowIdentity`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- rowIdentity must return a unique stable key for every source occurrence.
- Do not combine virtual mode with expandable detail rows.
- Use controlled mode for server-owned sorting, filtering and pagination.

## Calendar

- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Do not configure min after max.
- Provide deterministic today when server and client clocks or timezones may differ.

## Code Block

- Do not omit required inputs: `code`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Keyboard Shortcut

- Do not omit required inputs: `keys`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Meter

- Do not omit required inputs: `label`, `value`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Line Chart

- Do not omit required inputs: `title`, `data`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Provide a specific title and meaningful labels; visual marks are not the only data representation.

## Bar Chart

- Do not omit required inputs: `title`, `data`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Keep datum labels unique and provide a title that explains the comparison.

## Donut Chart

- Do not omit required inputs: `title`, `data`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
- Avoid Donut Chart when many segments or small differences make comparison unreliable.

## User Menu

- Do not omit required inputs: `name`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Page Header

- Do not omit required inputs: `heading`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Dashboard Widget

- Do not omit required inputs: `heading`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.

## Multi Step Form

- Do not omit required inputs: `steps`.
- Importing from an undeclared family path or a source implementation file.
- Loading only tokens.css instead of the complete styles/kern.css component bundle.
- Assuming the documentation SSR build replaces validation of the consuming application.
