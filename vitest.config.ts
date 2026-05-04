import { defineConfig } from "vitest/config";

/**
 * Coverage thresholds are a ratchet, not an aspiration.
 *
 * The numbers below are pinned slightly under our current coverage
 * (measured 2026-05-04: statements 84.76% · branches 70.67% ·
 * functions 92% · lines 85.08%). They serve as a regression gate:
 * the build fails if coverage drops below these floors.
 *
 * Target: 80% across the board. Branches at 70% is the weakest spot
 * and the priority area for new test work. New code must come with
 * tests that move the needle UP — never down. When all four metrics
 * comfortably clear 80%, raise these floors.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // index.ts is plugin-loader plumbing (just registers the service) —
      // can't be exercised in isolation; tested via the openclaw runtime.
      // api.ts is type re-exports — no executable code paths.
      exclude: ["src/**/*.test.ts", "**/node_modules/**", "index.ts", "api.ts"],
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
