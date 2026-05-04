# openclaw-otel

OpenTelemetry exporter for OpenClaw. Ships diagnostic events from the OpenClaw runtime as OTel logs, metrics, and traces, with field shapes that work cleanly in Grafana and the broader LGTM (Loki / Tempo / Mimir) stack.

## What it does

OpenClaw exposes a typed plugin API including a diagnostic event bus (`onDiagnosticEvent`). This plugin subscribes to that bus and emits the events as standard OpenTelemetry signals to an OTLP/HTTP endpoint.

You get:

- **Logs** with proper `severity_text` / `severity_number` per OTel spec, `host.name` and `service.name` populated, and trace context (`trace_id` / `span_id`) injected automatically when the log is emitted inside an active span.
- **Metrics** following OTel semantic conventions — `_total` for counters, `_milliseconds` / `_seconds` / `_bytes` for unit-bearing metrics, no double-suffixed names, no high-cardinality auto-injected process labels.
- **Traces** with W3C trace context propagation across operations, span names following `<namespace>.<operation>` convention.

The data lands in your collector / backend with the labels Grafana expects out of the box — Log Levels dropdown populates, `tracesToLogsV2` correlation works, service-graph view shows real edges.

## Install

```bash
# In your OpenClaw npm workspace (typically ~/.openclaw/npm/):
npm install openclaw-otel
```

Enable in `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openclaw-otel": { "enabled": true }
    }
  }
}
```

Hot-reload OpenClaw or restart the gateway. The plugin discovers the OTLP endpoint from standard environment variables.

## Configuration

Configure via environment variables (standard OTel conventions):

| Variable | Purpose | Example |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base OTLP/HTTP endpoint | `http://collector.example.com:4318` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Override for traces only | `http://traces.example.com:4318/v1/traces` |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Override for metrics only | (similar) |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override for logs only | (similar) |
| `OTEL_SERVICE_NAME` | Service identity | `openclaw-prod-1` |
| `OTEL_RESOURCE_ATTRIBUTES` | Resource attributes (key=value, comma-separated) | `host.name=host01,deployment.environment=prod` |

The plugin also respects the per-plugin `config` block in `openclaw.json` if you prefer config over env. See `openclaw.plugin.json` for the schema.

## Requirements

- Node.js 22.0 or newer
- OpenClaw 2026.5.3 or newer (peer dependency)

## Field shape reference

Logs ship to your backend with at minimum:

- `service.name` — your configured service identity
- `service.version` — populated from `OTEL_RESOURCE_ATTRIBUTES` if set
- `host.name` — derived from `OTEL_RESOURCE_ATTRIBUTES`, falling back to `os.hostname()`
- `deployment.environment` — from `OTEL_RESOURCE_ATTRIBUTES`, default left to your collector
- `severity_text` (uppercase: `INFO` / `WARN` / `ERROR`) and `severity_number` (OTel-canonical: 9 / 13 / 17)
- `trace_id` and `span_id` when emitted within an active span scope
- `code.function` and `code.lineno` reflecting the actual call site

Metrics ship with:

- `service.name`, `service.version`, `host.name`, `deployment.environment` as the resource scope
- No `process.pid`, `process.command_args`, `process.executable_path`, or `host.id` — these are deliberately not promoted to labels (they multiply series on every restart)
- Unit-suffixed names where applicable (`_milliseconds`, `_seconds`, `_bytes`) without source-side double-suffixes

Traces ship with W3C trace context preserved across child spans and outbound RPCs.

## Development

```bash
npm install
npm run typecheck
npm test
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full development guide and [`CLAUDE.md`](./CLAUDE.md) for conventions when working with this repo via Claude Code or other AI agents.

## License

MIT — see [`LICENSE`](./LICENSE).
