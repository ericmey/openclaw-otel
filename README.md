# openclaw-otel

OpenClaw OpenTelemetry exporter — fork of [`@openclaw/diagnostics-otel`](https://github.com/openclaw/openclaw) with field-mapping fixes for Grafana / LGTM-stack consumers.

## Why this fork exists

The upstream `@openclaw/diagnostics-otel` plugin works, but a thorough audit (see "integration baseline" doc in the harem-world vault) identified field-mapping issues that block several common Grafana workflows:

- No `host.name` on log records (only on metrics) — cross-host log queries silently produce wrong results
- `code_function` always reports the OTel plumbing, not the real caller frame
- Double-suffix metric names (`_ms_milliseconds`)
- Redundant `openclaw_log_level` alongside the OTel-canonical `severity_text`
- No `trace_id` / `span_id` on log records, even when emitted inside a traced operation — defeats `tracesToLogsV2` correlation
- High-cardinality `process.pid`, `process.command_args`, `process.executable_path`, `host.id` auto-promoted to metric labels — series multiply on every restart

This fork addresses each of those without otherwise changing behavior.

## Status

**v0.1.0 — parity ingest.** Source is identical to `@openclaw/diagnostics-otel@2026.5.2` except for:
- Repackaged as standalone npm package `openclaw-otel` (no workspace dependency)
- Plugin id renamed `diagnostics-otel` → `openclaw-otel` so both plugins can be installed simultaneously during cutover

No behavior changes yet. Audit fixes land as discrete commits in the v0.2.0 sequence.

## Install (local file install for testing)

```bash
# in the openclaw npm workspace on your host:
cd ~/.openclaw/npm
npm install /path/to/openclaw-otel/openclaw-otel-0.1.0.tgz
```

Then enable in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openclaw-otel": { "enabled": true }
    }
  }
}
```

## Cutover from `@openclaw/diagnostics-otel`

When the audit fixes have landed and you want to replace upstream:

```json
{
  "plugins": {
    "entries": {
      "diagnostics-otel": { "enabled": false },
      "openclaw-otel": { "enabled": true }
    }
  }
}
```

Hot-reload openclaw. Verify your Grafana dashboards keep populating.

## License

MIT — same as upstream. See LICENSE.
