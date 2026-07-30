# Security Policy

Kern treats dependency, DOM, rendering, and supply-chain vulnerabilities as product defects.
Please report suspected vulnerabilities privately so maintainers can investigate before details
become public.

## Supported versions

Until Kern reaches `1.0.0`, security fixes are made on the latest published minor line only.
After `1.0.0`, this table will name every supported major line explicitly.

Before the first public package release, no release line receives a security-support guarantee;
the default branch is handled on a best-effort basis.

| Version                               | Security fixes |
| ------------------------------------- | -------------- |
| Latest published `0.x` minor          | Yes            |
| Older `0.x` minors                    | No             |
| Unreleased code on the default branch | Best effort    |

The support window may be extended for a coordinated disclosure, but consumers should not rely
on fixes for versions marked unsupported.

## Report a vulnerability

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability** under Security Advisories when private vulnerability
   reporting is available.
3. If that option is unavailable, contact a maintainer through a private address listed on their
   GitHub profile and ask for a private reporting channel.

Do not open a public issue, discussion, or pull request containing exploit details. Do not
include credentials, production data, or personal information in a report.

Include as much of the following as possible:

- affected Kern and Angular versions;
- affected component, package entry point, or build workflow;
- impact and realistic attack scenario;
- minimal reproduction or proof of concept;
- required user interaction and environmental assumptions;
- known mitigations;
- whether and when the issue has been disclosed elsewhere.

## Response targets

These are operational targets, not a contractual SLA:

- acknowledgement within three business days;
- initial severity and scope assessment within seven business days;
- a status update at least every seven business days while remediation is active;
- coordinated publication after a fix and upgrade guidance are available.

Maintainers will confirm receipt, assign a coordinator, reproduce the issue, establish affected
versions, prepare a fix and tests, and agree on a disclosure date with the reporter. Timelines
may change for complex or embargoed dependency vulnerabilities.

Kern uses severity and exploitability, not only scanner scores, to prioritize remediation.
Security releases may remove unsafe behavior without a normal deprecation period.

## Scope

In scope:

- code and published assets in `@kern-ui/angular`;
- documentation or preview behavior that can compromise a consumer;
- repository build and release workflows;
- vulnerable direct dependencies with a plausible Kern attack path.

Generally out of scope:

- vulnerabilities that require a consumer to inject already-trusted arbitrary script;
- unsupported versions or browsers;
- availability attacks against public GitHub or npm infrastructure;
- automated reports without an affected path or reproducible impact;
- social engineering, physical attacks, and denial-of-service testing against third parties.

## Safe-harbor expectations

Good-faith research should avoid privacy violations, service disruption, data destruction, and
access beyond what is necessary to demonstrate the issue. Give maintainers reasonable time to
remediate before disclosure. The project will not pursue action against research that follows
this policy, but cannot authorize testing against systems or data owned by others.

When a fix is released, the advisory and [CHANGELOG.md](CHANGELOG.md) will describe affected
versions, severity, mitigation, and the first fixed version without exposing unnecessary user
data.
