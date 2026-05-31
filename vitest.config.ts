import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["actions/**", "lib/auth/**", "lib/supabase/**", "proxy.ts", "app/login/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/types.ts", "lib/supabase/client.ts", "lib/supabase/server.ts"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
