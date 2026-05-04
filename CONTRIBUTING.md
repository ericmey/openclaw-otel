# Contributing to openclaw-otel

Thanks for your interest. This document covers the basics for landing
changes in this repository.

## Development setup

You need:

- Node.js **22.0 or newer** (matches the OpenClaw runtime requirement)
- An OpenClaw install if you want to test against a real host (see
  [openclaw](https://github.com/openclaw/openclaw))

```bash
git clone https://github.com/ericmey/openclaw-otel.git
cd openclaw-otel
npm install
```

## Verifying changes

```bash
npm run typecheck   # static type check
npm test            # unit tests
```

For a real-world test against OpenClaw:

```bash
npm pack
# copy the resulting .tgz to your openclaw host, then:
#   cd ~/.openclaw/npm
#   npm install /path/to/openclaw-otel-*.tgz
# Enable in openclaw.json plugins.entries, hot-reload openclaw,
# verify your collector receives signals as expected.
```

## What kind of changes are welcome

- **Field-shape fixes** — if you've found a label, attribute, or metric
  name that doesn't follow OTel semantic conventions or that creates
  pain for Grafana / LGTM-stack consumers, fix it. Open an issue first
  if the change is non-obvious so we can align.
- **OpenClaw API additions** — when OpenClaw adds new plugin SDK
  capabilities or new diagnostic event types, the plugin should grow
  to support them.
- **Performance** — anything that reduces plugin overhead in the
  OpenClaw runtime, especially in the hot path of event processing.
- **Test coverage** — always welcome, especially for edge cases in
  attribute redaction, cardinality bounds, and error handling.

## What kind of changes need discussion first

- **New configuration options** — open an issue describing the use case
  before implementing. Configuration surface area has long-term cost.
- **Breaking changes** — anything that changes emitted field names,
  removes signals, or changes config schema needs a migration plan.
- **New dependencies** — pre-1.0 OTel packages still have breaking
  changes between minors; pinning ranges matters.

## Commit messages

Conventional Commits format. Common types:

- `feat:` new capability
- `fix:` bug fix or field-shape correction
- `chore:` housekeeping (build, deps, tooling)
- `docs:` documentation only
- `test:` test changes only
- `refactor:` code change without behavior change

Reference issue numbers when relevant: `fix: drop redundant log_level attribute (#42)`.

## Before opening a PR

- `npm run typecheck` passes
- `npm test` passes
- Commits are clean (no `wip` or merge commits — rebase your branch
  onto `main` before opening)
- New behavior has a test
- README or doc updates if you changed the public API or field shape
