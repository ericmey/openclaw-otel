# openclaw-otel — agent working notes

This is the project file for Codex, Claude, or any other AI tool
working in this repo. Short by design — read it once when you start,
then move.

## What this project is

`openclaw-otel` is an OpenTelemetry exporter plugin for OpenClaw. It
subscribes to the OpenClaw plugin SDK's `onDiagnosticEvent` bus,
translates events to OTel signals (logs, metrics, traces), and ships
them to an OTLP/HTTP endpoint. Field shapes are tuned for clean
ingestion into Grafana and LGTM-stack backends (Loki / Tempo / Mimir).

The README has the full picture for end-users; this file is for
contributors and AI agents.

## Development workflow

```bash
npm install
npm run typecheck       # tsc --noEmit
npm run lint            # biome check
npm test                # vitest run
npm run test:coverage   # vitest run --coverage
npm run build           # tsc -p tsconfig.build.json (emit dist/)
```

CI runs lint + typecheck + tests on Node 22 and 24, plus a coverage
job and a build job that smoke-tests the published tarball.

The plugin is loaded by OpenClaw at runtime. To test changes against
a real OpenClaw install:

```bash
npm pack            # runs prepack → emits dist/, produces openclaw-otel-<version>.tgz
# on the openclaw host:
cd ~/.openclaw/npm
npm install /path/to/openclaw-otel-*.tgz
# enable in openclaw.json plugins.entries, hot-reload openclaw
```

## Commit conventions

- Conventional commits (`fix:`, `feat:`, `chore:`, etc.)
- Reference issue numbers or finding IDs in commit messages when
  applicable. The original development of this plugin tracked an
  external audit in private docs; commits in this repo's history
  reference those finding IDs (e.g. `fix(F1.6): ...`) — that
  convention is intentional and convenient even if a given reader
  doesn't have access to the source audit.
- Co-author the assisting AI on AI-generated commits per
  conventional `Co-Authored-By:` trailers.

## Code conventions

- TypeScript strict, ESM modules, target Node 22+
- The main runtime lives in `src/service.ts`. It's a single large
  file — don't split it without good reason. The shape mirrors what
  OpenClaw expects from a plugin service.
- Test files alongside source as `*.test.ts` (vitest mocks).
- Helpers near the top of `service.ts`, main service factory near the
  bottom.

## How to add a fix

1. Locate the relevant code path (often the diagnostic-event handlers
   inside `createDiagnosticsOtelService` in `src/service.ts`).
2. Add the fix with a comment explaining the *why* (not the *what*).
3. Update or add a test that asserts the fixed behavior.
4. Verify `npm run lint`, `npm run typecheck`, `npm test`, and
   `npm run build` all pass before committing.

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
