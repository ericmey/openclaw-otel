# openclaw-otel — agent working notes

This is the project file for Codex, the Aoi agent, or any other
AI tool working in this repo. Short by design — read it once when you
start, then move.

## What this project is

`openclaw-otel` is an OpenTelemetry exporter plugin for OpenClaw. It
subscribes to the OpenClaw plugin SDK's `onDiagnosticEvent` bus,
translates events to OTel signals (logs, metrics, traces), and ships
them to an OTLP/HTTP endpoint. Field shapes are tuned for clean
ingestion into Grafana and LGTM-stack backends.

The full design rationale lives in the harem-world vault at
`wiki/services/observability/integration-baseline.md` and
`wiki/services/observability/replacement-plugin-spec.md`. If you have
access to that vault, read those first — they explain the *why* behind
the field-shape choices in the code.

## Development workflow

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # node --test with TS strip
```

The plugin is loaded by OpenClaw at runtime. To test changes against
a real OpenClaw install:

```bash
npm pack            # produces openclaw-otel-<version>.tgz
# on the openclaw host:
cd ~/.openclaw/npm
npm install /path/to/openclaw-otel-*.tgz
# enable in openclaw.json plugins.entries, hot-reload openclaw
```

## Commit conventions

- Conventional commits (`fix:`, `feat:`, `chore:`, etc.)
- Reference audit findings as `(F1.6)`, `(F2.3)` etc. when applicable —
  the audit doc lives in the vault and findings are stable IDs
- Co-author Codex on AI-assisted commits per the repo's pattern

## Code conventions

- TypeScript strict, ESM modules, target Node 22+
- The main runtime lives in `src/service.ts`. It's a single large
  file — don't split it without good reason. The shape mirrors what
  OpenClaw expects from a plugin service.
- Test files alongside source as `*.test.ts`
- Helpers near the top of `service.ts`, main service factory near the
  bottom

## How to add a new audit-finding fix

1. Locate the relevant code path (often the diagnostic-event handlers
   inside `createDiagnosticsOtelService` in `src/service.ts`).
2. Add the fix, comment-tagged with the finding ID
   (`// F1.X (audit fix): ...`).
3. Update or add a test that asserts the fixed behavior.
4. Commit with finding reference in the message.

## When in doubt

- The plugin SDK types live in the `openclaw` peer dependency at
  `openclaw/plugin-sdk/...`. When you need to know what an event
  payload contains, look there first.
- Don't reinvent OTel primitives. Use `@opentelemetry/api`,
  `@opentelemetry/sdk-logs`, `@opentelemetry/sdk-metrics`,
  `@opentelemetry/sdk-node`. They're already dependencies.
- Find → report → discuss → approve → code. Especially for changes
  that affect what fields are emitted — those are the contract with
  every downstream consumer.
