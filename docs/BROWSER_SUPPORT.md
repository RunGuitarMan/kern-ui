# Browser and platform support

Kern supports modern standards-based browsers. Support claims are tied to automated release
coverage, not only to whether a component appears to render.

## Support tiers

| Tier | Targets                                       | Release evidence                                      |
| ---- | --------------------------------------------- | ----------------------------------------------------- |
| 1    | Latest Playwright Chromium, Firefox, WebKit   | Behavioral, semantic, keyboard, and a11y smoke suites |
| 1    | Latest Playwright Chromium                    | Full E2E, responsive, and visual regression suites    |
| 2    | Current branded Chrome, Edge, Firefox, Safari | Reproduction and fix verification for reported bugs   |
| 3    | Mobile browsers, webviews, Electron           | Best effort                                           |

Tier 1 failures block release. Browser revisions are locked by the repository's Playwright version
and installed together in CI. The cross-engine suite concentrates on platform-sensitive widget
behavior; Chromium additionally owns the deterministic pixel baselines so rendering-engine
differences do not create noisy or unreviewable snapshots.

Playwright WebKit is strong compatibility evidence but is not identical to Safari on Apple
hardware. Organizations with a Safari or mobile compliance requirement should add real-device
validation to their application release gate. Internet Explorer is not supported.

The Playwright projects cover:

| Project                                   | Coverage                                                    |
| ----------------------------------------- | ----------------------------------------------------------- |
| `e2e`                                     | Chromium user flows, component behavior, keyboard contracts |
| `a11y`                                    | Full Chromium automated accessibility suite                 |
| `responsive`                              | Chromium viewport, zoom, reflow, and responsive behavior    |
| `visual`                                  | Deterministic Chromium Lab screenshots                      |
| `cross-browser-{chromium,firefox,webkit}` | Tier 1 hydration, semantics, keyboard/focus, and axe smoke  |

The focused Tier 1 matrix runs with `npm run test:browsers`. `npm run test:e2e` remains the complete
Playwright release suite and includes the focused matrix plus the Chromium-only full suites.

## Consumer and build environments

- Consumer Angular compatibility is defined in [VERSIONING.md](VERSIONING.md).
- Node and npm versions apply to building and contributing; browser applications do not require a
  Node runtime.
- Server rendering is verified through the Angular documentation application. Components must not
  require browser globals during server render.
- Applications must provide the platform polyfills required by their supported Angular version.
  Kern does not bundle legacy browser polyfills.

Kern may use modern platform features including CSS custom properties, logical properties,
container queries, `ResizeObserver`, and standard focus APIs. Unsupported embedded browsers must be
upgraded or isolated by the consuming application.

## Accessibility scope

Automated axe checks, semantic assertions, keyboard tests, zoom/reflow checks, forced-color styles,
and reduced-motion behavior are release evidence. They are not a claim that every browser and
assistive-technology pairing has been manually certified.

Critical workflows should be validated by the consuming organization with its own required
browser, operating system, screen-reader, input, and enterprise policy matrix.

## Adding a supported browser

A browser becomes release-blocking only after the repository includes:

1. a named Playwright project or documented device pipeline;
2. keyboard and accessibility coverage for complex widgets;
3. responsive and theme coverage;
4. stable CI execution with owned baselines;
5. an update to this document and the changelog.

Dropping a certified browser or raising a browser-version floor is a breaking change under the
project's versioning policy.
