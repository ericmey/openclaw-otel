# openclaw-otel v2 — design

> Status: design draft 2026-05-06. Implementation will land across multiple PRs after sign-off.
>
> Companion docs: [`README.md`](../README.md) (consumer-facing), upstream openclaw PR (forthcoming, links here as the validation case for the new opt-in capability attribute).

## Goal

Make the gateway's runtime causality **readable from Grafana** without SSH log archaeology. After v2 lands, an operator should be able to look at one dashboard and answer "Why was Discord slow at 13:42?" by reading off the panels — not by ssh-ing in to grep stderr or replay a stability snapshot.

The implicit subgoal is correctness in the face of the **observer effect**: today, a `channels.status --deep` probe can itself cause the metric it's reporting on (event-loop pressure) by sampling a window so short that single CPU bursts dominate. The new export must distinguish "real sustained pressure" from "diagnostic-induced sampling noise."

## Non-goals

- Replacing `diagnostics-prometheus` (the bundled Prometheus exporter). Operators who only run Prometheus should still use it, and the gap there (no `diagnostic.liveness.warning` support) deserves a separate small upstream PR — not this plugin's problem.
- Shipping a Grafana dashboard. The plugin emits the signals; the dashboard is a consumer concern (lives in the host wiki / observability stack).
- General-purpose tracing of openclaw internals beyond what the diagnostic event bus exposes. We're a bus consumer, not a runtime instrumenter.

## Coverage matrix

Each row is one observable concern. Implementation choice (metric / log / span / attribute) is judgment-based — the principle is "use whichever signal type matches the operational question."

| Concern | Today | v2 shape | Why this signal type |
|---|---|---|---|
| Event-loop interval | Single number in `channels.status` | Metric: `openclaw_event_loop_interval_milliseconds` (gauge, current sample) + `_p99` and `_max` companions | Continuous time-series; Grafana plots the trend |
| Event-loop utilization | Single number, conflated with sample window | Metric: `openclaw_event_loop_utilization` (gauge, 0–1) with `sample_window_ms` attribute | The attribute is what enables observer-effect filtering |
| CPU core ratio | Single number | Metric: `openclaw_cpu_core_ratio` (gauge) with `sample_window_ms` attribute | Same |
| Liveness degraded | Stderr log line, lost to LGTM | Log + metric: `openclaw_liveness_degraded` (gauge 0/1) + structured log with `reasons[]`, `active`, `waiting`, `queued`, `eventLoopUtilization`, `cpuCoreRatio` attributes | Both: alerts run on the metric; postmortem reads the log |
| Sample-window observer effect | Invisible | Attribute on every event-loop sample: `triggered_by_rpc=<method>` when the sample was reset by a status-class RPC | The single most important new datum — explains away false degraded reports |
| Gateway RPC duration | Tail-only stderr trace | Histogram: `openclaw_rpc_duration_milliseconds` with `method` attribute, separate boundary set tuned for `health`/`status`/`channels.status` (sub-ms expected) vs `chat.history`/`sessions.list` (10s of ms expected) | Histogram for percentiles; method as label so we can filter |
| Active work pressure | "Liveness warning" log only | Metrics: `openclaw_active_operations`, `openclaw_active_replies`, `openclaw_active_embedded_runs`, `openclaw_lane_queue_depth` (all gauges) with `lane`, `agent_id`, `session_key` attributes | Metrics enable correlation across panels; attributes enable per-agent filtering |
| Work phase | Buried in agent logs | Span attribute: `openclaw.phase` set on the active span (`prompt_build`, `model_call`, `tool_use`, `reply_emit`, etc.) | Spans for causality; phase changes propagate via context |
| Plugin lifecycle | Stderr log lines per plugin | Metric: `openclaw_plugin_bootstrap_duration_milliseconds` (histogram) with `plugin_id` and `phase` attributes (`startup` / `runtime`) + counter `openclaw_plugin_load_total` | Distinguishes initial startup load from in-turn reloads (the Musubi-keeps-loading suspect) |
| Reload contention | Buried in reload-defer log | Span: `openclaw.config.reload` with attributes for `changed_paths[]`, `blocking_operations`, `defer_duration_ms`, `outcome` | Span because it has start/end + nested context; attributes for the rich detail |
| Model/provider latency | Some tail-only | Histogram: `openclaw_model_request_duration_milliseconds` with `provider`, `model`, `agent_id`, `outcome` (`success`/`timeout`/`failover`/`error`) attributes | Standard histogram with rich attributes; correlate with active work via `agent_id` |
| Model retries / failovers | Embedded-run log only | Counter: `openclaw_model_retry_total`, `openclaw_model_failover_total` with `provider`, `from_model`, `to_model`, `reason` attributes | Counters for rate panels; attributes for the migration story |
| Discord/channel startup | Per-bot startup logs | Span: `openclaw.channel.bot.start` per bot, with `account_id`, `delay_ms`, `outcome` | Captures startup-stagger explicitly; supports "is the test landing during startup?" check |

