import { defineConfig } from "vitest/config";

// Dedicated config so unit tests never pull in the app's Vite plugin chain
// (TanStack Start, nitro, Tailwind, etc.) — this project's tests are plain
// TypeScript logic (src/lib) that needs nothing beyond a TS transform.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
