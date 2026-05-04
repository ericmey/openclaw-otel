# Security Policy

## Supported versions

`openclaw-otel` is at v0.x. Patches go to the latest minor only.

## Reporting a vulnerability

Open a private security advisory at
https://github.com/ericmey/openclaw-otel/security/advisories/new
or email the maintainer directly. Please don't open a public issue
for security reports.

I aim to respond within 7 days. For low-severity issues I may
respond by acknowledging, scheduling, and fixing in a future minor
release rather than an immediate hotfix — that decision is made
case by case.

## Vulnerability handling — what `openclaw-otel` can and can't fix

This plugin sits inside an OpenClaw runtime. Most of its surface is
its own code, but it transitively pulls in everything OpenClaw and
the OTel SDKs depend on. When a Dependabot alert fires for a
transitive dependency, the *type* of fix matters:

### Vulnerabilities in this repo's own dependencies

If the vulnerability is in a package we depend on directly (in our
`dependencies` or `devDependencies`), we update or replace it. This
is the easy case.

### Vulnerabilities in transitive dependencies of OpenClaw

If the vulnerability is reachable only through `openclaw → ... →
{vulnerable package}`, we have three tools:

1. **`npm overrides`** — forces a specific transitive version. We
   use this when the upstream chain is slow to release, the
   override version is API-compatible, and the vulnerability
   matters for our own dev/CI environment.
2. **Documenting and waiting** — when override is risky and the
   exposure in our usage is bounded, we may track the alert in our
   issue tracker and wait for upstream.
3. **Filing upstream** — open issues against the affected packages
   and OpenClaw if neither of the above is appropriate.

**Important caveat about `npm overrides`:** the `overrides` field in
this repo's `package.json` only applies when *this repo* is the
root package being installed (e.g. our local dev install, our CI
runner). When `openclaw-otel` is installed as a dependency inside
an OpenClaw workspace, the workspace's `package.json` controls
dependency resolution and our override is ignored. The deployed
environment is governed by the *consumer's* package configuration.

So if you see a Dependabot alert closed in this repo via overrides,
that closes the alert *for this repo's own installs* — it is not a
guarantee that the deployed OpenClaw runtime carrying this plugin
is unaffected. Operators of OpenClaw deployments should:

- Run their own `npm audit` on the deployed workspace
- Apply equivalent overrides at the workspace level if needed
- Track the upstream `gaxios` / `google-auth-library` /
  `@anthropic-ai/vertex-sdk` / `openclaw` releases for the actual
  upstream fix

This stance is meant to be explicit so consumers don't make an
incorrect assumption about what closing the alert in this repo
means downstream.

## Current open advisories

None at the time of writing. See the
[Security tab](https://github.com/ericmey/openclaw-otel/security)
for live status.
