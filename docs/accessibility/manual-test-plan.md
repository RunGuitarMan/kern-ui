# Manual assistive-technology test plan

This protocol is the human execution companion to `manual-evidence.json`. Automated browser tests
must never be used to mark these runs as passing. Execute every required record on the named real
or managed operating system, branded browser, assistive technology, and input method.

## Run protocol

For each of `nvda-firefox-windows`, `jaws-edge-windows`, `voiceover-safari-macos`,
`keyboard-only-windows`, `windows-high-contrast`, and `zoom-reflow-desktop`:

1. record exact OS, browser, assistive-technology, and input versions before testing;
2. open the deterministic Docs preview for each component assigned to the record;
3. execute the component scenario below without switching to a pointer unless the record calls for
   one;
4. capture the initial state, focus/announcement transitions, and final state in durable evidence;
5. record every failure as a linked defect; a known defect is still a `fail`, not a qualified pass;
6. have a second person review the evidence before setting `verifiedBy` or certifying the matrix.

The optional `voiceover-safari-ios` run follows the same evidence rules but does not block the
current desktop support tier.

## Component scenarios

Every scenario starts in the default preview unless the row names another state. Verify accessible
name, role, value/state, visible focus, reading order, and non-color state communication in addition
to the component-specific acceptance criteria.

| Component                                   | Required human scenario and acceptance criteria                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="app-shell"></a>App Shell             | Traverse skip link, header, navigation, main content, and mobile navigation. Landmarks are named once, focus order follows reading order, and navigation does not strand focus.                               |
| <a id="calendar"></a>Calendar               | Announce month and selected/today/disabled dates; move by Arrow keys, Home/End, Page Up/Down, and select a date without unexpected mode changes.                                                              |
| <a id="combobox"></a>Combobox               | Enter text, hear expansion and result changes, move through options, select, clear, and escape. The final value and focus restoration are announced.                                                          |
| <a id="command-palette"></a>Command Palette | Open from its documented trigger, filter to one/zero results, move active option, select, escape, and reopen. Dialog context, result count, active option, and restored trigger focus are clear.              |
| <a id="context-menu"></a>Context Menu       | Open from keyboard and pointer context activation, traverse items and submenus, escape one level at a time, and restore focus to the invoker.                                                                 |
| <a id="data-grid"></a>Data Grid             | Navigate headers and rows, sort, filter, select, expand, paginate, and exercise virtual scrolling. Header relationships, row state, live result counts, and internal scroll boundaries remain understandable. |
| <a id="date-picker"></a>Date Picker         | Open from the labelled trigger, navigate/select a date, test minimum/maximum and invalid states, escape without selection, and verify trigger focus/value announcement.                                       |
| <a id="dialog"></a>Dialog                   | Open, traverse the focus trap, attempt background navigation, exercise nested overlay content, close by action/Escape, and verify focus returns to the exact trigger.                                         |
| <a id="donut-chart"></a>Donut Chart         | Traverse every datum and the source-data table. Labels include category and value/share, selection is not color-only, and the same information remains available non-visually.                                |
| <a id="line-chart"></a>Line Chart           | Traverse points in data order, identify active datum and trend context, open the source-data table, and confirm empty/loading/error messages are announced.                                                   |
| <a id="menu"></a>Menu                       | Open, traverse enabled items, skip disabled items, activate one item, escape, and verify focus restoration and submenu level announcements.                                                                   |
| <a id="menubar"></a>Menubar                 | Enter once, move by horizontal/vertical Arrow keys with RTL considered, open/close submenus, use Home/End, and leave with a predictable tab stop.                                                             |
| <a id="select"></a>Select                   | Open, traverse disabled/enabled options, type ahead, select, clear where supported, and escape. Required/invalid/loading/empty states and the committed value are announced.                                  |
| <a id="stepper"></a>Stepper                 | Traverse completed/current/disabled steps, attempt blocked navigation, move forward/back, and confirm current-step and validation changes are announced.                                                      |
| <a id="tabs"></a>Tabs                       | Move by Arrow keys, Home/End, activate according to the documented model, verify one selected tab/panel relationship, and repeat in RTL and vertical modes.                                                   |
| <a id="tree"></a>Tree                       | Traverse levels, expand/collapse, select, visit loading/error branches, and verify level/position/set-size plus stable focus after lazy content changes.                                                      |
| <a id="tree-navigation"></a>Tree Navigation | Expand route groups, activate a leaf, return to the tree, and verify current route, hierarchy, focus retention, and browser navigation ownership.                                                             |

## Zoom and forced-color additions

For `windows-high-contrast`, inspect every scenario with system forced colors enabled: focus,
selection, disabled, error, chart marks, and overlay boundaries must remain distinguishable.

For `zoom-reflow-desktop`, repeat the assigned workflows at 200% text zoom and 400% browser zoom.
The page must reflow to the equivalent 320 CSS-pixel viewport without two-dimensional page scroll;
documented internal data scrollers may scroll horizontally but must remain labelled and reachable.

## Completion and certification

A record may become `pass` only when all assigned component scenarios pass and its evidence links
resolve. Any regression sets the record to `fail`; an unavailable environment sets it to `blocked`.
The top-level certification may become `certified` only after every release-blocking record passes,
is fresh under policy, and has independent review evidence.
