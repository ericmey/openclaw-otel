# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Stable 1.0.0 release.** Plugin contract surface, field shapes, and configuration schema are now stable; future breaking changes will follow semver and be documented in this file.
- Released to npm as [`openclaw-otel`](https://www.npmjs.com/package/openclaw-otel) with provenance attestation (SLSA Level 3 via npm trusted publishing OIDC).
- Compat target lifted to OpenClaw `>=2026.5.4` — first version with the externalized-plugin gate that recognizes our `internalDiagnostics` capability path. (Local fork patch for the bundled-gate is still required until upstream opens a public hook surface; see [docs/INSTALL.md](./docs/INSTALL.md) when present.)
- `trace_id` and `span_id` are now injected on log records whenever an active span is in scope at log emission time. Closes the gap that broke `tracesToLogsV2` correlation in Grafana.
- Repository tooling: Biome (lint + format), Dependabot config, CodeQL workflow, GitHub issue and PR templates, expanded CI matrix covering Node 22 and 24.
- `npm overrides` forcing `uuid` to `^14` (closes a Dependabot alert for `uuid <14` reachable transitively through `@anthropic-ai/vertex-sdk → google-auth-library → gaxios`). **Caveat:** npm `overrides` only apply when `openclaw-otel` is the *root* package being installed (e.g. for our local dev or CI). When this plugin is consumed as a dependency in an OpenClaw workspace, the workspace's own `package.json` controls dependency resolution and our override is ignored. The actual deployed environment still needs either (a) the same override applied at the workspace level, or (b) an upstream fix in the `gaxios → google-auth-library → @anthropic-ai/vertex-sdk → openclaw` chain. See [SECURITY.md](./SECURITY.md) for the full vulnerability-handling stance.

### Changed
- Resource attributes are now built explicitly. The OpenTelemetry NodeSDK's automatic resource detection is disabled, which removes high-cardinality `process.pid`, `process.command_args`, `process.executable_path`, and `host.id` attributes that previously appeared on every metric.
- `host.name` is now set on log records as well as metrics. Reads from `OTEL_RESOURCE_ATTRIBUTES` env if present, falling back to `os.hostname()`.
- Histogram metric names are normalized against their unit metadata. A name like `openclaw.run.duration_ms` with `unit="ms"` now ships as `openclaw_run_duration_milliseconds_*` instead of the double-suffixed `openclaw_run_duration_ms_milliseconds_*`.

### Removed
- Dropped the redundant `openclaw.log.level` log attribute. The OTel-canonical `severity_text` and `severity_number` carry the same information and are what Grafana's UI reads.
- `code.function` and `code.lineno` are no longer emitted when the function name matches a known-bad value (currently: `logToFile`) that points to logger plumbing rather than the actual call site. This is a tactical workaround pending an upstream fix to the diagnostic-event frame capture.

## [0.1.0] — 2026-05-04

### Added
- Initial release.
- OpenTelemetry exporter plugin for OpenClaw, subscribing to the plugin SDK's `onDiagnosticEvent` bus and emitting signals via OTLP/HTTP.
- Logs, metrics, and traces all routed through standard `@opentelemetry/sdk-{logs,metrics,node}` exporters.
- Support for content-capture policy, rate sampling, gen_ai semconv attributes.
