import { defineConfig } from "vitest/config";

// The site is served from https://mbartonftp.github.io/georilla/
export default defineConfig({
  base: "/georilla/",
  build: { target: "es2020" },
  test: { environment: "node" }
});
