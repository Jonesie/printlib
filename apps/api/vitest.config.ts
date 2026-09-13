import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      ADMIN_PASSWORD: "test-password",
      SESSION_SECRET: "test-secret",
      DATA_DIR: path.join(os.tmpdir(), `printlib-test-${process.pid}-${Date.now()}`),
    },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
    },
  },
});
