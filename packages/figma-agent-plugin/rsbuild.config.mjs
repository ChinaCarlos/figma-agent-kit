import { defineConfig } from "@rsbuild/core";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiHtml = readFileSync(resolve(__dirname, "src/ui/ui.html"), "utf-8");

export default defineConfig({
  source: {
    entry: {
      code: "./src/main/code.ts",
    },
    define: {
      __html__: JSON.stringify(uiHtml),
    },
  },
  output: {
    distPath: {
      root: "dist",
      js: ".",
    },
    filename: {
      js: "code.js",
    },
    cleanDistPath: true,
    legalComments: "none",
  },
  performance: {
    chunkSplit: {
      strategy: "all-in-one",
    },
  },
  tools: {
    rspack: {
      target: "web",
      output: {
        iife: false,
      },
    },
  },
});
