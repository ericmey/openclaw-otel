import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createDiagnosticsOtelService } from "./src/service.js";

export default definePluginEntry({
  id: "openclaw-otel",
  name: "OpenClaw OpenTelemetry",
  description: "Export OpenClaw diagnostic events to OpenTelemetry. Fork of @openclaw/diagnostics-otel with field-mapping fixes.",
  register(api) {
    api.registerService(createDiagnosticsOtelService());
  },
});
