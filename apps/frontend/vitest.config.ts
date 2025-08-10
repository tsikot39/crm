import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "clover", "json"],
      exclude: [
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
