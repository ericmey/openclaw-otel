# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Resource attributes are now built explicitly. The OpenTelemetry NodeSDK's automatic resource detection is disabled, which removes high-cardinality `process.pid`, `process.command_args`, `process.executable_path`, and `host.id` attributes that previously appeared on every metric.
- `host.name` is now set on log records as well as metrics. Reads from `OTEL_RESOURCE_ATTRIBUTES` env if present, falling back to `os.hostname()`.

### Removed
- Dropped the redundant `openclaw.log.level` log attribute. The OTel-canonical `severity_text` and `severity_number` carry the same information and are what Grafana's UI reads.

## [0.1.0] — 2026-05-04

### Added
- Initial release.
- OpenTelemetry exporter plugin for OpenClaw, subscribing to the plugin SDK's `onDiagnosticEvent` bus and emitting signals via OTLP/HTTP.
- Logs, metrics, and traces all routed through standard `@opentelemetry/sdk-{logs,metrics,node}` exporters.
- Support for content-capture policy, rate sampling, gen_ai semconv attributes.
