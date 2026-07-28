# Support

Kern is community-maintained open-source software. This policy explains where to ask for help
and what information maintainers need to act efficiently.

Before the first public package release, the default branch and `0.1.0` candidate receive
best-effort support only; there is no released compatibility line yet.

## Where to ask

| Need                                | Channel                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Confirmed, reproducible defect      | GitHub issue using the bug report form                      |
| Accessibility regression            | GitHub issue using the accessibility form                   |
| Feature or component proposal       | GitHub issue using the feature request form                 |
| Usage question or design discussion | Repository Discussions, when enabled                        |
| Suspected vulnerability             | Private process in [SECURITY.md](SECURITY.md)               |
| Conduct concern                     | Private process in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

Do not use a public issue for vulnerabilities, credentials, customer data, or conduct reports.

## What is supported

Maintainers prioritize:

- reproducible regressions in the latest supported Kern release;
- accessibility, security, SSR/hydration, and data-integrity defects;
- behavior within the documented Angular and
  [browser support matrix](docs/BROWSER_SUPPORT.md);
- migration problems caused by a documented Kern upgrade.

Stable APIs receive compatibility treatment described in
[docs/VERSIONING.md](docs/VERSIONING.md). Beta and experimental APIs are useful for feedback but
have reduced stability guarantees. Recipes are examples, not a complete application-support
surface.

Older releases, deep imports, local forks, undocumented CSS selectors, unsupported browsers, and
consumer application architecture are handled on a best-effort basis.

## A useful support request

Provide:

- Kern, Angular, Node, and browser versions;
- a minimal public reproduction;
- expected and actual behavior;
- exact keyboard, pointer, screen-reader, or SSR steps when relevant;
- console output and stack traces with secrets removed;
- confirmation that the issue remains on the latest supported Kern version.

Maintainers may close requests that cannot be reproduced, are outside the support matrix, or
remain inactive after more information is requested. A closed issue can be reopened when a
reproduction becomes available.

## Service level

There is no guaranteed response or resolution SLA and no paid support program in this
repository. Security reports follow the response targets in [SECURITY.md](SECURITY.md).
Organizations that require contractual support should maintain an internal escalation and
upgrade process rather than relying on community issue response times.