## Sample-window awareness — the load-bearing design choice

The 2026-05-06 incident showed `channels.status` reporting `eventLoopUtilization=1` and `cpuCoreRatio≈1` while process sampling proved the gateway was idle. Root cause hypothesis: status RPCs reset a tiny sample window, and the next CPU tick (often the status RPC's own work) fills the window, producing a 100% utilization reading that's mathematically true but operationally meaningless.

v2 addresses this in two layers:

1. **At sample emission**, attach `sample_window_ms` to every event-loop / cpu metric. Downstream queries can filter `where sample_window_ms > N` to suppress untrustably-short samples in dashboards and alerts.

2. **At RPC boundary**, when a status-class RPC (`channels.status`, `health`, `status`) triggers a sample reset, attach `triggered_by_rpc=<method>` to that sample. This makes the observer effect explicit in telemetry — the operator can see "this 100% utilization sample was the byproduct of a status check, not real work."

Combined, these turn "is this real?" from a hypothesis into a query.

The actual sampling fix (don't reset the window on status reads) belongs upstream in openclaw core — Yua's call-out, included in the upstream PR plan. Until that lands, v2's attributes give us the workaround.

## Manifest opt-in attribute (W2 dependency)

v2 declares its capability requirement in `openclaw.plugin.json`:

```jsonc
{
  "id": "openclaw-otel",
  "metadata": {
    "openclaw": {
      "requires": {
        "internalDiagnostics": true
      }
    }
  }
}
```

Forward-compatible: the host today (pre-PR) ignores unknown metadata keys, so this attribute can ship in v2 immediately. Once the upstream PR lands, the host honors the attribute via the new gate path. Until then, the local runtime patch (`_tools/openclaw-otel-gate-patch`) bridges.

## Acceptance criteria

For a reported "Discord slow" incident, an operator with the v2 dashboard must be able to identify the dominant cause within 60 seconds, picking from these mutually exclusive buckets:

1. **Real sustained event-loop pressure** — `event_loop_utilization > 0.8` for ≥30s, `sample_window_ms > 100`, no `triggered_by_rpc` markers
2. **Sample-window artifact** — high utilization on samples with `sample_window_ms < 50`
3. **Status/RPC observer effect** — high utilization with `triggered_by_rpc` set
4. **Model/provider latency** — `model_request_duration_milliseconds_p99` elevated for the affected provider; `model_retry_total` rate up; correlate with `agent_id`
5. **Plugin bootstrap overhead** — `plugin_bootstrap_duration` non-zero during the incident window with `phase=runtime`
6. **Reload contention** — `openclaw.config.reload` span with non-zero `defer_duration_ms` overlapping the incident
7. **Discord/channel startup pressure** — `openclaw.channel.bot.start` spans active during the incident; bot count not yet at full strength

These are the seven buckets Yua named. v2 is done when the dashboard can answer the question.

## Implementation phasing

- **Phase 1 (foundation):** Manifest opt-in attribute + sample-window attribute on existing event-loop metrics. Smallest diff, highest signal.
- **Phase 2 (RPC histogram + observer-effect markers):** RPC duration histogram with method attribute; `triggered_by_rpc` propagation through the sampler.
- **Phase 3 (active work pressure):** Promote liveness-warning log into structured metrics. Requires care — the `agent_id`/`session_key` attributes must be low-cardinality enough not to explode Mimir series.
- **Phase 4 (plugin lifecycle + reload contention):** Bootstrap timing + reload spans. Needs upstream cooperation if first-class events aren't on the bus yet (Yua's third upstream ask).
- **Phase 5 (model/provider latency):** Provider-side histograms. Coordinate with the agents-runtime team if the bus events aren't rich enough.

Each phase ships independently. Phase 1 + 2 together solve the immediate "why was Discord slow" question for transport-layer issues. Phase 3 + 5 add the agent/model causality. Phase 4 closes the plugin-bootstrap and reload-contention story.

## Open questions

- **Cardinality budget.** Mimir tolerates moderate per-metric series counts but punishes unbounded. `agent_id` is bounded (<20 active agents). `session_key` could explode (one per Discord channel × per agent × per turn). Need to decide whether session_key is an attribute on metrics, or only on spans/logs (which Loki/Tempo handle differently).
- **Span sampling.** OTLP spans without sampling can saturate Tempo. Default to head-based sampling at 10% with parent-based propagation? Or always-on for spans tagged `incident=true`?
- **Backwards compatibility.** v2 is breaking only at the manifest level (new attribute). Metrics + log shapes are additive. We can ship as v2.0.0 (semver-major out of caution) but the migration story is "install, restart" — no operator action needed.

## Sign-off needed (before Phase 1 implementation)

- [ ] Eric: scope OK
- [ ] Yua: coverage matrix matches her ask
- [ ] Cardinality budget decision (per-metric series ceiling)
- [ ] Span sampling default
